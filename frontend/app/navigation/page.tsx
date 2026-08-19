'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Navigation as NavIcon,
  MapPin,
  AlertTriangle,
  ShieldAlert,
  Compass,
  CornerDownRight,
  School,
  Info,
  ExternalLink,
  Layers,
  Play,
  Square,
  Sliders,
  Volume2,
  VolumeX,
  Crosshair,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import Live3DNavigationMap from '@/components/navigation/Live3DNavigationMap';
import useLiveGpsTracking from '@/hooks/useLiveGpsTracking';
import roadAudioAlerts from '@/utils/roadAudioAlerts';
import mapHazardEventBus from '@/services/mapHazardEventBus';
import { getDemoVehiclePosition, DEMO_MAP_FEATURES } from '@/utils/geospatial';
import hazardApi from '@/services/hazardApi';
import { RoadHazard } from '@/types';

export default function NavigationPage() {
  const [destination, setDestination] = useState<string>('');
  const [isLiveTripActive, setIsLiveTripActive] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Demo Mode Simulator State
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [demoProgressPct, setDemoProgressPct] = useState<number>(0);

  const [activeHazardAlert, setActiveHazardAlert] = useState<{
    title: string;
    message: string;
    advisorySpeedKmH: number;
    riskLevel: 'CAUTION' | 'WARNING' | 'CRITICAL';
    distanceMeters: number;
  } | null>(null);

  const [hazards, setHazards] = useState<RoadHazard[]>([]);

  // Continuous real-time live GPS tracking
  const gpsState = useLiveGpsTracking();

  // Interpolated demo vehicle position along demo route
  const demoVehiclePos = isDemoMode ? getDemoVehiclePosition(demoProgressPct) : null;

  const activeLat = isDemoMode && demoVehiclePos ? demoVehiclePos.latitude : (gpsState.latitude || 25.5941);
  const activeLng = isDemoMode && demoVehiclePos ? demoVehiclePos.longitude : (gpsState.longitude || 85.1376);

  // Memoized Idempotent Hazard Detection Handler
  const handleHazardDetected = useCallback((hazard: {
    title: string;
    message: string;
    advisorySpeedKmH: number;
    riskLevel: 'CAUTION' | 'WARNING' | 'CRITICAL';
    distanceMeters: number;
  } | null) => {
    setActiveHazardAlert((prev) => {
      const prevKey = prev ? `${prev.title}:${prev.distanceMeters}:${prev.advisorySpeedKmH}` : 'NONE';
      const nextKey = hazard ? `${hazard.title}:${hazard.distanceMeters}:${hazard.advisorySpeedKmH}` : 'NONE';
      if (prevKey === nextKey) return prev; // Do not trigger state update if identical
      return hazard;
    });
  }, []);

  // Toggle START / STOP Navigation Trip
  const handleToggleTrip = () => {
    if (!isLiveTripActive) {
      roadAudioAlerts.init();
      setIsLiveTripActive(true);
    } else {
      setIsLiveTripActive(false);
      setActiveHazardAlert(null);
    }
  };

  const handleToggleMute = () => {
    const muted = roadAudioAlerts.toggleMute();
    setIsAudioMuted(muted);
  };

  // Step vehicle forward / backward along demo route
  const handleStepDemoVehicle = (deltaPct: number) => {
    setDemoProgressPct((prev) => Math.max(0, Math.min(100, prev + deltaPct)));
  };

  useEffect(() => {
    const fetchHazards = async () => {
      try {
        const res = await hazardApi.getNearbyHazards(activeLat, activeLng, 10);
        if (res && res.data) {
          setHazards(res.data);
        }
      } catch (err) {
        console.warn('Navigation hazard fetch note:', err);
      }
    };
    fetchHazards();
  }, [activeLat, activeLng]);

  const routeWarnings = [
    { id: 1, title: 'Sharp Right Curve Ahead', desc: 'Reduce speed to 30 km/h', icon: CornerDownRight, color: 'text-amber-400' },
    { id: 2, title: 'School Zone Approaching', desc: 'Strict speed limit 25 km/h', icon: School, color: 'text-cyan-400' },
    { id: 3, title: 'Road Hazard Reported', desc: '1.4 km ahead on right lane', icon: AlertTriangle, color: 'text-purple-400' }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <NavIcon className="w-4 h-4" />
            <span>Jio 3D Vector Maps & Geospatial Guidance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-outfit">
            Smart Route 3D Live Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time GPS mapping integrated with live hazard advisories, camera AI alerts, and regional traffic speed limits.
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
            <span>{isAudioMuted ? 'MUTED' : 'AUDIO ACTIVE'}</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            <span className={`w-2.5 h-2.5 rounded-full ${isLiveTripActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>TRIP: <strong className={isLiveTripActive ? 'text-emerald-400' : 'text-slate-400'}>{isLiveTripActive ? (isDemoMode ? 'SAFETY DEMO ACTIVE' : 'LIVE') : 'READY'}</strong></span>
          </div>
        </div>
      </div>

      {/* Prominent Safety Alert UI Panel */}
      {activeHazardAlert && (
        <div className={`p-4 rounded-3xl border backdrop-blur-xl space-y-2 animate-bounce-short shadow-2xl ${
          activeHazardAlert.riskLevel === 'CRITICAL' ? 'bg-red-950/90 border-red-500 text-red-100' :
          activeHazardAlert.riskLevel === 'WARNING' ? 'bg-rose-950/90 border-rose-500 text-rose-100' :
          'bg-amber-950/90 border-amber-500 text-amber-100'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black uppercase text-sm tracking-wide">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{activeHazardAlert.title}</span>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700">
              DISTANCE: ~{activeHazardAlert.distanceMeters}m AHEAD
            </span>
          </div>

          <p className="text-xs font-semibold leading-relaxed">
            {activeHazardAlert.message} — Safe Advisory Speed: <strong className="text-emerald-400 text-sm font-mono">{activeHazardAlert.advisorySpeedKmH} km/h</strong> (Legal Limit: 60 km/h)
          </p>
        </div>
      )}

      {/* Destination Form & START / STOP Button */}
      <div className="glass-card rounded-3xl p-4 sm:p-6 border border-slate-800 space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); handleToggleTrip(); }} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MapPin className="w-4 h-4 text-cyan-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter Destination (e.g. Patna Junction, Bailey Road...)"
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <button
            type="button"
            onClick={handleToggleTrip}
            className={`px-8 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all shadow-lg ${
              isLiveTripActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-slate-950 shadow-teal-500/20'
            }`}
          >
            {isLiveTripActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isLiveTripActive ? 'STOP TRIP' : 'START NAVIGATION'}</span>
          </button>
        </form>

        {/* Safety Demo Mode Simulator Panel with Vehicle Movement Slider & Step Controls */}
        <div className="pt-3 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-purple-400 font-bold">
              <Sliders className="w-4 h-4" />
              <span>SAFETY DEMO MODE SIMULATOR</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">ENABLE DEMO MODE:</span>
              <input
                type="checkbox"
                checked={isDemoMode}
                onChange={(e) => {
                  setIsDemoMode(e.target.checked);
                  if (e.target.checked && !isLiveTripActive) setIsLiveTripActive(true);
                }}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-purple-500 focus:ring-purple-400 cursor-pointer"
              />
            </div>
          </div>

          {isDemoMode && (
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold">Move Vehicle along Demo Route:</span>
                <span className="text-cyan-400 font-bold">Route Progress: {Math.round(demoProgressPct)}%</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleStepDemoVehicle(-5)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-mono text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Move Back</span>
                </button>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={demoProgressPct}
                  onChange={(e) => setDemoProgressPct(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />

                <button
                  onClick={() => handleStepDemoVehicle(5)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-mono text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  <span>Forward →</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span>Gandhi Maidan (0%)</span>
                <span className="text-amber-400 font-bold">🏫 School (200m @ 35%)</span>
                <span className="text-cyan-400 font-bold">🚸 Zebra Crossing (100m @ 60%)</span>
                <span>Patna Junction (100%)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Live 3D Map Viewport & Route Advisories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-3xl p-4 border border-slate-800 bg-slate-900/80 space-y-4">
          <Live3DNavigationMap
            gpsState={gpsState}
            isLiveTripActive={isLiveTripActive}
            isDemoMode={isDemoMode}
            demoVehiclePos={demoVehiclePos}
            destination={destination ? { latitude: activeLat + 0.015, longitude: activeLng + 0.018, title: destination } : undefined}
            onHazardDetected={handleHazardDetected}
          />
        </div>

        <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Route Safety Advisories</span>
            </h3>

            <div className="space-y-3 mt-4">
              {routeWarnings.map((warn) => {
                const Icon = warn.icon;
                return (
                  <div
                    key={warn.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-3"
                  >
                    <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${warn.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <strong className="block font-bold text-white">{warn.title}</strong>
                      <span className="text-slate-400">{warn.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Info className="w-3.5 h-3.5 text-teal-400" />
              <span>Live Advisory Notice</span>
            </div>
            <p className="leading-relaxed">
              SafeWay AI automatically monitors route conditions and advises early deceleration before sharp curves and school zones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
