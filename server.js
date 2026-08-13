const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());


// ================================
// TEST ROUTE
// ================================

app.get("/", function (req, res) {

    res.json({
        message: "DriverSafe AI backend is running"
    });

});


// ================================
// DRIVER PROFILE
// ================================

app.get("/api/driver", function (req, res) {

    res.json({

        name: "Vinod Kumar",

        driverId: "DR-104",

        vehicleNumber: "BR-01-AB-1234",

        experience: 6,

        totalTrips: 38,

        safetyScore: 84

    });

});


// ================================
// START SERVER
// ================================

app.listen(3000, function () {

    console.log(
        "DriverSafe AI backend running on http://localhost:3000"
    );

});