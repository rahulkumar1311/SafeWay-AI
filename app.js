// ========================================
// DRIVE SAFE AI
// PHASE 4
// EYES + PERCLOS + YAWNING + HEAD MOVEMENT
// ========================================


// ========================================
// 1. HTML ELEMENTS
// ========================================

const video = document.querySelector("#camera");

const startBtn = document.querySelector("#start-btn");
const stopBtn = document.querySelector("#stop-btn");

const cameraMessage =
    document.querySelector("#camera-message");

const driverStatus =
    document.querySelector("#driver-status");

const fatigueRisk =
    document.querySelector("#fatigue-risk");

const eyeStatus =
    document.querySelector("#eye-status");

const yawningStatus =
    document.querySelector("#yawning-status");

const headStatus = document.querySelector("#head-status");
const headNods = document.querySelector("#head-nods");


// ========================================
// 2. GLOBAL VARIABLES
// ========================================

let cameraStream = null;

let monitoring = false;


// ========================================
// 3. EYE VARIABLES
// ========================================

let eyesClosed = false;

let eyesClosedStart = null;

let blinkCount = 0;

let eyeSamples = [];


// ========================================
// 4. PERCLOS SETTINGS
// ========================================

const SAMPLE_INTERVAL = 100;

const SAMPLE_WINDOW = 300;


// ========================================
// 5. YAWNING VARIABLES
// ========================================

let mouthOpen = false;

let yawnStart = null;

let yawnCount = 0;


// ========================================
// 6. HEAD MOVEMENT VARIABLES
// ========================================

let baselineNoseY = null;

let headDown = false;

let headDownStart = null;

let headNodCount = 0;


// How much the nose has to move downward
// relative to the face before we consider
// the head to be tilted downward.

const HEAD_DOWN_THRESHOLD = 0.08;


// Minimum time head must remain down

const HEAD_DOWN_TIME = 800;


// ========================================
// 7. DISTANCE FUNCTION
// ========================================

function distance(point1, point2) {

    return Math.sqrt(

        Math.pow(point1.x - point2.x, 2) +

        Math.pow(point1.y - point2.y, 2)

    );

}


// ========================================
// 8. EYE ASPECT RATIO
// ========================================

function calculateEAR(

    top1,
    top2,

    bottom1,
    bottom2,

    left,
    right

) {

    const vertical1 =
        distance(top1, bottom1);

    const vertical2 =
        distance(top2, bottom2);

    const horizontal =
        distance(left, right);


    return (

        (vertical1 + vertical2) /

        (2 * horizontal)

    );

}


// ========================================
// 9. MEDIAPIPE FACE MESH
// ========================================

const faceMesh = new FaceMesh({

    locateFile: function (file) {

        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;

    }

});


faceMesh.setOptions({

    maxNumFaces: 1,

    refineLandmarks: true,

    minDetectionConfidence: 0.5,

    minTrackingConfidence: 0.5

});


// ========================================
// 10. FACE RESULTS
// ========================================

faceMesh.onResults(function (results) {

    if (!monitoring) {

        return;

    }


    // ====================================
    // NO FACE
    // ====================================

    if (

        !results.multiFaceLandmarks ||

        results.multiFaceLandmarks.length === 0

    ) {

        driverStatus.innerText =
            "Face Not Detected";

        fatigueRisk.innerText =
            "—";

        eyeStatus.innerText =
            "No Face";

        yawningStatus.innerText =
            "No Face";

        return;

    }


    const landmarks =
        results.multiFaceLandmarks[0];


    // ====================================
    // PART 1
    // EYE DETECTION
    // ====================================

    const leftEAR = calculateEAR(

        landmarks[160],
        landmarks[158],

        landmarks[144],
        landmarks[153],

        landmarks[33],
        landmarks[133]

    );


    const rightEAR = calculateEAR(

        landmarks[385],
        landmarks[387],

        landmarks[380],
        landmarks[373],

        landmarks[362],
        landmarks[263]

    );


    const averageEAR =
        (leftEAR + rightEAR) / 2;


    const currentlyClosed =
        averageEAR < 0.20;


    // ====================================
    // EYE CLOSING
    // ====================================

    if (

        currentlyClosed &&

        !eyesClosed

    ) {

        eyesClosed = true;

        eyesClosedStart = Date.now();

    }


    // ====================================
    // EYE OPENING
    // ====================================

    if (

        !currentlyClosed &&

        eyesClosed

    ) {

        eyesClosed = false;


        const closedDuration =

            Date.now() -
            eyesClosedStart;


        const durationSeconds =

            closedDuration / 1000;


        // Blink

        if (

            durationSeconds >= 0.05 &&

            durationSeconds < 0.6

        ) {

            blinkCount++;

        }


        eyesClosedStart = null;

    }


    // ====================================
    // EYE STATUS
    // ====================================

    if (currentlyClosed) {

        eyeStatus.innerText =
            "Closed";

    }

    else {

        eyeStatus.innerText =
            "Open";

    }


    // ====================================
    // PERCLOS
    // ====================================

    eyeSamples.push({

        time: Date.now(),

        closed: currentlyClosed

    });


    while (

        eyeSamples.length > 0 &&

        Date.now() -
        eyeSamples[0].time >

        SAMPLE_WINDOW *
        SAMPLE_INTERVAL

    ) {

        eyeSamples.shift();

    }


    let closedSamples = 0;


    for (let sample of eyeSamples) {

        if (sample.closed) {

            closedSamples++;

        }

    }


    let perclos = 0;


    if (eyeSamples.length > 0) {

        perclos =

            closedSamples /
            eyeSamples.length;

    }


    const perclosPercentage =

        Math.round(perclos * 100);


    // ====================================
    // CURRENT EYE CLOSURE
    // ====================================

    let currentClosureSeconds = 0;


    if (eyesClosed) {

        currentClosureSeconds =

            (Date.now() -
            eyesClosedStart) / 1000;

    }


    // ====================================
    // PART 2
    // YAWNING DETECTION
    // ====================================

    const mouthVertical =

        distance(

            landmarks[13],

            landmarks[14]

        );


    const mouthHorizontal =

        distance(

            landmarks[78],

            landmarks[308]

        );


    const mouthRatio =

        mouthVertical /
        mouthHorizontal;


    const currentlyOpen =

        mouthRatio > 0.55;


    // Mouth opening

    if (

        currentlyOpen &&

        !mouthOpen

    ) {

        mouthOpen = true;

        yawnStart = Date.now();

    }


    // Mouth closing

    if (

        !currentlyOpen &&

        mouthOpen

    ) {

        mouthOpen = false;


        const yawnDuration =

            (Date.now() -
            yawnStart) / 1000;


        if (yawnDuration >= 1) {

            yawnCount++;

        }


        yawnStart = null;

    }


    // Yawning status

    if (currentlyOpen) {

        yawningStatus.innerText =
            "Mouth Open";

    }

    else {

        yawningStatus.innerText =
            "No";

    }


    // Current yawn duration

    let currentYawnDuration = 0;


    if (mouthOpen) {

        currentYawnDuration =

            (Date.now() -
            yawnStart) / 1000;

    }


// ========================================
// PART 3
// HEAD POSITION DETECTION
// ========================================

// Nose
const nose = landmarks[1];

// Left and right eyes
const leftEye = landmarks[33];
const rightEye = landmarks[263];

// Center of the eyes
const eyeCenterY =
    (leftEye.y + rightEye.y) / 2;

// Distance between eyes
const eyeDistance =
    distance(leftEye, rightEye);

// Normalize nose position
const normalizedNoseY =
    (nose.y - eyeCenterY) / eyeDistance;


// ========================================
// CREATE BASELINE
// ========================================

if (baselineNoseY === null) {

    baselineNoseY =
        normalizedNoseY;

}


// ========================================
// HEAD DIFFERENCE
// ========================================

const headDifference =
    normalizedNoseY - baselineNoseY;


// ========================================
// DETECT HEAD DOWN
// ========================================

const currentlyHeadDown =
    headDifference > 0.10;


// ========================================
// UPDATE HEAD STATUS
// ========================================

if (currentlyHeadDown) {

    headStatus.innerText =
        "Head Down";

} else {

    headStatus.innerText =
        "Normal";

}


// ========================================
// HEAD MOVED DOWN
// ========================================

if (

    currentlyHeadDown &&

    !headDown

) {

    headDown = true;

    headDownStart = Date.now();

}


// ========================================
// HEAD RETURNED
// ========================================

if (

    !currentlyHeadDown &&

    headDown

) {

    headDown = false;


    const headDownDuration =
        Date.now() - headDownStart;


    // Count as a nod if head stayed
    // down for at least 0.8 seconds

    if (
        headDownDuration >= 800
    ) {

        headNodCount++;

        headNods.innerText =
            headNodCount;

    }


    headDownStart = null;

}


// ========================================
// HEAD RISK
// ========================================

let headRisk = 0;


if (headDown) {

    headRisk += 15;

}


if (

    headDown &&

    headDownStart !== null &&

    Date.now() - headDownStart > 1500

) {

    headRisk += 20;

}


    // ====================================
    // EYE RISK
    // ====================================

    let eyeRisk = 0;


    if (
        currentClosureSeconds >= 0.5
    ) {

        eyeRisk += 20;

    }


    if (
        currentClosureSeconds >= 1
    ) {

        eyeRisk += 20;

    }


    if (
        currentClosureSeconds >= 2
    ) {

        eyeRisk += 25;

    }


    // PERCLOS

    if (
        perclosPercentage >= 10
    ) {

        eyeRisk += 10;

    }


    if (
        perclosPercentage >= 20
    ) {

        eyeRisk += 15;

    }


    // ====================================
    // YAWN RISK
    // ====================================

    let yawnRisk = 0;


    if (
        currentYawnDuration >= 1
    ) {

        yawnRisk += 15;

    }


    // ====================================
    // COMBINE ALL SIGNALS
    // ====================================

// ========================================
// PHASE 5
// FATIGUE DETECTION ENGINE
// ========================================


// ========================================
// 1. BASE SCORE
// ========================================

let risk = 0;


// ========================================
// 2. EYE CONTRIBUTION
// ========================================

risk += eyeRisk;


// ========================================
// 3. YAWNING CONTRIBUTION
// ========================================

risk += yawnRisk;


// ========================================
// 4. HEAD CONTRIBUTION
// ========================================

risk += headRisk;


// ========================================
// 5. BEHAVIOR COMBINATION
// ========================================

/*
    Multiple fatigue signals occurring
    together are more important than
    a single isolated signal.
*/


// Eyes closed + head down

if (
    eyesClosed &&
    headDown
) {

    risk += 20;

}


// Eyes closed + mouth open

if (
    eyesClosed &&
    mouthOpen
) {

    risk += 15;

}


// Head down + mouth open

if (
    headDown &&
    mouthOpen
) {

    risk += 15;

}


// All three signals together

if (
    eyesClosed &&
    headDown &&
    mouthOpen
) {

    risk += 25;

}


// ========================================
// 6. REPEATED YAWNS
// ========================================

if (yawnCount >= 3) {

    risk += 10;

}


if (yawnCount >= 5) {

    risk += 15;

}


// ========================================
// 7. REPEATED HEAD NODS
// ========================================

if (headNodCount >= 2) {

    risk += 10;

}


if (headNodCount >= 4) {

    risk += 15;

}


// ========================================
// 8. LIMIT SCORE
// ========================================

risk =
    Math.min(risk, 100);


    // ====================================
    // DISPLAY RISK
    // ====================================

    fatigueRisk.innerText =

        `${risk}%`;


// ========================================
// DRIVER STATUS
// ========================================

if (risk >= 75) {

    driverStatus.innerText =
        "DROWSY";

}

else if (risk >= 50) {

    driverStatus.innerText =
        "HIGH FATIGUE";

}

else if (risk >= 25) {

    driverStatus.innerText =
        "FATIGUE DETECTED";

}

else {

    driverStatus.innerText =
        "ALERT";

}


    // ====================================
    // DEBUG INFORMATION
    // ====================================

    console.log({

        EAR:
            averageEAR.toFixed(3),

        EyeClosed:
            currentlyClosed,

        PERCLOS:
            `${perclosPercentage}%`,

        Blinks:
            blinkCount,

        MouthRatio:
            mouthRatio.toFixed(3),

        Yawns:
            yawnCount,

        HeadDifference:
            headDifference.toFixed(3),

        HeadDown:
            headDown,

        HeadNods:
            headNodCount,

        EyeRisk:
            eyeRisk,

        YawnRisk:
            yawnRisk,

        HeadRisk:
            headRisk,

        TotalRisk:
            risk

    });

});


// ========================================
// 11. START MONITORING
// ========================================

startBtn.addEventListener(

    "click",

    async function () {

        try {

            cameraStream =

                await navigator.mediaDevices
                .getUserMedia({

                    video: true,

                    audio: false

                });


            video.srcObject =
                cameraStream;


            monitoring = true;


            // Reset eye data

            eyesClosed = false;

            eyesClosedStart = null;

            blinkCount = 0;

            eyeSamples = [];


            // Reset yawning

            mouthOpen = false;

            yawnStart = null;

            yawnCount = 0;


            // Reset head detection

            baselineNoseY = null;

            headDown = false;

            headDownStart = null;

            headNodCount = 0;


            cameraMessage.style.display =
                "none";


            startBtn.disabled = true;

            stopBtn.disabled = false;


            driverStatus.innerText =
                "Detecting...";

            fatigueRisk.innerText =
                "0%";

            eyeStatus.innerText =
                "Detecting...";

            yawningStatus.innerText =
                "Detecting...";


            // Start processing

            processVideo();

        }


        catch (error) {

            console.error(
                "Camera error:",
                error
            );


            alert(
                "Camera access failed. " +
                "Please allow camera permission."
            );

        }

    }

);


// ========================================
// 12. PROCESS VIDEO
// ========================================

async function processVideo() {

    if (!monitoring) {

        return;

    }


    await faceMesh.send({

        image: video

    });


    requestAnimationFrame(
        processVideo
    );

}


// ========================================
// 13. STOP MONITORING
// ========================================

stopBtn.addEventListener(

    "click",

    function () {

        monitoring = false;


        // Stop camera

        if (cameraStream) {

            const tracks =
                cameraStream.getTracks();


            tracks.forEach(

                function (track) {

                    track.stop();

                }

            );


            cameraStream = null;

        }


        video.srcObject =
            null;


        cameraMessage.style.display =
            "flex";


        startBtn.disabled = false;

        stopBtn.disabled = true;
    


// Reset dashboard

driverStatus.innerText =
    "Not Monitoring";

fatigueRisk.innerText =
    "0%";

eyeStatus.innerText =
    "No Data";

yawningStatus.innerText =
    "No Data";

headStatus.innerText =
    "No Data";

headNods.innerText =
    "0";


// Reset variables

eyesClosed = false;

eyesClosedStart = null;

blinkCount = 0;

eyeSamples = [];


mouthOpen = false;

yawnStart = null;

yawnCount = 0;


baselineNoseY = null;

headDown = false;

headDownStart = null;

    headNodCount = 0;

}
);


// ========================================
// GPS LOCATION
// ========================================

const gpsButton =
    document.querySelector("#gps-btn");

const gpsStatus =
    document.querySelector("#gps-status");

const gpsDot =
    document.querySelector("#gps-dot");

const latitude =
    document.querySelector("#latitude");

const longitude =
    document.querySelector("#longitude");

const gpsAccuracy =
    document.querySelector("#gps-accuracy");


// ========================================
// GET LOCATION
// ========================================

gpsButton.addEventListener(
    "click",
    function () {

        if (!navigator.geolocation) {

            gpsStatus.innerText =
                "GPS Not Supported";

            return;

        }


        gpsStatus.innerText =
            "Getting Location...";


        navigator.geolocation.getCurrentPosition(

            function (position) {

                const lat =
                    position.coords.latitude;

                const lon =
                    position.coords.longitude;

                const accuracy =
                    position.coords.accuracy;


                latitude.innerText =
                    lat.toFixed(6);


                longitude.innerText =
                    lon.toFixed(6);


                gpsAccuracy.innerText =
                    Math.round(accuracy) + " m";


                gpsStatus.innerText =
                    "GPS Connected";


                gpsDot.style.background =
                    "#57e89a";


                console.log(
                    "Vehicle Location:",
                    {
                        latitude: lat,
                        longitude: lon,
                        accuracy: accuracy
                    }
                );

            },

            function (error) {

                console.error(
                    "GPS Error:",
                    error
                );


                gpsStatus.innerText =
                    "Location Access Failed";


                gpsDot.style.background =
                    "#d9534f";

            }

        );

    }
);

// ========================================
// LOAD DRIVER PROFILE FROM BACKEND
// ========================================

fetch("http://localhost:3000/api/driver")

    .then(function (response) {

        return response.json();

    })

    .then(function (driver) {

        document.querySelector("#driver-name").innerText =
            driver.name;

        document.querySelector("#driver-id").innerText =
            driver.driverId;

        document.querySelector("#vehicle-number").innerText =
            driver.vehicleNumber;

        document.querySelector("#driver-experience").innerText =
            driver.experience + " Years";

        document.querySelector("#total-trips").innerText =
            driver.totalTrips;

        document.querySelector("#safety-score").innerText =
            driver.safetyScore + "/100";


        console.log(
            "Driver profile loaded:",
            driver
        );

    })

    .catch(function (error) {

        console.error(
            "Failed to load driver profile:",
            error
        );

    });