import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Eye,
  TrafficCone,
  ShieldAlert,
  FileText,
  AlertTriangle,
  PhoneCall,
  BookOpen,
  X,
  Cpu,
  Server
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
  { path: '/drowsiness', label: 'Drowsiness Detection AI', icon: Eye, badge: 'AI' },
  { path: '/traffic-sign', label: 'Traffic Sign Recognition', icon: TrafficCone, badge: 'AI' },
  { path: '/safety', label: 'Safety Risk Analysis', icon: ShieldAlert },
  { path: '/challans', label: 'E-Challan & Fines', icon: FileText },
  { path: '/hazards', label: 'Road Hazards', icon: AlertTriangle },
  { path: '/emergency', label: 'Emergency SOS', icon: PhoneCall, isEmergency: true },
  { path: '/rules', label: 'Traffic Rules Directory', icon: BookOpen }
];

export const Sidebar = () => {
  const { sidebarOpen, closeSidebar } = useApp();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-72 bg-slate-900/95 border-r border-slate-800 backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-[calc(100vh-65px)] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation Items Header & List */}
        <div className="p-4 overflow-y-auto">
          {/* Mobile Drawer Close Button */}
          <div className="flex items-center justify-between lg:hidden mb-6 pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Navigation Menu</span>
            <button
              onClick={closeSidebar}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-3">
            Core Modules
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                      isActive
                        ? item.isEmergency
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-lg shadow-rose-900/20'
                          : 'bg-gradient-to-r from-blue-600/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-900/20 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold tracking-wider rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Architecture Information */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="glass-card rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>System Topology</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Server className="w-3 h-3 text-blue-400" /> Express Backend
                </span>
                <span className="font-mono text-cyan-400">:5000</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-teal-400" /> Python AI Service
                </span>
                <span className="font-mono text-cyan-400">:8000</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
