import React from 'react';
import { Camera, CameraOff, Play, Square, AlertCircle, Eye, Activity } from 'lucide-react';

export const CameraPreview = ({
  videoRef,
  canvasRef,
  isCameraActive,
  isDetecting,
  isAnalyzing,
  isDrowsy,
  drowsinessScore,
  cameraError,
  onStartCamera,
  onStopCamera,
  onToggleDetection
}) => {
  return (
    <div className="space-y-4">
      {/* Video Viewport Container */}
      <div className="relative rounded-3xl overflow-hidden glass-card border border-slate-800 bg-slate-950 aspect-video shadow-2xl flex items-center justify-center">
        {/* Hidden Canvas used for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isCameraActive ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
          }`}
        />

        {/* Camera Off Placeholder */}
        {!isCameraActive && !cameraError && (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 text-slate-500">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <CameraOff className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">Camera Access Stopped</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Click "Start Camera" below to grant browser webcam access for live facial drowsiness analysis.
              </p>
            </div>
          </div>
        )}

        {/* Camera Error Message Display */}
        {cameraError && (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 text-rose-400">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-300">Camera Access Error</p>
              <p className="text-xs text-rose-400/90 max-w-sm mt-1">{cameraError}</p>
            </div>
          </div>
        )}

        {/* Overlay Badges when Camera is Active */}
        {isCameraActive && (
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-semibold text-slate-200 flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Camera
              </span>

              {isDetecting && (
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 backdrop-blur-md border border-cyan-500/40 text-[11px] font-bold text-cyan-300 flex items-center gap-1.5 shadow-lg">
                  <Activity className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-cyan-400' : ''}`} />
                  AI Detecting
                </span>
              )}
            </div>

            {/* Critical Drowsiness Alert Overlay Banner */}
            {isDrowsy && (
              <span className="px-3 py-1 rounded-full bg-rose-600/90 text-white font-black text-xs tracking-wider uppercase animate-bounce shadow-xl shadow-rose-900/50 flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> Drowsiness Warning
              </span>
            )}
          </div>
        )}

        {/* Red Pulse Border when Drowsy */}
        {isDrowsy && (
          <div className="absolute inset-0 border-4 border-rose-500 rounded-3xl pointer-events-none animate-pulse z-20 shadow-[inset_0_0_30px_rgba(244,63,94,0.5)]" />
        )}
      </div>

      {/* Control Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl glass-card border border-slate-800">
        <div className="flex items-center gap-3">
          {!isCameraActive ? (
            <button
              onClick={onStartCamera}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera</span>
            </button>
          ) : (
            <button
              onClick={onStopCamera}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-all"
            >
              <CameraOff className="w-4 h-4" />
              <span>Stop Camera</span>
            </button>
          )}

          {isCameraActive && (
            <button
              onClick={onToggleDetection}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 transition-all hover:scale-105 ${
                isDetecting
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {isDetecting ? (
                <>
                  <Square className="w-4 h-4" />
                  <span>Stop Detection</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Detection</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
          <span>Inference Frequency:</span>
          <span className="text-cyan-400 font-bold">~800ms</span>
        </div>
      </div>
    </div>
  );
};
