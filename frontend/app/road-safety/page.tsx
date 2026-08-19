'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldAlert,
  Camera,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Info,
  Car,
  User,
  Zap,
  PhoneCall,
  X,
  Compass,
  MapPin,
  Flame,
  Layers,
  Sparkles,
  Sliders,
  AlertOctagon,
  Volume2,
  VolumeX,
  Navigation,
  Crosshair
} from 'lucide-react';
import { useRoadWebcam } from '@/hooks/useRoadWebcam';
import { useRoadObjectDetection } from '@/hooks/useRoadObjectDetection';
import { useCrashDetector } from '@/hooks/useCrashDetector';
import { useGeolocation } from '@/hooks/useGeolocation';
import trafficRuleApi from '@/services/trafficRuleApi';
import roadPerceptionService from '@/services/roadPerceptionService';
import roadAudioAlerts from '@/utils/roadAudioAlerts';
import { SecondarySignDetectionResult } from '@/types/roadPerception';

export default function RoadSafetyPage() {
  const { location } = useGeolocation();

  // Speed Telemetry Hierarchy: Real GPS Speed > Demo Speed Mode (explicitly labeled) > Unavailable
  const [demoSpeedMode, setDemoSpeedMode] = useState<boolean>(false);
  const [demoSpeedValue, setDemoSpeedValue] = useState<number>(45);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  const realGpsSpeed = location.isGeoAvailable ? 0 : null; // GPS speed in km/h from coords.speed
  const activeSpeed = realGpsSpeed !== null ? realGpsSpeed : demoSpeedMode ? demoSpeedValue : null;

  const { videoRef, canvasRef, cameraStatus, errorMessage, startCamera, stopCamera } = useRoadWebcam({
    targetWidth: 640,
    targetHeight: 480
  });

  const isCameraActive = cameraStatus === 'CAMERA_ACTIVE';
  const {
    isModelLoading,
    modelError,
    detectedObjects,
    roadHazards,
    primaryHazard,
    secondarySignStatus,
    highestRisk,
    isCameraBlocked,
    fps,
    largestBoxAreaRatio,
    visibilityScore,
    obstructionScore
  } = useRoadObjectDetection(videoRef, isCameraActive);

  const {
    crashState,
    countdown,
    activeEvent,
    notificationStatus,
    triggerImpactEvent,
    cancelEmergency,
    confirmEmergency
  } = useCrashDetector(location.latitude, location.longitude, activeSpeed || 0);

  const [legalSpeedLimit, setLegalSpeedLimit] = useState<number>(60);
  const [secondarySign, setSecondarySign] = useState<SecondarySignDetectionResult | null>(null);

  // Toggle Mute / Unmute
  const handleToggleMute = () => {
    const muted = roadAudioAlerts.toggleMute();
    setIsAudioMuted(muted);
  };

  // Initialize Web Audio synthesizer on camera start
  const handleStartCamera = () => {
    roadAudioAlerts.init();
    startCamera();
  };

  // Trigger audio/speech alerts when primary hazard changes
  useEffect(() => {
    if (isCameraActive && primaryHazard) {
      roadAudioAlerts.playHazardVoiceAlert(primaryHazard.alertTitle, primaryHazard.alertMessage);
    } else if (isCameraActive) {
      if (isCameraBlocked) {
        roadAudioAlerts.playAlert('CAMERA_BLOCKED');
      } else if (highestRisk !== 'NORMAL') {
        roadAudioAlerts.playAlert(highestRisk);
      }
    }
  }, [primaryHazard, highestRisk, isCameraBlocked, isCameraActive]);

  // Fetch legal speed limit for current state from backend Traffic Rules API
  useEffect(() => {
    async function fetchSpeedRules() {
      try {
        const response = await trafficRuleApi.getRulesByState(location.state, { category: 'Speed Limit' });
        if (response && response.data && response.data.length > 0) {
          const rule = response.data[0];
          if (rule.fineAmount) {
            setLegalSpeedLimit(60); // Standard state limit
          }
        }
      } catch (err) {
        console.warn('[RoadSafety] Error fetching speed rules:', err);
      }
    }
    fetchSpeedRules();
  }, [location.state]);

  // Handle camera block persistence & auto-cancellation when unblocked
  useEffect(() => {
    if (isCameraBlocked && crashState === 'NORMAL') {
      triggerImpactEvent(4.0, 95);
    } else if (!isCameraBlocked && crashState === 'SUSPECTED_IMPACT') {
      cancelEmergency();
    }
  }, [isCameraBlocked, crashState, triggerImpactEvent, cancelEmergency]);

  // Canvas drawing for both COCO objects and specialized road hazard signs/markings
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw real bounding boxes for detected COCO-SSD objects
    detectedObjects.forEach((obj) => {
      const [x, y, w, h] = obj.bbox;

      ctx.lineWidth = 3;
      ctx.strokeStyle =
        obj.proximityRisk === 'CAMERA_BLOCKED' ? '#dc2626' :
        obj.proximityRisk === 'CRITICAL' ? '#f43f5e' :
        obj.proximityRisk === 'WARNING' ? '#fbbf24' : '#06b6d4';

      ctx.strokeRect(x, y, w, h);

      // Label background
      ctx.fillStyle = ctx.strokeStyle;
      const labelText = `${obj.class.toUpperCase()} ${obj.score}%`;
      const textWidth = ctx.measureText(labelText).width;
      ctx.fillRect(x, Math.max(0, y - 24), textWidth + 16, 24);

      // Label text
      ctx.fillStyle = '#020617';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(labelText, x + 6, Math.max(16, y - 8));
    });

    // 2. Draw bounding boxes for specialized road hazard signs/markings
    roadHazards.forEach((hazard) => {
      const { x, y, width: w, height: h } = hazard.bbox;

      ctx.lineWidth = 4;
      ctx.strokeStyle =
        hazard.risk === 'CRITICAL' ? '#dc2626' :
        hazard.risk === 'HIGH' ? '#f43f5e' :
        hazard.risk === 'MEDIUM' ? '#fbbf24' : '#10b981';

      ctx.strokeRect(x, y, w, h);

      // Label background
      ctx.fillStyle = ctx.strokeStyle;
      const hazardText = `${hazard.label} | ${hazard.confidence}% | ~${hazard.distanceEstimateMeters}m`;
      const textWidth = ctx.measureText(hazardText).width;
      ctx.fillRect(x, Math.max(0, y - 26), textWidth + 18, 26);

      // Label text
      ctx.fillStyle = '#020617';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(hazardText, x + 6, Math.max(18, y - 8));
    });
  }, [detectedObjects, roadHazards, isCameraActive, videoRef]);

  // Multi-sensor perception fusion
  const fusionResult = roadPerceptionService.fuseRoadSafetyData({
    primaryObjects: isCameraBlocked
      ? [{ class: 'OBSTRUCTION', confidence: 99, bbox: [0, 0, 640, 480], areaRatio: 100, corridorWeight: 1.0, proximityRisk: 'CAMERA_BLOCKED' }]
      : detectedObjects,
    secondarySign,
    geometryFeature: 'UNAVAILABLE',
    latitude: location.isGeoAvailable ? location.latitude : null,
    longitude: location.isGeoAvailable ? location.longitude : null,
    currentSpeedKmH: activeSpeed,
    legalSpeedLimitKmH: primaryHazard ? Math.min(legalSpeedLimit, primaryHazard.advisorySpeedLimitKmH) : legalSpeedLimit,
    stateName: location.state,
    cityName: location.city,
    mapContext: {
      routeId: null,
      heading: null,
      roadType: null,
      upcomingTurn: null,
      upcomingSchoolZone: false,
      upcomingPedestrianCrossing: false,
      upcomingSpeedLimit: null,
      upcomingHazard: null,
      vectorTileStatus: 'UNAVAILABLE'
    }
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Multi-Modal Perception & Speed Advisory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-outfit">
            Intelligent Road Safety Monitor
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Outward road camera perception, specialized road-sign/marking detection, and dynamic state speed advisories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMute}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
              isAudioMuted ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-400'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isAudioMuted ? 'AUDIO MUTED' : 'AUDIO ACTIVE'}</span>
          </button>

          <button
            onClick={() => triggerImpactEvent(3.5, 88)}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-rose-500/40 text-rose-400 hover:bg-rose-950/40 text-xs font-bold flex items-center gap-2 transition-all shrink-0"
          >
            <Flame className="w-4 h-4" />
            <span>[DEV: TEST EMERGENCY UI]</span>
          </button>
        </div>
      </div>

      {/* Driver Advisory Notice Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Driver Advisory System Only:</strong> SafeWay AI provides real-time speed advisories, road-sign alerts, and proximity warnings. The software does not control vehicle accelerator, brakes, or steering ECU.
          </span>
        </div>
      </div>

      {/* Step 9: Prominent Driver Alert Panel */}
      {primaryHazard && (
        <div className={`p-4 rounded-3xl border backdrop-blur-xl space-y-2 animate-bounce-short shadow-2xl ${
          primaryHazard.risk === 'CRITICAL' ? 'bg-red-950/90 border-red-500 text-red-100' :
          primaryHazard.risk === 'HIGH' ? 'bg-rose-950/90 border-rose-500 text-rose-100' :
          'bg-amber-950/90 border-amber-500 text-amber-100'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black uppercase text-sm tracking-wide">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>⚠ {primaryHazard.alertTitle}</span>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700">
              DISTANCE: ~{primaryHazard.distanceEstimateMeters}m | CONFIDENCE: {primaryHazard.confidence}%
            </span>
          </div>

          <p className="text-xs font-semibold leading-relaxed">
            {primaryHazard.alertMessage} — Dynamic Safe Advisory Speed: <strong className="text-emerald-400 text-sm font-mono">{primaryHazard.advisorySpeedLimitKmH} km/h</strong>
          </p>
        </div>
      )}

      {/* Developer Diagnostics Panel */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 text-xs font-mono grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-9 gap-3">
        <div>
          <span className="text-slate-500 block text-[10px]">FPS:</span>
          <span className="text-cyan-400 font-bold">{fps}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">DETECTIONS:</span>
          <span className="text-white font-bold">{detectedObjects.length + roadHazards.length}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">LARGEST BOX:</span>
          <span className="text-amber-400 font-bold">{largestBoxAreaRatio}%</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">VISIBILITY:</span>
          <span className="text-emerald-400 font-bold">{visibilityScore}%</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">OBSTRUCTION:</span>
          <span className={isCameraBlocked ? 'text-red-400 font-bold animate-pulse' : 'text-slate-400'}>
            {isCameraBlocked ? 'YES (BLOCKED)' : 'NO'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">RISK:</span>
          <span className="text-rose-400 font-bold">{fusionResult.overallRiskLevel}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">ADVISORY:</span>
          <span className="text-emerald-400 font-bold">{fusionResult.advisorySpeedKmH} km/h</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">CURRENT SPEED:</span>
          <span className="text-white font-bold">{activeSpeed !== null ? `${activeSpeed} km/h` : 'UNAVAILABLE'}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">SIGN AI:</span>
          <span className={secondarySignStatus === 'ACTIVE' ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
            {secondarySignStatus}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Outward Road Camera & Canvas Overlay */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-bold text-white">OUTWARD ROAD-FACING CAMERA</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs">
              {cameraStatus === 'CAMERA_ACTIVE' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-bold">CAMERA ACTIVE</span>
                </>
              )}
              {cameraStatus === 'CAMERA_STARTING' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-spin" />
                  <span className="text-amber-400 font-bold">STARTING...</span>
                </>
              )}
              {cameraStatus === 'CAMERA_PERMISSION_REQUIRED' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <span className="text-slate-400">ROAD CAMERA: OFFLINE</span>
                </>
              )}
              {(cameraStatus === 'CAMERA_DENIED' || cameraStatus === 'CAMERA_ERROR') && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-rose-400 font-bold">CAMERA ERROR</span>
                </>
              )}
            </div>
          </div>

          <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
            />
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full pointer-events-none ${isCameraActive ? 'block' : 'hidden'}`}
            />

            {cameraStatus === 'CAMERA_PERMISSION_REQUIRED' && (
              <div className="text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                  <Camera className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Enable Outward Road Camera</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Click &apos;Start Road Camera&apos; to initialize real-time vehicle, pedestrian, zebra crossing, and traffic sign recognition.
                </p>
                <button
                  onClick={handleStartCamera}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 mx-auto shadow-lg shadow-cyan-500/20"
                >
                  <Play className="w-4 h-4" />
                  <span>START ROAD CAMERA</span>
                </button>
              </div>
            )}

            {cameraStatus === 'CAMERA_STARTING' && (
              <div className="text-center p-6 space-y-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-300">Requesting environment camera stream...</p>
              </div>
            )}

            {(cameraStatus === 'CAMERA_DENIED' || cameraStatus === 'CAMERA_ERROR') && (
              <div className="text-center p-6 space-y-3 max-w-md">
                <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
                <h3 className="text-base font-bold text-white">Road Camera Access Denied</h3>
                <p className="text-xs text-rose-300 leading-relaxed">{errorMessage}</p>
                <button
                  onClick={handleStartCamera}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-800"
                >
                  Retry Setup
                </button>
              </div>
            )}

            {/* Highly Visible Camera Blocked UI Warning */}
            {isCameraBlocked && isCameraActive && (
              <div className="absolute inset-x-4 bottom-4 p-4 rounded-2xl bg-red-950/95 border-2 border-red-500 text-white backdrop-blur-md flex items-center gap-3 animate-bounce">
                <AlertOctagon className="w-8 h-8 text-red-400 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <strong className="block text-sm font-black text-white uppercase">🚨 CAMERA BLOCKED — STOP SAFELY!</strong>
                  <div>ADVISORY SPEED: <span className="font-bold text-emerald-400">0 km/h</span> | PROXIMITY RISK: <span className="font-bold text-red-400">CRITICAL</span></div>
                  <span className="text-[10px] text-red-200">Camera view completely obstructed. Emergency SOS countdown initiated.</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Primary Model:</span>
                {isModelLoading ? (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading COCO-SSD...
                  </span>
                ) : modelError ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> {modelError}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> COCO-SSD + Sign AI Active
                  </span>
                )}
              </div>
            </div>

            {isCameraActive ? (
              <button
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                <span>Stop Road Camera</span>
              </button>
            ) : (
              <button
                onClick={handleStartCamera}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>START ROAD CAMERA</span>
              </button>
            )}
          </div>
        </div>

        {/* Step 11: Road Safety Dashboard Cards */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Speed & Road Hazard Telemetry</span>
            </h3>

            <div className="space-y-3 mt-4">
              {/* Primary Hazard & Distance Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 font-mono">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Detected Hazard</span>
                  <span>Confidence</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-white uppercase">
                    {primaryHazard ? primaryHazard.label : 'ROAD CLEAR'}
                  </span>
                  <span className="text-sm font-bold text-cyan-400">
                    {primaryHazard ? `${primaryHazard.confidence}%` : 'N/A'}
                  </span>
                </div>
                {primaryHazard && (
                  <div className="text-[11px] text-amber-400 font-bold flex items-center gap-1 pt-1">
                    <Crosshair className="w-3.5 h-3.5" /> Estimated Distance: ~{primaryHazard.distanceEstimateMeters}m ({primaryHazard.proximityLevel})
                  </div>
                )}
              </div>

              {/* Current Speed Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Speed</span>
                  <span className="text-xs text-slate-500 font-mono">
                    {realGpsSpeed !== null ? 'GPS Speed' : demoSpeedMode ? 'DEMO SIMULATOR' : 'Telematics'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white font-mono">
                    {activeSpeed !== null ? `${activeSpeed} km/h` : 'CURRENT SPEED: UNAVAILABLE'}
                  </span>
                </div>

                {realGpsSpeed === null && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5" /> SPEED TEST MODE
                      </span>
                      <input
                        type="checkbox"
                        checked={demoSpeedMode}
                        onChange={(e) => setDemoSpeedMode(e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-400 cursor-pointer"
                      />
                    </div>

                    {demoSpeedMode && (
                      <div className="space-y-1">
                        <input
                          type="range"
                          min="0"
                          max="120"
                          value={demoSpeedValue}
                          onChange={(e) => setDemoSpeedValue(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                        />
                        <span className="text-[10px] text-slate-500 block text-right font-mono">
                          Simulated Speed: {demoSpeedValue} km/h
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Legal & Advisory Speed Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Legal Speed Limit</span>
                  <div className="text-xl font-black text-cyan-400 font-mono">{fusionResult.legalSpeedLimitKmH} km/h</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Safe Advisory Speed</span>
                  <div className="text-xl font-black text-emerald-400 font-mono">{fusionResult.advisorySpeedKmH} km/h</div>
                </div>
              </div>

              {/* Proximity Risk Badge */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Proximity Risk</span>
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                    fusionResult.overallRiskLevel === 'CAMERA_BLOCKED' ? 'bg-red-950 text-red-400 border-red-800 animate-pulse' :
                    fusionResult.overallRiskLevel === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border-rose-800' :
                    fusionResult.overallRiskLevel === 'WARNING' ? 'bg-amber-950 text-amber-400 border-amber-800' :
                    fusionResult.overallRiskLevel === 'CAUTION' ? 'bg-yellow-950 text-yellow-400 border-yellow-800' :
                    'bg-emerald-950 text-emerald-400 border-emerald-800'
                  }`}>
                    {fusionResult.overallRiskLevel}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  ROAD STATUS: {isCameraBlocked ? 'CAMERA BLOCKED' : primaryHazard ? primaryHazard.alertTitle : 'CLEAR'}
                </div>
              </div>

              {/* Active Hazards List */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Active Road Hazards ({roadHazards.length})
                </span>

                {roadHazards.length === 0 ? (
                  <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-500 font-mono text-center">
                    {isCameraBlocked ? 'CAMERA VIEW OBSTRUCTED' : 'ROAD STATUS: CLEAR'}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {roadHazards.map((h, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
                        <div className="space-y-0.5">
                          <span className="text-white font-bold flex items-center gap-1.5 uppercase">
                            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                            {h.label} ({h.confidence}%)
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Dist: ~{h.distanceEstimateMeters}m | Level: {h.proximityLevel} | Adv Limit: {h.advisorySpeedLimitKmH}km/h
                          </span>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          h.risk === 'CRITICAL' ? 'bg-red-950 text-red-400' :
                          h.risk === 'HIGH' ? 'bg-rose-950 text-rose-400' :
                          'bg-amber-950 text-amber-400'
                        }`}>
                          {h.risk}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Jio 3D Map Teammate Integration</span>
            </div>
            <p className="leading-relaxed">
              Modular perception architecture is ready for teammate Jio 3D Map vector tile integration (`Teammate3DMapContext`).
            </p>
          </div>
        </div>
      </div>

      {/* 10-Second Emergency SOS Countdown Modal */}
      {crashState === 'SUSPECTED_IMPACT' && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card rounded-3xl p-6 sm:p-8 border border-rose-500/50 space-y-6 text-center shadow-2xl animate-bounce-short">
            <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white font-outfit uppercase tracking-wide">
                🚨 EMERGENCY ALERT
              </h2>
              <p className="text-xs text-rose-200 leading-relaxed">
                Camera visibility lost or severe collision risk detected. Please confirm if emergency assistance is required. Sending alert in:
              </p>
            </div>

            {/* Countdown Ticker */}
            <div className="text-6xl font-black text-rose-500 font-mono tracking-widest my-4">
              {countdown}s
            </div>

            <div className="space-y-3">
              <button
                onClick={cancelEmergency}
                className="w-full py-3.5 rounded-2xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4 text-slate-400" />
                <span>CANCEL</span>
              </button>

              <button
                onClick={confirmEmergency}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
              >
                <PhoneCall className="w-4 h-4" />
                <span>SEND NOW</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Sent Status Banner */}
      {crashState === 'EMERGENCY_SENT' && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500 text-rose-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <strong className="block text-sm font-bold text-white uppercase">Emergency SOS Processed</strong>
              <span>{notificationStatus || 'Location coordinates sent to emergency contacts.'}</span>
            </div>
          </div>
          <button
            onClick={() => cancelEmergency()}
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
