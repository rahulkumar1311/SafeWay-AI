'use client';

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Volume2,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useAudioAlerts } from '@/hooks/useAudioAlerts';

export default function SettingsPage() {
  const { soundEnabled, setSoundEnabled, voiceGuidance, setVoiceGuidance } = useAudioAlerts();
  const [apiUrl, setApiUrl] = useState<string>(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');
  const [apiStatus, setApiStatus] = useState<string>('Connected');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    try {
      setApiStatus('Checking...');
      const res = await fetch(`${apiUrl}/health`);
      if (res.ok) {
        setApiStatus('Healthy / Connected');
      } else {
        setApiStatus('Disconnected');
      }
    } catch {
      setApiStatus('Disconnected');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
          <SettingsIcon className="w-4 h-4" />
          <span>Platform Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-outfit">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Configure API endpoints, driver alert tones, voice guidance, and camera inference parameters.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-900/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Server className="w-5 h-5 text-blue-400" />
              <span>Backend API Gateway Endpoint</span>
            </div>

            <button
              type="button"
              onClick={handleTestConnection}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Test Connection</span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Express API Gateway URL (NEXT_PUBLIC_API_URL)</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:5000/api"
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-400 font-mono">
              Status: <strong className="text-emerald-400">{apiStatus}</strong>
            </p>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-900/80 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-cyan-400" />
              <span>Driver Audio Alerts & Voice Guidance</span>
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div>
                <strong className="text-sm font-bold text-white block">Acoustic Drowsiness Alarm Tones</strong>
                <span className="text-xs text-slate-400">Synthesize alert tones when fatigue or drowsiness is detected</span>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div>
                <strong className="text-sm font-bold text-white block">Speech Guidance Readout</strong>
                <span className="text-xs text-slate-400">Announce safety advisories aloud via Web Speech Synthesis</span>
              </div>
              <input
                type="checkbox"
                checked={voiceGuidance}
                onChange={(e) => setVoiceGuidance(e.target.checked)}
                className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>

          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-400">Preferences saved!</span>
          )}
        </div>
      </form>
    </div>
  );
}
