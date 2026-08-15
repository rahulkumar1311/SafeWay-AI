import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  TrafficCone,
  ArrowLeft,
  Camera,
  CameraOff,
  Upload,
  Sparkles,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  AlertCircle,
  FileImage,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import { formatDate, formatConfidence } from '../utils/formatters';

export const TrafficSigns = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Uploaded File state
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
  const [uploadedBase64, setUploadedBase64] = useState(null);

  // Recognition Results state
  const [result, setResult] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  /**
   * Request webcam access
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
          facingMode: 'environment' // Prefer rear/traffic camera if available
        },
        audio: false
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
    } catch (err) {
      console.error('[Webcam Error]', err);
      let errorMsg = 'Failed to access camera.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission was denied. Please grant webcam permissions in browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera device found on your system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Camera is already in use by another program.';
      }

      setCameraError(errorMsg);
      setIsCameraActive(false);
    }
  };

  /**
   * Stop webcam stream
   */
  const handleStopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  }, []);

  /**
   * Send image base64 data to Express Backend POST /api/ai/traffic-sign/analyze
   */
  const sendForAnalysis = async (imageDataBase64) => {
    if (!imageDataBase64) return;

    try {
      setIsAnalyzing(true);
      setApiError(null);

      const response = await apiClient.post('/ai/traffic-sign/analyze', {
        imageData: imageDataBase64
      });

      if (response && response.success && response.data) {
        setResult(response.data);
      } else {
        setApiError('Invalid or unexpected response structure from Traffic Sign AI proxy.');
      }
    } catch (err) {
      console.error('[Traffic Sign AI Error]', err);
      const msg = err.message || 'AI Traffic Sign Inference Service is currently unavailable.';
      setApiError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Capture single frame from live video feed and analyze
   */
  const handleDetectFromCamera = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== 4) {
      setApiError('Camera feed is not ready for capture.');
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frameBase64 = canvas.toDataURL('image/jpeg', 0.8);
    sendForAnalysis(frameBase64);
  };

  /**
   * Handle user image file upload
   */
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setApiError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      setUploadedImagePreview(base64Data);
      setUploadedBase64(base64Data);
      setApiError(null);
      // Auto analyze uploaded image
      sendForAnalysis(base64Data);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Synthesize Spoken Audio Alert via SpeechSynthesis API
   */
  const handlePlayVoiceAlert = () => {
    if (!result) return;
    const textToSpeak = result.voiceAlertText || result.meaning || `Detected sign: ${result.signType}`;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop ongoing speech
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      handleStopCamera();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
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
              <TrafficCone className="w-6 h-6 text-cyan-400" />
              Traffic Sign Recognition AI
            </h1>
            <p className="text-xs text-slate-400">
              MobileNetV2 Classification Engine & Voice Alert Generator
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> POST /api/ai/traffic-sign/analyze
        </span>
      </div>

      {/* Input Mode Selector Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-card border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('camera')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'camera'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Live Camera Mode</span>
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'upload'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Image Upload Mode</span>
        </button>
      </div>

      {/* Main Grid: Left Viewport & Controls, Right AI Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Media & Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeTab === 'camera' ? (
            /* Live Camera Viewport */
            <div className="space-y-4">
              <div className="relative rounded-3xl overflow-hidden glass-card border border-slate-800 bg-slate-950 aspect-video shadow-2xl flex items-center justify-center">
                <canvas ref={canvasRef} className="hidden" />

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isCameraActive ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
                  }`}
                />

                {!isCameraActive && !cameraError && (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 text-slate-500">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                      <CameraOff className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300">Camera Access Off</p>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">
                        Click "Start Camera" below to activate live traffic sign scanning.
                      </p>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 text-rose-400">
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-rose-300">Camera Error</p>
                      <p className="text-xs text-rose-400/90 max-w-sm mt-1">{cameraError}</p>
                    </div>
                  </div>
                )}

                {isCameraActive && (
                  <div className="absolute top-4 left-4 pointer-events-none z-10">
                    <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-semibold text-slate-200 flex items-center gap-2 shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      Live Traffic Camera
                    </span>
                  </div>
                )}
              </div>

              {/* Camera Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-slate-800">
                <div className="flex items-center gap-3">
                  {!isCameraActive ? (
                    <button
                      onClick={handleStartCamera}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-105"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Start Camera</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopCamera}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-all"
                    >
                      <CameraOff className="w-4 h-4" />
                      <span>Stop Camera</span>
                    </button>
                  )}

                  {isCameraActive && (
                    <button
                      onClick={handleDetectFromCamera}
                      disabled={isAnalyzing}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
                    >
                      <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      <span>{isAnalyzing ? 'Analyzing Sign...' : 'Detect Sign'}</span>
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-slate-400">Manual On-Demand Capture</span>
              </div>
            </div>
          ) : (
            /* File Upload Mode Viewport */
            <div className="space-y-4">
              <div className="rounded-3xl glass-card border border-slate-800 bg-slate-950 p-6 text-center space-y-4 shadow-2xl">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                {uploadedImagePreview ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                    <img
                      src={uploadedImagePreview}
                      alt="Uploaded Traffic Sign"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl p-8 cursor-pointer transition-colors space-y-3 bg-slate-900/40"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-cyan-400">
                      <FileImage className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">Click to upload traffic sign image</p>
                      <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WebP format</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Actions Bar */}
              <div className="flex items-center justify-between p-4 rounded-2xl glass-card border border-slate-800">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-all"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Choose Image File</span>
                </button>

                {uploadedBase64 && (
                  <button
                    onClick={() => sendForAnalysis(uploadedBase64)}
                    disabled={isAnalyzing}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    <span>{isAnalyzing ? 'Re-analyzing...' : 'Analyze Sign Image'}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Recognition Results Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* API Error Box */}
          {apiError && (
            <div className="p-4 rounded-2xl glass-card border border-rose-500/30 bg-rose-950/20 text-rose-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold block text-rose-200">AI Service Communication Error</span>
                <p className="text-rose-300/90">{apiError}</p>
              </div>
            </div>
          )}

          {/* Classification Result Card */}
          <div className="p-6 rounded-3xl glass-card border border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">AI Classification Results</h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                MobileNetV2 Engine
              </span>
            </div>

            {result ? (
              <div className="space-y-5">
                {/* Detected Sign Title Badge */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Detected Sign Category
                  </span>
                  <div className="text-xl font-extrabold text-white text-cyan-300 flex items-center justify-between">
                    <span>{result.signType}</span>
                    <TrafficCone className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>

                {/* Meaning & Description */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Sign Meaning & Instruction
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    {result.meaning || 'No description provided.'}
                  </p>
                </div>

                {/* Recommended Action (if provided) */}
                {result.recommendedAction && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Recommended Driver Action
                    </span>
                    <p className="text-xs font-medium text-amber-200 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      {result.recommendedAction}
                    </p>
                  </div>
                )}

                {/* Voice Alert Spoken Text & Synthesizer Play Button */}
                <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Spoken Voice Alert
                    </span>
                    <button
                      onClick={handlePlayVoiceAlert}
                      className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce text-cyan-400' : ''}`} />
                      <span>{isPlayingAudio ? 'Speaking...' : 'Play Audio'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 font-mono">
                    "{result.voiceAlertText || result.meaning}"
                  </p>
                </div>

                {/* Confidence Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Model Confidence Score</span>
                    <span className="text-cyan-400 font-mono font-bold">
                      {formatConfidence(result.confidence)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, result.confidence * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Timestamp */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> Detected At:
                  </span>
                  <span className="text-slate-300">{formatDate(result.detectedAt)}</span>
                </div>
              </div>
            ) : (
              /* Awaiting Classification Placeholder */
              <div className="py-12 text-center space-y-3 text-slate-500">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <TrafficCone className="w-7 h-7" />
                </div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Awaiting sign capture. Start camera and click "Detect Sign" or upload an image file to view classification output.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficSigns;
