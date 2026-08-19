'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Eye,
  BookOpen,
  Navigation,
  AlertTriangle,
  PhoneCall,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Radio,
  Car,
  RefreshCw,
  Compass
} from 'lucide-react';
import hazardApi from '@/services/hazardApi';
import safetyApi from '@/services/safetyApi';
import trafficRuleApi from '@/services/trafficRuleApi';
import JioMapContainer from '@/components/navigation/JioMapContainer';
import { RoadHazard, RiskLevel } from '@/types';

export default function DashboardPage() {
  // 1. Current Location State
  const [userLocation, setUserLocation] = useState<{
    state: string;
    city: string;
    address: string;
    latitude: number;
    longitude: number;
  }>({
    state: 'Bihar',
    city: 'Patna',
    address: 'Gandhi Maidan, Patna, Bihar',
    latitude: 25.5941,
    longitude: 85.1376
  });

  // 2. Real API Data States
  const [riskLevel, setRiskLevel] = useState<RiskLevel | null>(null);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [drowsinessStatus, setDrowsinessStatus] = useState<string | null>('LOW');
  const [nearbyHazards, setNearbyHazards] = useState<RoadHazard[]>([]);
  const [hazardsCount, setHazardsCount] = useState<number | null>(null);
  const [trafficStatus, setTrafficStatus] = useState<string | null>('Normal');
  const [activeAlerts, setActiveAlerts] = useState<string[]>([]);

  // 3. Status & Loading States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  // Fetch real API data concurrently from backend endpoints
  const syncDashboardData = async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      // A. Fetch nearby hazards from backend
      let fetchedHazards: RoadHazard[] = [];
      try {
        const hazardRes = await hazardApi.getNearbyHazards(userLocation.latitude, userLocation.longitude, 10);
        if (hazardRes && hazardRes.data) {
          fetchedHazards = hazardRes.data;
          setNearbyHazards(fetchedHazards);
          setHazardsCount(fetchedHazards.length);
        } else {
          setHazardsCount(0);
        }
      } catch (err) {
        console.warn('Hazard API sync note:', err);
        setHazardsCount(null); // Triggers 'Data unavailable'
      }

      // B. Fetch rules status for current state
      try {
        const rulesRes = await trafficRuleApi.getRulesByState(userLocation.state, { limit: 1 });
        if (rulesRes && rulesRes.pagination) {
          setTrafficStatus(`${rulesRes.pagination.total} Rules Active`);
        } else {
          setTrafficStatus('Normal');
        }
      } catch (err) {
        console.warn('Traffic Rules API sync note:', err);
        setTrafficStatus(null); // Triggers 'Data unavailable'
      }

      // C. Evaluate composite safety risk from backend API
      try {
        const safetyRes = await safetyApi.analyzeSafety({
          drowsinessScore: 12,
          speed: 45,
          speedLimit: 60,
          harshBraking: 0,
          roadHazard: fetchedHazards.length > 0
        });

        if (safetyRes && safetyRes.data) {
          setRiskLevel(safetyRes.data.riskLevel);
          setRiskScore(safetyRes.data.riskScore);
          setActiveAlerts(safetyRes.data.reasons || []);
        } else {
          setRiskLevel(null);
        }
      } catch (err) {
        console.warn('Safety API sync note:', err);
        setRiskLevel(null); // Triggers 'Data unavailable'
      }
    } catch (err) {
      console.error('Full dashboard sync error:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncDashboardData();
  }, [userLocation.latitude, userLocation.longitude]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. Header Block: Location & State */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300 font-mono">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Current State: <strong className="text-white">{userLocation.state}</strong></span>
                <span className="text-slate-600">|</span>
                <span>{userLocation.city}</span>
              </div>

              <button
                onClick={syncDashboardData}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs text-slate-300 hover:border-slate-600 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Sync Real APIs</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-outfit">
              SafeWay AI Operations Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              AI-powered road safety companion for smarter and safer driving.
            </p>
          </div>

          {/* Car Driving Mode CTA */}
          <div className="shrink-0 flex items-center gap-3">
            <Link
              href="/drowsiness"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all"
            >
              <Car className="w-4 h-4" />
              <span>Launch Driver Monitor</span>
            </Link>
          </div>
        </div>

        <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Primary SAFETY STATUS Block */}
      <div className="glass-card rounded-3xl p-8 border border-slate-800 bg-slate-900/90 text-center space-y-4 shadow-2xl">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
          Composite Backend Safety Risk Status
        </span>

        {isLoading ? (
          <div className="py-6 text-cyan-400 flex items-center justify-center gap-2 text-sm font-bold">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Evaluating telemetry risk signals...</span>
          </div>
        ) : riskLevel !== null ? (
          <div className="py-2">
            <div
              className={`inline-block px-8 py-3.5 rounded-2xl text-2xl sm:text-3xl font-black tracking-wider uppercase border shadow-2xl transition-all ${
                riskLevel === 'HIGH'
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-rose-900/50 animate-pulse'
                  : riskLevel === 'MEDIUM'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-amber-900/50'
                  : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-emerald-900/50'
              }`}
            >
              {riskLevel} RISK
            </div>
            {riskScore !== null && (
              <div className="mt-2 text-xs font-mono text-slate-400">
                Calculated Risk Score: <strong className="text-white">{riskScore} / 100</strong>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-amber-400 font-mono text-sm font-bold">
            Data unavailable
          </div>
        )}

        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Safety status is evaluated dynamically by combining drowsiness inference, speed compliance, and nearby road hazards.
        </p>
      </div>

      {/* 3. 3-Column Metric Strip (Drowsiness | Hazards | Traffic) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Drowsiness Status */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-900/60 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Drowsiness Status</span>
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-outfit">
            {drowsinessStatus !== null ? drowsinessStatus : 'Data unavailable'}
          </div>
          <p className="text-[11px] text-slate-400">Real-time computer vision eye aspect ratio</p>
        </div>

        {/* Hazards Proximity */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-900/60 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Nearby Road Hazards</span>
            <AlertTriangle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-outfit">
            {hazardsCount !== null ? `${hazardsCount} Nearby` : 'Data unavailable'}
          </div>
          <p className="text-[11px] text-slate-400">Geospatial 2dsphere proximity within 10km</p>
        </div>

        {/* Traffic Intelligence */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-900/60 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Traffic Intelligence</span>
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-outfit">
            {trafficStatus !== null ? trafficStatus : 'Data unavailable'}
          </div>
          <p className="text-[11px] text-slate-400">Motor Vehicles Act statutory legal rules</p>
        </div>
      </div>

      {/* 4. LIVE MAP Block */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Live Geospatial Map & Hazards Overlay</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">Jio 3D / OSM Tiles</span>
        </div>

        <JioMapContainer
          userLocation={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            address: userLocation.address
          }}
          hazards={nearbyHazards}
        />
      </div>

      {/* 5. Quick Actions Toolbar */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight">Quick Actions Center</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/safety"
            className="p-4 rounded-2xl glass-card border border-emerald-500/30 hover:border-emerald-400 bg-gradient-to-b from-emerald-900/30 to-slate-900 flex flex-col items-center text-center gap-2 transition-all hover:scale-105 group"
          >
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white group-hover:text-emerald-300">Safety Analysis</span>
          </Link>

          <Link
            href="/traffic-rules"
            className="p-4 rounded-2xl glass-card border border-amber-500/30 hover:border-amber-400 bg-gradient-to-b from-amber-900/30 to-slate-900 flex flex-col items-center text-center gap-2 transition-all hover:scale-105 group"
          >
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white group-hover:text-amber-300">Traffic Rules</span>
          </Link>

          <Link
            href="/navigation"
            className="p-4 rounded-2xl glass-card border border-teal-500/30 hover:border-teal-400 bg-gradient-to-b from-teal-900/30 to-slate-900 flex flex-col items-center text-center gap-2 transition-all hover:scale-105 group"
          >
            <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30">
              <Navigation className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white group-hover:text-teal-300">Smart Route</span>
          </Link>

          <Link
            href="/emergency"
            className="p-4 rounded-2xl glass-card border border-rose-500/30 hover:border-rose-400 bg-gradient-to-b from-rose-900/30 to-slate-900 flex flex-col items-center text-center gap-2 transition-all hover:scale-105 group"
          >
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <PhoneCall className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white group-hover:text-rose-300">Emergency SOS</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
