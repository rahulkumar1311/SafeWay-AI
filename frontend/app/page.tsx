'use client';

import React from 'react';
import Link from 'next/link';
import {
  Eye,
  BookOpen,
  Navigation,
  AlertTriangle,
  PhoneCall,
  ShieldAlert,
  ArrowRight,
  Zap,
  Globe,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-16 animate-fade-in pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl glass-card p-8 sm:p-12 border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/60 shadow-2xl">
        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wide uppercase">
            <Zap className="w-4 h-4" />
            <span>Next-Generation Intelligent Road Safety</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-none font-outfit">
            Drive Safer. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
              Arrive Smarter.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-xl max-w-2xl leading-relaxed font-normal">
            SafeWay AI combines real-time driver fatigue monitoring, verified government traffic intelligence, geo-spatial hazard alerts, and automated emergency assistance into one intelligent road-safety platform.
          </p>

          <div className="pt-4 flex flex-wrap gap-4 items-center">
            <Link
              href="/drowsiness"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-cyan-500/25 hover:scale-105 transition-all"
            >
              <span>Start Driver Safety Monitor</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard"
              className="px-6 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm flex items-center gap-2 transition-all hover:border-slate-600"
            >
              <span>Explore Dashboard</span>
            </Link>
          </div>
        </div>

        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Feature Showcase Grid */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-extrabold text-white font-outfit">
            Comprehensive Road Safety Suite
          </h2>
          <p className="text-slate-400 text-sm">
            Powered by computer vision models, official legal directories, and live geo-spatial telemetry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-cyan-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">AI Drowsiness Detection</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Real-time computer vision monitoring for eye closures, blink duration, and fatigue detection with instant auditory alerts.
            </p>
            <Link href="/drowsiness" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <span>Launch Monitor</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-cyan-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Traffic Rule Intelligence</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Access verified central and state-specific Indian traffic rules, penalty amounts, and Motor Vehicles Act legal sections.
            </p>
            <Link href="/traffic-rules" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <span>Browse Rules</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-cyan-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-110 transition-transform">
              <Navigation className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Smart Route Navigation</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Interactive navigation with integrated route safety warnings, sharp turn advisories, and school zone indicators.
            </p>
            <Link href="/navigation" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <span>Open Navigation</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-cyan-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Road Hazard Alerts</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Geospatial reporting for potholes, construction zones, accidents, and severe weather road blockages.
            </p>
            <Link href="/hazards" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <span>View Hazard Map</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-cyan-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 transition-transform">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Emergency SOS Dispatch</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              One-touch emergency alert system broadcasting real-time GPS location coordinates to registered emergency contacts.
            </p>
            <Link href="/emergency" className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1">
              <span>Setup Emergency SOS</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-cyan-500/40 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Driving Safety Score</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Composite telemetry evaluation algorithm calculating driving safety scores (0-100) and actionable recommendations.
            </p>
            <Link href="/safety" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <span>View Safety Score</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="glass-card rounded-3xl p-8 border border-slate-800 space-y-8 bg-slate-900/40">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-extrabold text-white font-outfit">How SafeWay AI Protects You</h2>
          <p className="text-slate-400 text-xs">Four continuous steps powering your intelligent road companion.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">1</div>
            <h4 className="text-base font-bold text-white">Detect</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Captures real-time driver attentiveness and vehicle telemetry through camera and sensors.</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm">2</div>
            <h4 className="text-base font-bold text-white">Analyze</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Evaluates fatigue levels, road hazard proximity, and statutory speed limits via backend engines.</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">3</div>
            <h4 className="text-base font-bold text-white">Warn</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Synthesizes audio alerts and voice warnings before risk escalation occurs.</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm">4</div>
            <h4 className="text-base font-bold text-white">Protect</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Dispatches emergency SOS notifications and guides driver to nearby safe rest areas.</p>
          </div>
        </div>
      </section>

      {/* Trust & Transparency */}
      <section className="glass-card rounded-3xl p-8 border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/30 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            <span>Government Sourced & Verified</span>
          </div>

          <h3 className="text-2xl font-bold text-white">Verified Legal Information & Fines</h3>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Traffic rules and fine structures presented in SafeWay AI are directly compiled from Ministry of Road Transport & Highways (MoRTH), The Motor Vehicles (Amendment) Act 2019, and official State Transport Department Gazettes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 shrink-0">
          <div className="px-5 py-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
            <span className="text-2xl font-extrabold text-white">30+</span>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Verified Rules</p>
          </div>
          <div className="px-5 py-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
            <span className="text-2xl font-extrabold text-cyan-400">100%</span>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Source Traceable</p>
          </div>
        </div>
      </section>
    </div>
  );
}
