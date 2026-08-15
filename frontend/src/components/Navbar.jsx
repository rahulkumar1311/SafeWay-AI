import React from 'react';
import { useApp } from '../context/AppContext';
import { Menu, ShieldCheck, Activity, Bell, AlertOctagon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  const { toggleSidebar, apiStatus, checkApiHealth } = useApp();

  return (
    <header className="sticky top-0 z-30 w-full glass-nav px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between">
        {/* Left Section: Mobile Menu Toggle & Brand */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
                SafeWay<span className="text-cyan-400 font-extrabold">.AI</span>
              </span>
              <span className="hidden sm:block text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                Driver Safety & Mobility Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Right Section: API Status & Quick Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* API Health Status Badge */}
          <button
            onClick={checkApiHealth}
            title="Click to re-check Backend API connection"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700/60 bg-slate-900/60 text-xs font-medium hover:border-slate-600 transition-all cursor-pointer"
          >
            {apiStatus === 'healthy' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-emerald-400 hidden sm:inline">Backend API Connected</span>
                <span className="text-emerald-400 sm:hidden">Online</span>
              </>
            )}
            {apiStatus === 'offline' && (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-rose-400 hidden sm:inline">Backend API Disconnected</span>
                <span className="text-rose-400 sm:hidden">Offline</span>
              </>
            )}
            {apiStatus === 'checking' && (
              <>
                <Activity className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="text-amber-400 hidden sm:inline">Connecting API...</span>
                <span className="text-amber-400 sm:hidden">Checking...</span>
              </>
            )}
          </button>

          {/* Quick SOS Shortcut Link */}
          <Link
            to="/emergency"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 hover:scale-105 transition-all"
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
