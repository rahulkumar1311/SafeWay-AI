import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Eye, ArrowLeft, ShieldCheck, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CameraPreview } from '../components/CameraPreview';
import { DrowsinessStatus } from '../components/DrowsinessStatus';
import apiClient from '../services/api';

export const Drowsiness = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const timerRef = useRef(null);
  const isAnalyzingRef = useRef(false);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [drowsinessResult, setDrowsinessResult] = useState(null);
  const [sessionId, setSessionId] = useState(`session_${Date.now()}`);
  const [intervalMs] = useState(800); // 800ms inference interval

  /**
   * Request webcam access via navigator.mediaDevices.getUserMedia()
   */
  const handleStartCamera = async () => {
    setCameraError(null);
    setApiError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Webcam API (getUserMedia) is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      setSessionId(`session_${Date.now()}`);
    } catch (err) {
      console.error('[Webcam Error]', err);
      let errorMsg = 'Failed to access camera.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission was denied by the browser. Please allow camera permissions in site settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera device found on your system. Please connect a webcam.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Camera is already in use by another application.';
      }

      setCameraError(errorMsg);
      setIsCameraActive(false);
    }
  };

  /**
   * Stop webcam stream and clear tracks
   */
  const handleStopCamera = useCallback(() => {
    // Stop detection timer if active
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
    setIsDetecting(false);
    setIsAnalyzing(false);
    isAnalyzingRef.current = false;
  }, []);

  /**
   * Capture single frame from video element onto canvas and post to backend proxy
   */
  const captureAndAnalyzeFrame = useCallback(async () => {
    if (isAnalyzingRef.current) return; // Prevent request stacking

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== 4) return;

    try {
      isAnalyzingRef.current = true;
      setIsAnalyzing(true);
      setApiError(null);

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert captured frame to JPEG base64 string
      const frameData = canvas.toDataURL('image/jpeg', 0.7);

      // Send to Express Backend endpoint POST /api/ai/drowsiness/analyze
      const response = await apiClient.post('/ai/drowsiness/analyze', {
        sessionId,
        frameData
      });

      if (response && response.success && response.data) {
        setDrowsinessResult(response.data);
      } else {
        setApiError('Invalid or unexpected response structure from AI proxy.');
      }
    } catch (err) {
      console.error('[AI Inference Error]', err);
      const msg = err.message || 'AI Drowsiness Inference Service is currently unavailable.';
      setApiError(msg);
    } finally {
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
    }
  }, [sessionId]);

  /**
   * Toggle periodic detection timer
   */
  const handleToggleDetection = () => {
    if (isDetecting) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsDetecting(false);
    } else {
      if (!isCameraActive) return;
      setIsDetecting(true);
      // Run initial capture immediately then set periodic interval
      captureAndAnalyzeFrame();
      timerRef.current = setInterval(captureAndAnalyzeFrame, intervalMs);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleStopCamera();
    };
  }, [handleStopCamera]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Eye className="w-6 h-6 text-cyan-400" />
              Drowsiness Detection AI
            </h1>
            <p className="text-xs text-slate-400">
              Live MediaPipe Eye PERCLOS & Facial Attentiveness Analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" /> POST /api/ai/drowsiness/analyze
          </span>
        </div>
      </div>

      {/* Main Grid: Left Camera Preview, Right Status Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Preview & Controls (7 Cols) */}
        <div className="lg:col-span-7">
          <CameraPreview
            videoRef={videoRef}
            canvasRef={canvasRef}
            isCameraActive={isCameraActive}
            isDetecting={isDetecting}
            isAnalyzing={isAnalyzing}
            isDrowsy={drowsinessResult?.isDrowsy ?? false}
            drowsinessScore={drowsinessResult?.drowsinessScore ?? 0}
            cameraError={cameraError}
            onStartCamera={handleStartCamera}
            onStopCamera={handleStopCamera}
            onToggleDetection={handleToggleDetection}
          />
        </div>

        {/* Right Column: AI Status Metrics (5 Cols) */}
        <div className="lg:col-span-5">
          <DrowsinessStatus
            result={drowsinessResult}
            isDetecting={isDetecting}
            isAnalyzing={isAnalyzing}
            apiError={apiError}
            sessionId={sessionId}
          />
        </div>
      </div>
    </div>
  );
};

export default Drowsiness;
