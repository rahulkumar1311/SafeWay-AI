'use client';

import React, { useEffect, useRef } from 'react';
import {
  Eye,
  Camera,
  Play,
  Square,
  AlertTriangle,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Info,
  ShieldAlert
} from 'lucide-react';
import { useWebcam } from '@/hooks/useWebcam';
import { useLiveTrip } from '@/hooks/useLiveTrip';
import { useAudioAlerts } from '@/hooks/useAudioAlerts';

export default function DrowsinessPage() {
  const { playAlertSound, speakAlert, soundEnabled, setSoundEnabled } = useAudioAlerts();
  const { metrics, apiError, processFrame } = useLiveTrip('dashboard-session');

  const {
    videoRef,
    canvasRef,
    cameraStatus,
    errorMessage,
    cameraSource,
    setCameraSource,
    cameraRole,
    setCameraRole,
    videoDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    activeTrackInfo,
    usbCameraDetected,
    usbDeviceLabel,
    startCamera,
    stopCamera
  } = useWebcam({
    fps: 2,
    onFrame: processFrame
  });

  const lastAlertTimeRef = useRef<number>(0);

  // Continuous eye closure for >= 3 seconds -> Real Audio & Visual Alert with cooldown
  useEffect(() => {
    if (metrics.faceDetected && (metrics.alert || metrics.alertState === 'DROWSY' || metrics.eyeClosureDurationMs >= 3000)) {
      const now = Date.now();
      if (now - lastAlertTimeRef.current > 5000) {
        lastAlertTimeRef.current = now;
        if (soundEnabled) {
          playAlertSound(880, 'sawtooth', 0.8);
          speakAlert('Drowsiness detected. Please pull over and take a rest break immediately.');
        }
      }
    }
  }, [metrics.faceDetected, metrics.alert, metrics.alertState, metrics.eyeClosureDurationMs, soundEnabled, playAlertSound, speakAlert]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Eye className="w-4 h-4" />
            <span>AI Computer Vision Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-outfit">
            Driver Safety & Drowsiness Monitor
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time driver attentiveness, landmark EAR, and fatigue monitoring powered by AI inference.
          </p>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
            soundEnabled
              ? 'bg-slate-900 border-cyan-500/40 text-cyan-400'
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>{soundEnabled ? 'Audio Alerts Active' : 'Muted'}</span>
        </button>
      </div>

      {/* Camera Configuration Bar: Source & Role Scoping */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Camera Source</span>
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setCameraSource('LAPTOP_CAMERA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  cameraSource === 'LAPTOP_CAMERA' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Laptop Camera
              </button>
              <button
                onClick={() => setCameraSource('USB_MOBILE_CAMERA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  cameraSource === 'USB_MOBILE_CAMERA' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                USB Mobile Camera
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Camera Mode</span>
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setCameraRole('DRIVER_CAMERA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  cameraRole === 'DRIVER_CAMERA' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Driver Camera
              </button>
              <button
                onClick={() => setCameraRole('ROAD_CAMERA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  cameraRole === 'ROAD_CAMERA' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Road Camera
              </button>
            </div>
          </div>

          {videoDevices.length > 1 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Video Device</span>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                {videoDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Real Device Status Badge */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
          {cameraSource === 'USB_MOBILE_CAMERA' ? (
            cameraStatus === 'CAMERA_ACTIVE' ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                USB MOBILE CAMERA CONNECTED ✓ ({activeTrackInfo?.label || usbDeviceLabel || 'USB Phone'})
              </span>
            ) : cameraStatus === 'USB_MOBILE_CAMERA_NOT_DETECTED' ? (
              <span className="text-rose-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                USB MOBILE CAMERA NOT DETECTED
              </span>
            ) : cameraStatus === 'USB_MOBILE_CAMERA_DISCONNECTED' ? (
              <span className="text-rose-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                USB MOBILE CAMERA DISCONNECTED
              </span>
            ) : cameraStatus === 'CAMERA_SWITCH_FAILED' ? (
              <span className="text-rose-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                CAMERA SWITCH FAILED
              </span>
            ) : usbCameraDetected ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                USB WEBCAM READY ({usbDeviceLabel || 'External Phone'})
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                USB MOBILE CAMERA NOT DETECTED
              </span>
            )
          ) : (
            <span className="text-cyan-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              LAPTOP CAMERA ({activeTrackInfo?.label || 'Integrated Webcam'})
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-bold text-white">
                {cameraSource === 'USB_MOBILE_CAMERA' ? 'USB Mobile Driver Stream' : 'Live Driver Camera Stream'}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs">
              {cameraStatus === 'CAMERA_ACTIVE' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-bold">Monitoring Active</span>
                </>
              )}
              {cameraStatus === 'CAMERA_STARTING' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-spin" />
                  <span className="text-amber-400 font-bold">Connecting...</span>
                </>
              )}
              {cameraStatus === 'CAMERA_PERMISSION_REQUIRED' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <span className="text-slate-400">Standby</span>
                </>
              )}
              {(cameraStatus === 'CAMERA_DENIED' || cameraStatus === 'CAMERA_ERROR') && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-rose-400 font-bold">Camera Error</span>
                </>
              )}
            </div>
          </div>

          <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-2xl bg-slate-950"
              style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {cameraStatus === 'CAMERA_PERMISSION_REQUIRED' && (
              <div className="text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                  <Camera className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Camera Safety Monitor Paused</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  {cameraSource === 'USB_MOBILE_CAMERA'
                    ? 'Connect an Android phone via USB cable in webcam mode and click Start Monitoring.'
                    : 'Click Start Monitoring to initialize real-time driver attentiveness and landmark EAR fatigue detection.'}
                </p>
                <button
                  onClick={startCamera}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 mx-auto shadow-lg shadow-cyan-500/20"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Monitoring</span>
                </button>
              </div>
            )}

            {cameraStatus === 'CAMERA_STARTING' && (
              <div className="text-center p-6 space-y-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-300">Requesting webcam permission from browser...</p>
              </div>
            )}

            {(cameraStatus === 'CAMERA_DENIED' ||
              cameraStatus === 'CAMERA_ERROR' ||
              cameraStatus === 'CAMERA_SWITCH_FAILED' ||
              cameraStatus === 'USB_MOBILE_CAMERA_NOT_DETECTED' ||
              cameraStatus === 'USB_MOBILE_CAMERA_DISCONNECTED') && (
              <div className="text-center p-6 space-y-3 max-w-md">
                <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
                <h3 className="text-base font-bold text-white uppercase font-mono">
                  {cameraStatus === 'USB_MOBILE_CAMERA_NOT_DETECTED'
                    ? 'USB MOBILE CAMERA NOT DETECTED'
                    : cameraStatus === 'USB_MOBILE_CAMERA_DISCONNECTED'
                    ? 'USB MOBILE CAMERA DISCONNECTED'
                    : cameraStatus === 'CAMERA_SWITCH_FAILED'
                    ? 'CAMERA SWITCH FAILED'
                    : 'Camera Connection Failed'}
                </h3>
                <p className="text-xs text-rose-300 leading-relaxed font-sans">{errorMessage}</p>
                <button
                  onClick={startCamera}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-800 transition-all shadow-md"
                >
                  Retry Camera Setup
                </button>
              </div>
            )}

            {metrics.faceDetected && (metrics.alert || metrics.alertState === 'DROWSY' || metrics.eyeClosureDurationMs >= 3000) && cameraStatus === 'CAMERA_ACTIVE' && (
              <div className="absolute inset-x-4 bottom-4 p-4 rounded-2xl bg-rose-950/90 border border-rose-500 text-rose-200 backdrop-blur-md flex items-center gap-3 animate-bounce">
                <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                <div className="text-xs">
                  <strong className="block text-sm font-black text-white uppercase">🚨 DROWSINESS ALERT DETECTED!</strong>
                  <span>Eyes closed for {((metrics.eyeClosureDurationMs || 3000) / 1000).toFixed(1)}s continuously. Please pull over safely and take a rest break.</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-400 font-mono">
              Track: <strong className="text-cyan-400">{activeTrackInfo ? activeTrackInfo.label : 'None'}</strong> |
              Face: <strong className={metrics.faceDetected ? 'text-emerald-400' : 'text-rose-400'}>{metrics.faceDetected ? 'DETECTED' : 'NOT DETECTED'}</strong> |
              EAR: <strong className="text-white">{metrics.faceDetected && metrics.ear !== null ? metrics.ear.toFixed(3) : 'N/A'}</strong> |
              Res: <strong className="text-slate-300">{activeTrackInfo ? `${activeTrackInfo.width}x${activeTrackInfo.height}` : '480x360'}</strong>
            </div>

            {cameraStatus === 'CAMERA_ACTIVE' ? (
              <button
                onClick={stopCamera}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                <span>Stop Monitoring</span>
              </button>
            ) : (
              <button
                onClick={startCamera}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>Start Monitoring</span>
              </button>
            )}
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>Telemetry & Measured Metrics</span>
            </h3>

            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Driver State</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    !metrics.faceDetected
                      ? 'bg-slate-800 text-slate-400'
                      : metrics.alert || metrics.alertState === 'DROWSY' || metrics.eyeClosureDurationMs >= 3000
                      ? 'bg-rose-950 border border-rose-600 text-rose-300 animate-pulse'
                      : metrics.alertState === 'EYES_CLOSING' || metrics.riskLevel === 'MEDIUM'
                      ? 'bg-amber-950 border border-amber-600 text-amber-300'
                      : 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                  }`}>
                    {!metrics.faceDetected ? 'FACE NOT DETECTED' : metrics.alert || metrics.alertState === 'DROWSY' || metrics.eyeClosureDurationMs >= 3000 ? 'DROWSINESS ALERT' : metrics.alertState}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Camera Source</span>
                    <strong className="text-cyan-400 font-bold text-[11px]">
                      {cameraSource === 'USB_MOBILE_CAMERA' ? 'USB Phone' : 'Integrated'}
                    </strong>
                  </div>

                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Active Track Label</span>
                    <strong className="text-white font-mono text-[11px] truncate block" title={activeTrackInfo?.label}>
                      {activeTrackInfo?.label ? activeTrackInfo.label : 'None'}
                    </strong>
                  </div>

                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Stream Resolution</span>
                    <strong className="text-cyan-300 font-mono text-[11px]">
                      {activeTrackInfo ? `${activeTrackInfo.width}x${activeTrackInfo.height}@${Math.round(activeTrackInfo.frameRate)}fps` : 'N/A'}
                    </strong>
                  </div>

                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">AI FPS Rate</span>
                    <strong className="text-white font-mono">2.0 FPS</strong>
                  </div>

                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Face</span>
                    <strong className={metrics.faceDetected ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {metrics.faceDetected ? 'DETECTED' : 'NOT DETECTED'}
                    </strong>
                  </div>

                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Eyes</span>
                    <strong className={
                      !metrics.faceDetected
                        ? 'text-slate-400'
                        : metrics.eyeState === 'CLOSED'
                        ? 'text-rose-400 font-bold'
                        : metrics.eyeState === 'CLOSING'
                        ? 'text-amber-400 font-bold'
                        : 'text-emerald-400 font-bold'
                    }>
                      {metrics.faceDetected ? metrics.eyeState : 'UNKNOWN'}
                    </strong>
                  </div>

                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Landmark EAR</span>
                    <strong className="text-white font-mono">
                      {metrics.faceDetected && metrics.ear !== null ? metrics.ear.toFixed(3) : 'N/A'}
                    </strong>
                  </div>

                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Closed Duration</span>
                    <strong className={metrics.eyeClosureDurationMs >= 3000 ? 'text-rose-400 font-mono font-bold' : 'text-cyan-400 font-mono'}>
                      {(metrics.eyeClosureDurationMs / 1000).toFixed(1)}s
                    </strong>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fatigue Index & Risk</span>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-extrabold text-white">{metrics.faceDetected ? `${metrics.riskLevel} RISK` : 'NO FACE'}</span>
                  <span className="text-xs text-slate-400 font-mono">{metrics.faceDetected ? `${metrics.drowsinessScore} / 100` : 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Drowsiness Probability</span>
                  <span className="font-mono text-cyan-400">{metrics.faceDetected ? `${metrics.drowsinessScore}%` : '0%'}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      metrics.drowsinessScore > 60 ? 'bg-rose-500' : metrics.drowsinessScore > 35 ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${metrics.faceDetected ? metrics.drowsinessScore : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Safety Advisory</span>
            </div>
            <p className="leading-relaxed">
              SafeWay AI assists driver awareness. If you feel fatigued or sluggish, pull over safely at the nearest rest area.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

