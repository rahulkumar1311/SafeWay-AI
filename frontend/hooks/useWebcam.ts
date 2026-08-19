import { useRef, useState, useCallback, useEffect } from 'react';

export type CameraStatus =
  | 'CAMERA_PERMISSION_REQUIRED'
  | 'CAMERA_STARTING'
  | 'CAMERA_ACTIVE'
  | 'CAMERA_DENIED'
  | 'CAMERA_ERROR'
  | 'CAMERA_SWITCH_FAILED'
  | 'USB_MOBILE_CAMERA_NOT_DETECTED'
  | 'USB_MOBILE_CAMERA_DISCONNECTED';

export type CameraSourceType = 'LAPTOP_CAMERA' | 'USB_MOBILE_CAMERA';
export type CameraRoleType = 'DRIVER_CAMERA' | 'ROAD_CAMERA';

export interface ActiveTrackInfo {
  deviceId: string;
  label: string;
  width: number;
  height: number;
  frameRate: number;
  readyState: string;
}

export interface UseWebcamOptions {
  fps?: number; // Configurable frame rate (default 2 FPS = 500ms)
  jpegQuality?: number; // JPEG compression quality (0.1 to 1.0)
  targetWidth?: number; // Target processing width
  targetHeight?: number; // Target processing height
  onFrame?: (base64Frame: string) => void;
}

export function useWebcam(options: UseWebcamOptions = {}) {
  const {
    fps = 2,
    jpegQuality = 0.5,
    targetWidth = 480,
    targetHeight = 360,
    onFrame
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('CAMERA_PERMISSION_REQUIRED');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [cameraSource, setCameraSource] = useState<CameraSourceType>('LAPTOP_CAMERA');
  const [cameraRole, setCameraRole] = useState<CameraRoleType>('DRIVER_CAMERA');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [activeTrackInfo, setActiveTrackInfo] = useState<ActiveTrackInfo | null>(null);
  const [usbCameraDetected, setUsbCameraDetected] = useState<boolean>(false);
  const [usbDeviceLabel, setUsbDeviceLabel] = useState<string>('');

  const onFrameRef = useRef(onFrame);
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  // Enumerate videoinput devices without calling getUserMedia (prevents DroidCam DirectShow lock errors)
  const scanDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');

      setVideoDevices(videoInputs);
      console.log('[Camera] Available video devices:', videoInputs.map((d) => ({ deviceId: d.deviceId, label: d.label || 'Unnamed Camera' })));

      // Detect USB/External Phone Webcam (e.g. DroidCam, Android USB Webcam, Iriun, USB Camera, UVC)
      const usbDev = videoInputs.find((d) => {
        const label = d.label.toLowerCase();
        return (
          label.includes('droidcam') ||
          label.includes('usb') ||
          label.includes('mobile') ||
          label.includes('android') ||
          label.includes('phone') ||
          label.includes('external') ||
          label.includes('iriun') ||
          label.includes('webcam') ||
          label.includes('uvc') ||
          label.includes('obs')
        );
      });

      const isUsbFound = Boolean(
        usbDev ||
          (videoInputs.length > 1 &&
            videoInputs.some(
              (d) =>
                !d.label.toLowerCase().includes('integrated') &&
                !d.label.toLowerCase().includes('facetime') &&
                !d.label.toLowerCase().includes('built-in')
            ))
      );
      const foundUsb =
        usbDev ||
        (videoInputs.length > 1
          ? videoInputs.find(
              (d) =>
                !d.label.toLowerCase().includes('integrated') &&
                !d.label.toLowerCase().includes('facetime') &&
                !d.label.toLowerCase().includes('built-in')
            ) || videoInputs[1]
          : null);

      setUsbCameraDetected(isUsbFound);
      setUsbDeviceLabel(foundUsb ? foundUsb.label || 'USB Mobile Camera (DroidCam)' : '');

      return videoInputs;
    } catch (err) {
      console.warn('[Camera Enumeration Error]', err);
      return [];
    }
  }, []);

  // Stop active MediaStream tracks
  const stopStreamTracks = useCallback(() => {
    if (stream) {
      console.log('[Camera] Stopping existing MediaStream tracks...');
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActiveTrackInfo(null);
  }, [stream]);

  // Main start/switch camera handler with explicit deviceId binding & track verification
  const startCameraWithDevice = useCallback(
    async (targetSource?: CameraSourceType, targetDeviceIdOverride?: string) => {
      const activeSource = targetSource || cameraSource;
      try {
        setErrorMessage('');
        setCameraStatus('CAMERA_STARTING');

        const inputs = await scanDevices();

        if (inputs.length === 0) {
          setCameraStatus('CAMERA_ERROR');
          setErrorMessage('No videoinput devices found on this system.');
          return;
        }

        // Determine exact device ID based on user selection or request
        let targetDeviceId = targetDeviceIdOverride;

        if (!targetDeviceId && selectedDeviceId && inputs.some((d) => d.deviceId === selectedDeviceId)) {
          targetDeviceId = selectedDeviceId;
        }

        const usbDev =
          inputs.find((d) => {
            const label = d.label.toLowerCase();
            return (
              label.includes('droidcam') ||
              label.includes('usb') ||
              label.includes('mobile') ||
              label.includes('android') ||
              label.includes('phone') ||
              label.includes('external') ||
              label.includes('iriun') ||
              label.includes('webcam') ||
              label.includes('uvc') ||
              label.includes('obs')
            );
          }) ||
          (inputs.length > 1
            ? inputs.find(
                (d) =>
                  !d.label.toLowerCase().includes('integrated') &&
                  !d.label.toLowerCase().includes('facetime') &&
                  !d.label.toLowerCase().includes('built-in')
              ) || inputs[1]
            : null);

        const laptopDev =
          inputs.find(
            (d) =>
              d.label.toLowerCase().includes('integrated') ||
              d.label.toLowerCase().includes('facetime') ||
              d.label.toLowerCase().includes('built-in')
          ) || inputs[0];

        if (activeSource === 'USB_MOBILE_CAMERA') {
          if (targetDeviceId) {
            setSelectedDeviceId(targetDeviceId);
          } else if (usbDev) {
            targetDeviceId = usbDev.deviceId;
            setSelectedDeviceId(usbDev.deviceId);
          } else {
            console.warn('[Camera] USB Mobile Camera requested, but no USB/phone webcam device found in enumerateDevices()');
            setCameraStatus('USB_MOBILE_CAMERA_NOT_DETECTED');
            setErrorMessage(
              'USB MOBILE CAMERA NOT DETECTED: Ensure DroidCam or USB webcam mode is enabled on your phone and recognized by Windows.'
            );
            return;
          }
        } else {
          if (!targetDeviceId) {
            targetDeviceId = laptopDev ? laptopDev.deviceId : inputs[0].deviceId;
          }
          setSelectedDeviceId(targetDeviceId);
        }

        console.log(`[Camera] Requesting getUserMedia for source '${activeSource}' with deviceId: ${targetDeviceId}`);

        // Stop previous MediaStream tracks before creating a new stream
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }

        let newStream: MediaStream;
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            video: targetDeviceId ? { deviceId: { exact: targetDeviceId } } : true,
            audio: false
          });
        } catch (exactErr: any) {
          console.warn('[Camera] Exact deviceId constraint failed, retrying with soft deviceId constraint:', exactErr);
          newStream = await navigator.mediaDevices.getUserMedia({
            video: targetDeviceId ? { deviceId: targetDeviceId } : true,
            audio: false
          });
        }

        const track = newStream.getVideoTracks()[0];
        if (!track) {
          throw new Error('No active video track in returned MediaStream');
        }

        const settings = typeof track.getSettings === 'function' ? track.getSettings() : {};
        const activeDeviceId = settings.deviceId || targetDeviceId || '';
        const activeLabel = track.label || 'Webcam Device';
        const activeWidth = settings.width || 640;
        const activeHeight = settings.height || 480;
        const activeFrameRate = settings.frameRate || 30;

        // Attach track ended listener for hot-unplug detection
        track.onended = () => {
          console.warn('[Camera] Active video track ended/disconnected!');
          if (activeSource === 'USB_MOBILE_CAMERA') {
            setCameraStatus('USB_MOBILE_CAMERA_DISCONNECTED');
            setErrorMessage('USB MOBILE CAMERA DISCONNECTED: The connected phone webcam stream was closed or unplugged.');
          } else {
            setCameraStatus('CAMERA_ERROR');
            setErrorMessage('Camera stream was disconnected.');
          }
        };

        setStream(newStream);

        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = newStream;
          video.setAttribute('playsinline', 'true');
          video.setAttribute('autoplay', 'true');
          video.muted = true;

          // Step 3: Wait for loadedmetadata, canplay, or playing to guarantee non-zero video dimensions
          await new Promise<void>((resolve) => {
            if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
              resolve();
              return;
            }
            const onReady = () => {
              if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
                video.removeEventListener('loadedmetadata', onReady);
                video.removeEventListener('canplay', onReady);
                video.removeEventListener('playing', onReady);
                resolve();
              }
            };
            video.addEventListener('loadedmetadata', onReady);
            video.addEventListener('canplay', onReady);
            video.addEventListener('playing', onReady);
            setTimeout(resolve, 1000);
          });

          try {
            await video.play();
          } catch (playErr) {
            console.warn('[Camera] video.play() notice:', playErr);
          }

          // Requirement Step 3 Diagnostic Logging
          console.log('[DroidCam Debug]', {
            streamActive: newStream.active,
            tracks: newStream.getVideoTracks().map((t) => ({
              label: t.label,
              readyState: t.readyState,
              enabled: t.enabled,
              settings: typeof t.getSettings === 'function' ? t.getSettings() : {}
            })),
            videoReadyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            currentTime: video.currentTime
          });
        }

        setActiveTrackInfo({
          deviceId: activeDeviceId,
          label: activeLabel,
          width: activeWidth,
          height: activeHeight,
          frameRate: activeFrameRate,
          readyState: track.readyState
        });

        // Re-enumerate devices after permission grant to update labels
        if (navigator.mediaDevices?.enumerateDevices) {
          const updatedDevices = await navigator.mediaDevices.enumerateDevices();
          setVideoDevices(updatedDevices.filter((d) => d.kind === 'videoinput'));
        }

        setCameraStatus('CAMERA_ACTIVE');
      } catch (err: any) {
        console.error('[Webcam Error]', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraStatus('CAMERA_DENIED');
          setErrorMessage('Camera access permission was denied. Please allow camera access in browser settings.');
        } else if (err.name === 'OverconstrainedError') {
          setCameraStatus('CAMERA_SWITCH_FAILED');
          setErrorMessage('CAMERA SWITCH FAILED: The selected camera device could not satisfy video constraints.');
        } else {
          setCameraStatus('CAMERA_ERROR');
          setErrorMessage(
            activeSource === 'USB_MOBILE_CAMERA'
              ? 'USB Mobile Camera is unavailable or in use by another app. Ensure DroidCam is active.'
              : 'Camera device is unavailable or in use by another application.'
          );
        }
      }
    },
    [cameraSource, selectedDeviceId, stream, scanDevices]
  );

  const startCamera = useCallback(() => {
    return startCameraWithDevice();
  }, [startCameraWithDevice]);

  const stopCamera = useCallback(() => {
    stopStreamTracks();
    setCameraStatus('CAMERA_PERMISSION_REQUIRED');
  }, [stopStreamTracks]);

  // Handle camera source switch (Laptop vs USB Mobile)
  const changeCameraSource = useCallback(
    (newSource: CameraSourceType) => {
      setCameraSource(newSource);
      setSelectedDeviceId(''); // Reset explicit device selection to trigger auto-detection for target source
      startCameraWithDevice(newSource, '');
    },
    [startCameraWithDevice]
  );

  // Handle explicit video device selection
  const changeSelectedDevice = useCallback(
    (deviceId: string) => {
      setSelectedDeviceId(deviceId);
      startCameraWithDevice(cameraSource, deviceId);
    },
    [cameraSource, startCameraWithDevice]
  );

  // Initial device scanning on mount & devicechange event listener
  useEffect(() => {
    scanDevices();
    const handleDeviceChange = () => {
      console.log('[Camera] MediaDevices devicechange event fired.');
      scanDevices();
    };

    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }
    return () => {
      if (navigator.mediaDevices) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, [scanDevices]);

  // Step 3 & Step 5: Frame sampling interval with strict video readiness and canvas dimensions matching video
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (cameraStatus === 'CAMERA_ACTIVE') {
      const intervalMs = Math.max(100, Math.round(1000 / fps));
      intervalId = setInterval(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Requirement Step 3 & 5: Guarantee video.readyState >= 2, videoWidth > 0, videoHeight > 0, currentTime > 0
        if (
          video.paused ||
          video.ended ||
          video.readyState < 2 ||
          video.videoWidth === 0 ||
          video.videoHeight === 0 ||
          video.currentTime === 0
        ) {
          return;
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Requirement Step 5: Set canvas pixel dimensions to match video.videoWidth and video.videoHeight
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Requirement Step 5: Draw video frame onto canvas only when video is fully ready
        if (
          video.readyState >= 2 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        ) {
          ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        }

        // Solid Green Frame Filter Check (YUV Y=0, U=0, V=0 -> R=0, G=135+, B=0)
        try {
          const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let greenPixelCount = 0;
          const step = 64;
          const sampleCount = Math.floor(frameData.length / step);

          for (let i = 0; i < frameData.length; i += step) {
            const r = frameData[i];
            const g = frameData[i + 1];
            const b = frameData[i + 2];
            if (g > 110 && r < 40 && b < 40) {
              greenPixelCount++;
            }
          }

          if (sampleCount > 0 && greenPixelCount / sampleCount > 0.85) {
            console.warn(
              '[Camera Warning] Solid green frame detected from video stream. Skipping AI frame sampling until real video frames arrive.'
            );
            video.play().catch(() => {});
            return;
          }
        } catch (e) {
          // Ignore canvas read error if context is restricted
        }

        const base64Jpeg = canvas.toDataURL('image/jpeg', jpegQuality);

        if (onFrameRef.current) {
          onFrameRef.current(base64Jpeg);
        }
      }, intervalMs);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [cameraStatus, fps, jpegQuality]);

  // Clean up tracks on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return {
    videoRef,
    canvasRef,
    cameraStatus,
    errorMessage,
    cameraSource,
    setCameraSource: changeCameraSource,
    cameraRole,
    setCameraRole,
    videoDevices,
    selectedDeviceId,
    setSelectedDeviceId: changeSelectedDevice,
    activeTrackInfo,
    usbCameraDetected,
    usbDeviceLabel,
    scanDevices,
    startCamera,
    stopCamera
  };
}

export default useWebcam;

