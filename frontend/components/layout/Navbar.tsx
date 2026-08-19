'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Activity, CheckCircle2, AlertCircle, AlertOctagon, Car, Menu } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const pathname = usePathname();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [aiServiceStatus, setAiServiceStatus] = useState<'online' | 'offline'>('offline');
  const [aiReason, setAiReason] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      setBackendStatus('checking');
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiHost}/health`);

      if (res.ok) {
        const data = await res.json();
        setBackendStatus('connected');
        const isOnline = data.aiService === 'online';
        setAiServiceStatus(isOnline ? 'online' : 'offline');
        setAiReason(data.aiServiceReason || (isOnline ? 'Service Connected' : 'Python AI service unreachable'));
      } else {
        setBackendStatus('offline');
        setAiServiceStatus('offline');
        setAiReason(`Node Backend returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      setBackendStatus('offline');
      setAiServiceStatus('offline');
      setAiReason('Node Express Backend unreachable on localhost:5000');
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const healthTooltip = `Backend: ${backendStatus.toUpperCase()} | AI Service: ${aiServiceStatus.toUpperCase()}${aiReason ? ` (${aiReason})` : ''}`;

  return (
    <header className="sticky top-0 z-40 w-full glass-nav px-4 sm:px-6 py-3 transition-all border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight font-outfit">
                SafeWay<span className="text-cyan-400 font-extrabold">.AI</span>
              </span>
              <span className="hidden sm:block text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                Drive Safer. Arrive Smarter.
              </span>
            </div>
          </Link>
        </div>

        {/* Status & Quick Action Buttons */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Dual API & AI Health Status Badge */}
          <button
            onClick={checkHealth}
            title={healthTooltip}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900 text-xs font-mono font-medium hover:border-slate-700 transition-all cursor-pointer"
          >
            {backendStatus === 'connected' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-bold">Backend: CONNECTED</span>
                <span className="text-slate-600">|</span>
                <span className={aiServiceStatus === 'online' ? 'text-cyan-400 font-bold' : 'text-amber-400'}>
                  AI: {aiServiceStatus.toUpperCase()}
                </span>
              </>
            ) : backendStatus === 'offline' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-400 font-bold">Backend Disconnected</span>
              </>
            ) : (
              <>
                <Activity className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="text-amber-400 font-bold">Verifying...</span>
              </>
            )}
          </button>

          {/* Driving Mode Shortcut */}
          <Link
            href="/drowsiness"
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-all"
          >
            <Car className="w-4 h-4 text-cyan-400" />
            <span>Driver Monitor</span>
          </Link>

          {/* SOS Shortcut */}
          <Link
            href="/emergency"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 hover:scale-105 transition-all"
          >
            <AlertOctagon className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Emergency SOS</span>
            <span className="sm:hidden">SOS</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

