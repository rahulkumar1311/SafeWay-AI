import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  ArrowLeft,
  Activity,
  Gauge,
  Zap,
  CheckCircle2,
  ListFilter,
  User,
  Car,
  AlertCircle,
  Database
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import { formatDate } from '../utils/formatters';

export const SafetyAnalysis = () => {
  // Input Form State
  const [userId, setUserId] = useState('driver_demo_777');
  const [speed, setSpeed] = useState(85);
  const [speedLimit, setSpeedLimit] = useState(60);
  const [drowsinessScore, setDrowsinessScore] = useState(65);
  const [harshBraking, setHarshBraking] = useState(2);
  const [roadHazard, setRoadHazard] = useState(true);

  // Analysis Result State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [result, setResult] = useState(null);

  /**
   * Handle form submission to POST /api/safety/analyze
   */
  const handleAnalyzeSafety = async (e) => {
    e.preventDefault();
    setApiError(null);

    // Frontend Basic Input Validation
    if (speed === '' || speed < 0) {
      setApiError('Vehicle speed must be a valid non-negative number.');
      return;
    }
    if (speedLimit === '' || speedLimit < 0) {
      setApiError('Speed limit must be a valid non-negative number.');
      return;
    }
    if (drowsinessScore === '' || drowsinessScore < 0 || drowsinessScore > 100) {
      setApiError('Drowsiness score must be a number between 0 and 100.');
      return;
    }
    if (harshBraking === '' || harshBraking < 0) {
      setApiError('Harsh braking count must be a valid non-negative number.');
      return;
    }

    try {
      setIsAnalyzing(true);

      // Post raw telemetry to Express backend proxy
      // The backend handles all official safety risk calculations and database persistence
      const response = await apiClient.post('/safety/analyze', {
        userId: userId.trim() || 'anonymous_driver',
        speed: Number(speed),
        speedLimit: Number(speedLimit),
        drowsinessScore: Number(drowsinessScore),
        harshBraking: Number(harshBraking),
        roadHazard: Boolean(roadHazard)
      });

      if (response && response.success && response.data) {
        setResult(response.data);
      } else {
        setApiError('Invalid or unexpected response from Safety Analysis service.');
      }
    } catch (err) {
      console.error('[Safety Analysis Error]', err);
      const msg = err.message || 'Failed to communicate with Safety Risk backend service.';
      setApiError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Determine Visual Badging & Styling for LOW, MEDIUM, HIGH risk levels
  const getRiskVisuals = (level) => {
    switch (level) {
      case 'HIGH':
        return {
          icon: AlertOctagon,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
          textColor: 'text-rose-400',
          progressColor: 'bg-rose-500',
          cardBg: 'from-rose-950/40 via-slate-900 to-slate-900',
          borderColor: 'border-rose-500/30'
        };
      case 'MEDIUM':
        return {
          icon: AlertTriangle,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          textColor: 'text-amber-400',
          progressColor: 'bg-amber-500',
          cardBg: 'from-amber-950/40 via-slate-900 to-slate-900',
          borderColor: 'border-amber-500/30'
        };
      case 'LOW':
      default:
        return {
          icon: ShieldCheck,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          textColor: 'text-emerald-400',
          progressColor: 'bg-emerald-500',
          cardBg: 'from-emerald-950/40 via-slate-900 to-slate-900',
          borderColor: 'border-emerald-500/30'
        };
    }
  };

  const riskVisuals = result ? getRiskVisuals(result.riskLevel) : null;
  const RiskIcon = riskVisuals ? riskVisuals.icon : null;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-emerald-400" />
              Safety Risk Analysis Engine
            </h1>
            <p className="text-xs text-slate-400">
              Composite Risk Score Evaluation & Driving Telemetry Analytics
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> POST /api/safety/analyze
        </span>
      </div>

      {/* Main Form & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <form
            onSubmit={handleAnalyzeSafety}
            className="p-6 rounded-3xl glass-card border border-slate-800 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-cyan-400" /> Vehicle Telemetry Input
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Input Parameters</span>
            </div>

            {/* User ID Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" /> User Identifier (userId)
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g. driver_user_101"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>

            {/* Speed & Speed Limit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" /> Speed (km/h)
                </label>
                <input
                  type="number"
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  min="0"
                  max="250"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-blue-400" /> Speed Limit
                </label>
                <input
                  type="number"
                  value={speedLimit}
                  onChange={(e) => setSpeedLimit(e.target.value)}
                  min="0"
                  max="200"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Drowsiness Score & Harsh Braking */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" /> Drowsiness (0-100)
                </label>
                <input
                  type="number"
                  value={drowsinessScore}
                  onChange={(e) => setDrowsinessScore(e.target.value)}
                  min="0"
                  max="100"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Harsh Brakes
                </label>
                <input
                  type="number"
                  value={harshBraking}
                  onChange={(e) => setHarshBraking(e.target.value)}
                  min="0"
                  max="50"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-rose-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Road Hazard Checkbox Toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-200 block">Nearby Road Hazard</span>
                <span className="text-[10px] text-slate-400">Pothole, obstruction, or crash alert</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={roadHazard}
                  onChange={(e) => setRoadHazard(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
              </label>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Evaluating Telemetry...' : 'Analyze Safety'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Returned Analysis Results (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Error Banner */}
          {apiError && (
            <div className="p-4 rounded-2xl glass-card border border-rose-500/30 bg-rose-950/20 text-rose-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold block text-rose-200">Safety Service Communication Error</span>
                <p className="text-rose-300/90">{apiError}</p>
              </div>
            </div>
          )}

          {/* Results Display */}
          {result ? (
            <div className={`p-6 rounded-3xl glass-card border ${riskVisuals.borderColor} bg-gradient-to-b ${riskVisuals.cardBg} space-y-6 shadow-2xl`}>
              {/* Risk Level Header Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <RiskIcon className={`w-6 h-6 ${riskVisuals.textColor}`} />
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Evaluated Risk Level
                    </span>
                    <h2 className="text-lg font-extrabold text-white">
                      Risk Rating: <span className={riskVisuals.textColor}>{result.riskLevel}</span>
                    </h2>
                  </div>
                </div>

                <span className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase border ${riskVisuals.badgeColor}`}>
                  {result.riskLevel} RISK
                </span>
              </div>

              {/* Dual Score Indicators (Risk Score & Driving Score) */}
              <div className="grid grid-cols-2 gap-4">
                {/* Composite Risk Score Gauge */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Composite Risk Score</span>
                    <span className={`font-mono text-lg font-extrabold ${riskVisuals.textColor}`}>
                      {result.riskScore} / 100
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${riskVisuals.progressColor}`}
                      style={{ width: `${Math.min(100, Math.max(0, result.riskScore))}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">Higher score indicates higher danger level</span>
                </div>

                {/* Driver Performance Score Gauge */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Driving Score</span>
                    <span className="font-mono text-lg font-extrabold text-emerald-400">
                      {result.drivingScore} / 100
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, result.drivingScore))}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">Calculated safe driving performance index</span>
                </div>
              </div>

              {/* Reasons List */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Identified Risk Signals & Reasons
                </span>
                <div className="space-y-1.5">
                  {result.reasons && result.reasons.length > 0 ? (
                    result.reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-200 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic">No specific risk signals detected.</div>
                  )}
                </div>
              </div>

              {/* Recommendations List */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Safety Recommendations
                </span>
                <div className="space-y-1.5">
                  {result.recommendations && result.recommendations.length > 0 ? (
                    result.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-emerald-300 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic">No active safety recommendations.</div>
                  )}
                </div>
              </div>

              {/* Registered Events & MongoDB Record ID Footer */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-cyan-400" /> Database Record ID:
                  </span>
                  <span className="text-cyan-300 font-bold">{result.recordId || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Persisted Timestamp:</span>
                  <span>{formatDate(result.recordedAt)}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Awaiting Analysis Placeholder */
            <div className="p-8 rounded-3xl glass-card border border-slate-800 text-center space-y-3 py-16 text-slate-500">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-300">Safety Telemetry Engine Ready</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Fill in vehicle speed, speed limit, drowsiness score, and braking count on the left, then click "Analyze Safety" to execute telemetry analysis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafetyAnalysis;
