import React, { useEffect, useRef } from 'react';
import { Eye, ShieldCheck, AlertOctagon, Clock, Activity, AlertCircle, Volume2 } from 'lucide-react';
import { formatDate, formatConfidence } from '../utils/formatters';

export const DrowsinessStatus = ({
  result,
  isDetecting,
  isAnalyzing,
  apiError,
  sessionId
}) => {
  const audioRef = useRef(null);

  // Play audio alert when isDrowsy transitions to true
  useEffect(() => {
    if (result && result.isDrowsy) {
      try {
        // Synthesize audio beep alert using Web Audio API if browser audio is supported
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz beep
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        }
      } catch (err) {
        // Ignore audio playback policy errors silently
      }
    }
  }, [result?.isDrowsy, result?.timestamp]);

  const score = result?.drowsinessScore ?? 0;
  const isDrowsy = result?.isDrowsy ?? false;
  const confidence = result?.confidence ?? 0;
  const timestamp = result?.timestamp;

  // Determine Alert State Level & Color Theme
  let alertState = 'STANDBY';
  let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
  let progressColor = 'bg-emerald-500';

  if (isDetecting) {
    if (score >= 70 || isDrowsy) {
      alertState = 'DROWSY (ALERT)';
      badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
      progressColor = 'bg-rose-500';
    } else if (score >= 50) {
      alertState = 'WARNING';
      badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      progressColor = 'bg-amber-500';
    } else {
      alertState = 'NORMAL';
      badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      progressColor = 'bg-emerald-500';
    }
  }

  return (
    <div className="space-y-4">
      {/* API Error Notification */}
      {apiError && (
        <div className="p-4 rounded-2xl glass-card border border-rose-500/30 bg-rose-950/20 text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold block text-rose-200">AI Service Communication Error</span>
            <p className="text-rose-300/90">{apiError}</p>
          </div>
        </div>
      )}

      {/* Main Status Panel */}
      <div className="p-6 rounded-3xl glass-card border border-slate-800 space-y-6">
        {/* Header Title & Alert Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Live Drowsiness Metrics</h2>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
            {alertState}
          </span>
        </div>

        {/* Drowsiness Gauge Score Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Drowsiness Risk Score</span>
            <span className={`font-mono text-base font-bold ${isDrowsy ? 'text-rose-400' : 'text-cyan-400'}`}>
              {score} / 100
            </span>
          </div>

          {/* Progress Bar Container */}
          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-0.5">
            <span>0 (Alert)</span>
            <span>50 (Caution)</span>
            <span>100 (Critical)</span>
          </div>
        </div>

        {/* Metric Details Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Driver Status
            </span>
            <div className="flex items-center gap-1.5">
              {isDrowsy ? (
                <>
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-rose-300">Drowsy Detected</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">Attentive</span>
                </>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              AI Confidence
            </span>
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white font-mono">
                {formatConfidence(confidence)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Details: Timestamp & Session ID */}
        <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" /> Last Analyzed:
            </span>
            <span className="text-slate-200">
              {timestamp ? formatDate(timestamp) : 'Awaiting frames...'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Session ID:</span>
            <span className="text-slate-400">{sessionId || 'default_session'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
