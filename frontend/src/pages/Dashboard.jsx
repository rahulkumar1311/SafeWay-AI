import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  TrafficCone,
  ShieldAlert,
  AlertTriangle,
  PhoneCall,
  BookOpen,
  FileText,
  ArrowRight,
  Activity,
  Cpu,
  Server,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

/**
 * SafeWay-AI Dashboard Configuration Schema
 * Clearly separates static UI presentation configuration from future live API bindings.
 */
const DASHBOARD_CARDS = [
  {
    id: 'drowsiness',
    title: 'Drowsiness Detection',
    subtitle: 'Computer Vision Eye & PERCLOS Monitor',
    description: 'Monitors driver attentiveness using facial keypoints, blink duration, and yawn frequency analysis.',
    route: '/drowsiness',
    icon: Eye,
    quickActionLabel: 'Launch Drowsiness Detector',
    badge: 'AI Inference',
    apiEndpoint: 'POST /api/ai/drowsiness/analyze',
    gradient: 'from-blue-900/40 via-indigo-900/20 to-slate-900',
    borderColor: 'border-blue-500/30 hover:border-blue-400',
    iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    accentColor: 'text-blue-400'
  },
  {
    id: 'traffic-sign',
    title: 'Traffic Sign Recognition',
    subtitle: 'MobileNetV2 Vision Classification',
    description: 'Classifies road signage in real time and synthesizes spoken alert guidelines for drivers.',
    route: '/traffic-sign',
    icon: TrafficCone,
    quickActionLabel: 'Analyze Traffic Signs',
    badge: 'AI Inference',
    apiEndpoint: 'POST /api/ai/traffic-sign/analyze',
    gradient: 'from-cyan-900/40 via-teal-900/20 to-slate-900',
    borderColor: 'border-cyan-500/30 hover:border-cyan-400',
    iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    accentColor: 'text-cyan-400'
  },
  {
    id: 'safety-analysis',
    title: 'Safety Risk Analysis',
    subtitle: 'Driving Score & Telemetry Evaluator',
    description: 'Calculates composite risk scores (0-100) based on speed limit compliance, harsh braking, and drowsiness.',
    route: '/safety',
    icon: ShieldAlert,
    quickActionLabel: 'View Safety Analytics',
    badge: 'Core Service',
    apiEndpoint: 'POST /api/safety/analyze',
    gradient: 'from-emerald-900/40 via-teal-900/20 to-slate-900',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    accentColor: 'text-emerald-400'
  },
  {
    id: 'road-hazards',
    title: 'Road Hazards',
    subtitle: 'Geo-Spatial Proximity Warning',
    description: 'Detects nearby potholes, construction zones, and accidents using MongoDB GeoJSON spatial queries.',
    route: '/hazards',
    icon: AlertTriangle,
    quickActionLabel: 'Explore Hazard Map',
    badge: 'Geo-Spatial',
    apiEndpoint: 'GET /api/hazards/nearby',
    gradient: 'from-purple-900/40 via-violet-900/20 to-slate-900',
    borderColor: 'border-purple-500/30 hover:border-purple-400',
    iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    accentColor: 'text-purple-400'
  },
  {
    id: 'emergency-sos',
    title: 'Emergency SOS',
    subtitle: 'Automated Dispatch & Contact Alert',
    description: 'Triggers instant emergency notifications with GPS location coordinates to registered emergency contacts.',
    route: '/emergency',
    icon: PhoneCall,
    quickActionLabel: 'Emergency SOS Center',
    badge: 'Critical Service',
    apiEndpoint: 'POST /api/emergency/sos',
    gradient: 'from-rose-900/40 via-red-900/20 to-slate-900',
    borderColor: 'border-rose-500/30 hover:border-rose-400',
    iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    accentColor: 'text-rose-400'
  },
  {
    id: 'rules-challans',
    title: 'Traffic Rules & Challans',
    subtitle: 'State Fines Directory & E-Challans',
    description: 'Verifies state traffic police e-challans by vehicle number and provides standard penalty guidelines.',
    route: '/challans',
    secondaryRoute: '/rules',
    icon: FileText,
    quickActionLabel: 'Check Challans & Rules',
    badge: 'Database Lookup',
    apiEndpoint: 'GET /api/challans & /api/rules',
    gradient: 'from-amber-900/40 via-orange-900/20 to-slate-900',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    accentColor: 'text-amber-400'
  }
];

export const Dashboard = () => {
  const navigate = useNavigate();
  const { apiStatus } = useApp();

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>SafeWay-AI Operations Console</span>
            </div>

            {/* API Status Indicator Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs">
              {apiStatus === 'healthy' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Express Backend Active</span>
                </>
              ) : apiStatus === 'checking' ? (
                <>
                  <Activity className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span className="text-amber-400 font-medium">Verifying Services...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400 font-medium">Backend Offline</span>
                </>
              )}
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            AI-Powered Driver Safety & Intelligent Vehicle Assistance
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Centralized operations dashboard for computer vision drowsiness inference, traffic sign classification, safety risk scoring, geo-spatial hazard alerts, and emergency SOS dispatching.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <Server className="w-4 h-4 text-blue-400" />
              <span>Node.js / Express Proxy: <strong className="text-cyan-400 font-mono">http://localhost:5000</strong></span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <Cpu className="w-4 h-4 text-teal-400" />
              <span>Python / FastAPI AI: <strong className="text-cyan-400 font-mono">http://localhost:8000</strong></span>
            </div>
          </div>
        </div>

        {/* Ambient Decorative Gradient Circle */}
        <div className="absolute -top-28 -right-28 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metric Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">AI Engines</span>
          <div className="text-2xl font-bold text-white flex items-center justify-between">
            <span>2 Active</span>
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-[10px] text-slate-400">Drowsiness & Traffic Sign</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Backend Gateway</span>
          <div className="text-2xl font-bold text-white flex items-center justify-between">
            <span>:5000</span>
            <Server className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-[10px] text-slate-400">Express REST Proxy</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Safety Protocols</span>
          <div className="text-2xl font-bold text-white flex items-center justify-between">
            <span>6 Modules</span>
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-[10px] text-slate-400">Risk, Rules, SOS & Hazards</p>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Target Latency</span>
          <div className="text-2xl font-bold text-white flex items-center justify-between">
            <span>&lt; 50ms</span>
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-[10px] text-slate-400">Inference Proxy Benchmark</p>
        </div>
      </div>

      {/* Core 6 Safety / AI Feature Cards Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Platform Safety & AI Services</h2>
            <p className="text-xs text-slate-400">Select any module card to navigate to its functional interface</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hidden sm:inline">
            6 Core Systems Registered
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DASHBOARD_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className={`group relative overflow-hidden rounded-2xl glass-card p-6 border ${card.borderColor} bg-gradient-to-b ${card.gradient} transition-all duration-300 shadow-xl flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1`}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl border ${card.iconBg} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-950/70 border border-slate-800 text-slate-300">
                      {card.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className={`text-lg font-bold text-white group-hover:${card.accentColor} transition-colors mb-1`}>
                      {card.title}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400 mb-2 font-mono">
                      {card.subtitle}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>

                {/* Footer Section & Quick Action Button */}
                <div className="pt-6 mt-6 border-t border-slate-800/80 space-y-3">
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span>API Route:</span>
                    <span className="text-slate-300">{card.apiEndpoint}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(card.route)}
                      className={`w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-xs font-semibold text-white flex items-center justify-center gap-2 group/btn transition-all shadow-md`}
                    >
                      <span>{card.quickActionLabel}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover/btn:text-white group-hover/btn:translate-x-1 transition-all" />
                    </button>

                    {card.secondaryRoute && (
                      <button
                        onClick={() => navigate(card.secondaryRoute)}
                        className="py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all"
                        title="View Rules Directory"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
