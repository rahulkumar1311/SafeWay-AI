'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  X,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Radio,
  LifeBuoy,
  Users,
  Send,
  Navigation
} from 'lucide-react';
import hazardApi from '@/services/hazardApi';
import { RoadHazard, HazardType, HazardSeverity } from '@/types';
import HazardMap from '@/components/hazards/HazardMap';
import LoadingState from '@/components/common/LoadingState';
import { useLiveGpsTracking } from '@/hooks/useLiveGpsTracking';
import { useV2VNetwork } from '@/hooks/useV2VNetwork';

const HAZARD_TYPES: { id: HazardType; label: string }[] = [
  { id: 'pothole', label: 'Pothole / Road Damage' },
  { id: 'accident', label: 'Vehicle Accident' },
  { id: 'roadblock', label: 'Road Blockade' },
  { id: 'waterlogging', label: 'Waterlogging / Flooding' },
  { id: 'construction', label: 'Road Construction' },
  { id: 'other', label: 'Other Hazard' }
];

export default function HazardsPage() {
  const gps = useLiveGpsTracking();
  const currentLat = gps.latitude ?? 25.5941;
  const currentLng = gps.longitude ?? 85.1376;

  const {
    v2vStatus,
    nearbyVehicles,
    safetyAlerts,
    activeHelpRequest,
    helpResponseStatus,
    requestHelp,
    acceptHelp,
    cancelHelp,
    broadcastSafetyEvent,
    reconnect
  } = useV2VNetwork({
    latitude: gps.latitude,
    longitude: gps.longitude,
    speedKmH: gps.speedKmH,
    heading: gps.heading
  });

  const [hazards, setHazards] = useState<RoadHazard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [helpMessage, setHelpMessage] = useState<string>('Need emergency assistance on road');

  // Report Form
  const [type, setType] = useState<HazardType>('pothole');
  const [description, setDescription] = useState<string>('');
  const [severity, setSeverity] = useState<HazardSeverity>('high');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const centerPos: [number, number] = [currentLat, currentLng];

  const fetchHazards = async () => {
    try {
      setIsLoading(true);
      const response = await hazardApi.getNearbyHazards(currentLat, currentLng, 20);
      if (response && response.data) {
        setHazards(response.data);
      } else {
        setHazards([]);
      }
    } catch (err: any) {
      console.warn('Fetch hazards error:', err);
      setHazards([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHazards();
  }, [currentLat, currentLng]);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await hazardApi.reportHazard({
        type,
        description: description.trim(),
        latitude: currentLat,
        longitude: currentLng,
        severity
      });

      if (response && response.success) {
        // Broadcast over V2V network to nearby vehicles
        broadcastSafetyEvent(
          'ROAD_HAZARD',
          `${type.toUpperCase()}: ${description.trim()}`,
          severity === 'high' ? 'HIGH' : 'MEDIUM'
        );

        setShowReportModal(false);
        setDescription('');
        fetchHazards();
      }
    } catch (err: any) {
      console.error('Report hazard error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendHelpRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const sent = requestHelp(helpMessage.trim() || 'Driver requires assistance.');
    if (sent) {
      setShowHelpModal(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>V2V Proximity Network & Safety Map</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-outfit">
            Nearby Vehicle Safety & Hazard Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time vehicle-to-vehicle safety broadcasts, emergency help requests, and road risk warnings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHelpModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
          >
            <LifeBuoy className="w-4 h-4" />
            <span>REQUEST HELP</span>
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Report Hazard</span>
          </button>
        </div>
      </div>

      {/* V2V Network Status Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${v2vStatus === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <strong className="text-white">V2V NETWORK: {v2vStatus === 'ONLINE' ? 'ONLINE' : 'OFFLINE'}</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">
            GPS: <strong className={gps.status === 'LIVE' ? 'text-emerald-400' : 'text-amber-400'}>{gps.status}</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-bold flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>Nearby Vehicles ({nearbyVehicles.length})</span>
          </span>
        </div>

        {helpResponseStatus && (
          <div className="px-3 py-1 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-bold animate-bounce">
            ✓ {helpResponseStatus}
          </div>
        )}
      </div>

      {/* Incoming V2V Help Request Alert Modal */}
      {activeHelpRequest && (
        <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500 text-white space-y-3 animate-pulse shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm uppercase">
              <LifeBuoy className="w-5 h-5" />
              <span>🚨 INCOMING V2V HELP REQUEST</span>
            </div>
            <span className="text-xs font-mono bg-rose-900/80 px-2.5 py-1 rounded-full border border-rose-700">
              {activeHelpRequest.distanceMeters}m ({activeHelpRequest.direction})
            </span>
          </div>

          <p className="text-xs text-rose-200">
            Driver <strong className="text-white">{activeHelpRequest.requestVehicleId}</strong> is requesting assistance: &quot;{activeHelpRequest.message}&quot;
          </p>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => acceptHelp(activeHelpRequest.requestId, activeHelpRequest.requestVehicleId, activeHelpRequest.requestSessionId)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase flex items-center gap-2 shadow-lg shadow-emerald-600/40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I CAN HELP</span>
            </button>
            <button
              onClick={() => cancelHelp(activeHelpRequest.requestId)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-xs"
            >
              Ignore
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-3xl p-4 border border-slate-800 bg-slate-900/80 space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-slate-300">
              Live Map ({hazards.length} hazards | {nearbyVehicles.length} nearby SafeWay vehicles)
            </span>
            <button onClick={fetchHazards} className="text-slate-400 hover:text-white text-xs flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Map</span>
            </button>
          </div>

          <HazardMap center={centerPos} hazards={hazards} nearbyVehicles={nearbyVehicles} />
        </div>

        <div className="glass-card rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Nearby SafeWay Network</span>
            </h3>

            {v2vStatus === 'OFFLINE' ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
                <strong className="block text-white uppercase font-bold">V2V NETWORK DISCONNECTED</strong>
                <p className="text-[11px] text-slate-400">Unable to reach SafeWay V2V WebSocket server on port 5000.</p>
                <button
                  onClick={reconnect}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all shadow-md shadow-purple-600/30"
                >
                  Reconnect V2V Network
                </button>
              </div>
            ) : v2vStatus === 'CONNECTING' ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
                <span className="block text-slate-200 font-bold">Connecting to V2V Network...</span>
              </div>
            ) : nearbyVehicles.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                <Navigation className="w-6 h-6 text-slate-500 mx-auto" />
                <span className="block text-slate-300 font-bold">No nearby SafeWay vehicles connected.</span>
                <p className="text-[11px] text-slate-500">Scanning for active vehicles within 500 meters radius...</p>
              </div>
            ) : (
              <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto pr-1">
                {nearbyVehicles.map((v) => (
                  <div key={v.vehicleId} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-cyan-400 font-bold uppercase">{v.vehicleId}</strong>
                      <span className="text-[10px] font-mono text-emerald-400">{v.distanceMeters}m ({v.direction})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex justify-between font-mono">
                      <span>Speed: {v.speed} km/h</span>
                      <span>Status: <strong className="text-white">{v.status}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              <span>Real-Time Broadcast Log</span>
            </h4>
            {safetyAlerts.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">No broadcast alerts received yet.</p>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {safetyAlerts.map((alt) => (
                  <div key={alt.id} className="p-2.5 rounded-xl bg-slate-950/90 border border-purple-500/30 text-[11px] space-y-0.5">
                    <div className="flex justify-between font-bold text-purple-300">
                      <span>{alt.type}</span>
                      <span className="font-mono text-[10px]">{alt.distanceMeters}m</span>
                    </div>
                    <p className="text-slate-300">{alt.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-800 bg-slate-900 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <LifeBuoy className="w-5 h-5" />
                <h3 className="text-lg text-white">Broadcast Emergency Help Request</h3>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendHelpRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Assistance Message</label>
                <textarea
                  value={helpMessage}
                  onChange={(e) => setHelpMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Help Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Hazard Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-800 bg-slate-900 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-purple-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white">Report Road Hazard</h3>
              </div>
              <button onClick={() => setShowReportModal(false)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Hazard Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as HazardType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {HAZARD_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Severity Level</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as HazardSeverity)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="low">Low (Minor Delay)</option>
                  <option value="medium">Medium (Use Caution)</option>
                  <option value="high">High (Significant Danger)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Description & Landmark</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g., Deep pothole on right lane near petrol pump..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
