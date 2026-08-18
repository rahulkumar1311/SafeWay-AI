import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  MapPin,
  Plus,
  Filter,
  CheckCircle2,
  Navigation,
  RefreshCw,
  Search,
  AlertCircle,
  Database,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { HazardMap } from '../components/HazardMap';
import apiClient from '../services/api';
import { formatDate } from '../utils/formatters';

export const Hazards = () => {
  // Map Center & Radius State
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // Default center (New Delhi)
  const [searchRadiusKm, setSearchRadiusKm] = useState(10);
  const [isNearbySearchMode, setIsNearbySearchMode] = useState(false);

  // Form State for Reporting a Hazard
  const [formType, setFormType] = useState('pothole');
  const [formSeverity, setFormSeverity] = useState('high');
  const [formDescription, setFormDescription] = useState('');
  const [formLatitude, setFormLatitude] = useState(28.6139);
  const [formLongitude, setFormLongitude] = useState(77.2090);

  // List & Filter State
  const [hazards, setHazards] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  /**
   * Browser Geolocation API: Request user's current GPS location
   */
  const handleGetCurrentLocation = () => {
    setGeoError(null);

    if (!navigator.geolocation) {
      setGeoError('Geolocation API is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setFormLatitude(Number(lat.toFixed(5)));
        setFormLongitude(Number(lng.toFixed(5)));
        setMapCenter([lat, lng]);
        setGeoError(null);
      },
      (err) => {
        console.error('[Geolocation Error]', err);
        let msg = 'Could not retrieve your location.';
        if (err.code === 1) { // PERMISSION_DENIED
          msg = 'Location permission was denied by browser. Please enter coordinates manually or allow location access.';
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          msg = 'Location information is unavailable.';
        } else if (err.code === 3) { // TIMEOUT
          msg = 'Location request timed out.';
        }
        setGeoError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  /**
   * Fetch hazards list from backend API (GET /api/hazards or GET /api/hazards/nearby)
   */
  const fetchHazards = useCallback(async () => {
    try {
      setIsLoading(true);
      setApiError(null);

      if (isNearbySearchMode) {
        // Query GET /api/hazards/nearby
        const params = new URLSearchParams({
          latitude: mapCenter[0],
          longitude: mapCenter[1],
          radius: searchRadiusKm
        });

        const response = await apiClient.get(`/hazards/nearby?${params.toString()}`);
        if (response && response.success && Array.isArray(response.data)) {
          setHazards(response.data);
          setTotalCount(response.count || response.data.length);
          setTotalPages(1);
        }
      } else {
        // Query GET /api/hazards (Paginated with filters)
        const params = new URLSearchParams({
          page,
          limit: 10
        });

        if (filterType) params.append('type', filterType);
        if (filterStatus) params.append('status', filterStatus);
        if (filterSeverity) params.append('severity', filterSeverity);

        const response = await apiClient.get(`/hazards?${params.toString()}`);
        if (response && response.success && Array.isArray(response.data)) {
          setHazards(response.data);
          if (response.pagination) {
            setTotalPages(response.pagination.totalPages || 1);
            setTotalCount(response.pagination.totalRecords || response.data.length);
          }
        }
      }
    } catch (err) {
      console.error('[Fetch Hazards Error]', err);
      setApiError(err.message || 'Failed to fetch road hazards list from backend.');
    } finally {
      setIsLoading(false);
    }
  }, [isNearbySearchMode, mapCenter, searchRadiusKm, page, filterType, filterStatus, filterSeverity]);

  useEffect(() => {
    fetchHazards();
  }, [fetchHazards]);

  /**
   * Submit new hazard report via POST /api/hazards
   */
  const handleSubmitHazard = async (e) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);

    if (!formDescription.trim()) {
      setApiError('Please provide a description of the hazard.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        type: formType,
        severity: formSeverity,
        description: formDescription.trim(),
        latitude: Number(formLatitude),
        longitude: Number(formLongitude)
      };

      const response = await apiClient.post('/hazards', payload);

      if (response && response.success && response.data) {
        setSuccessMessage('Road hazard reported successfully!');
        setFormDescription('');
        // Update map center to newly reported hazard location
        setMapCenter([Number(formLatitude), Number(formLongitude)]);
        // Refresh list
        fetchHazards();
      }
    } catch (err) {
      console.error('[Create Hazard Error]', err);
      setApiError(err.message || 'Failed to report road hazard.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Update hazard status (e.g. resolve) via PATCH /api/hazards/:id
   */
  const handleResolveHazard = async (hazardId) => {
    try {
      setApiError(null);
      const response = await apiClient.patch(`/hazards/${hazardId}`, {
        status: 'resolved'
      });

      if (response && response.success) {
        setSuccessMessage('Hazard marked as resolved!');
        fetchHazards();
      }
    } catch (err) {
      console.error('[Resolve Hazard Error]', err);
      setApiError(err.message || 'Failed to update hazard status.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-8">
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
              <AlertTriangle className="w-6 h-6 text-purple-400" />
              Road Hazard Tracking & Reporting
            </h1>
            <p className="text-xs text-slate-400">
              GeoJSON Spatial Tracking for Potholes, Crashes, and Road Blockages
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" /> 2dsphere GeoJSON Indexing
          </span>
        </div>
      </div>

      {/* Global Messages Banner */}
      {apiError && (
        <div className="p-4 rounded-2xl glass-card border border-rose-500/30 bg-rose-950/20 text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold block text-rose-200">Hazard Service Alert</span>
            <p className="text-rose-300/90">{apiError}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl glass-card border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-xs text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Section 1: Leaflet Map & Search Mode Controls */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNearbySearchMode(false)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                !isNearbySearchMode
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>All Hazards List</span>
            </button>

            <button
              onClick={() => setIsNearbySearchMode(true)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                isNearbySearchMode
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Geospatial Radius Search</span>
            </button>
          </div>

          {/* Radius Slider for Nearby Mode */}
          {isNearbySearchMode && (
            <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
              <span>Radius:</span>
              <input
                type="range"
                min="1"
                max="50"
                value={searchRadiusKm}
                onChange={(e) => setSearchRadiusKm(Number(e.target.value))}
                className="w-28 accent-cyan-400 cursor-pointer"
              />
              <span className="text-cyan-400 font-bold w-12">{searchRadiusKm} km</span>
            </div>
          )}

          <button
            onClick={fetchHazards}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh Hazards Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Interactive Leaflet Map */}
        <HazardMap
          hazards={hazards}
          center={mapCenter}
          zoom={12}
          searchRadiusKm={isNearbySearchMode ? searchRadiusKm : null}
          onResolveHazard={handleResolveHazard}
        />
      </div>

      {/* Section 2 & 3: Main Grid (Reporting Form on Left, Hazard List on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Report New Hazard Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <form
            onSubmit={handleSubmitHazard}
            className="p-6 rounded-3xl glass-card border border-slate-800 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" /> Report New Road Hazard
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">POST /api/hazards</span>
            </div>

            {/* Geolocation Button & Coordinates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Location Coordinates
                </label>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold flex items-center gap-1 transition-all"
                >
                  <Navigation className="w-3 h-3 text-cyan-400" />
                  <span>Use My GPS</span>
                </button>
              </div>

              {geoError && <p className="text-[11px] text-rose-400">{geoError}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">Latitude</span>
                  <input
                    type="number"
                    step="any"
                    value={formLatitude}
                    onChange={(e) => setFormLatitude(e.target.value)}
                    placeholder="Latitude"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">Longitude</span>
                  <input
                    type="number"
                    step="any"
                    value={formLongitude}
                    onChange={(e) => setFormLongitude(e.target.value)}
                    placeholder="Longitude"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>
              <span className="text-[10px] text-slate-500 block font-mono">
                GeoJSON saved as: [{formLongitude}, {formLatitude}]
              </span>
            </div>

            {/* Hazard Type & Severity Selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Hazard Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="pothole">Pothole</option>
                  <option value="accident">Accident</option>
                  <option value="roadblock">Roadblock</option>
                  <option value="waterlogging">Waterlogging</option>
                  <option value="construction">Construction</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Severity Level</label>
                <select
                  value={formSeverity}
                  onChange={(e) => setFormSeverity(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Hazard Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Hazard Description</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe the road hazard condition..."
                rows="3"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-purple-500 resize-none"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Plus className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'Submitting Report...' : 'Submit Road Hazard'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Hazards Filter & List (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filters Bar (when not in nearby search mode) */}
          {!isNearbySearchMode && (
            <div className="p-4 rounded-2xl glass-card border border-slate-800 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mr-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" /> Filters:
              </div>

              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="resolved">Resolved Only</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="pothole">Pothole</option>
                <option value="accident">Accident</option>
                <option value="roadblock">Roadblock</option>
                <option value="waterlogging">Waterlogging</option>
                <option value="construction">Construction</option>
                <option value="other">Other</option>
              </select>

              <select
                value={filterSeverity}
                onChange={(e) => {
                  setFilterSeverity(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          )}

          {/* Hazards Cards List */}
          <div className="space-y-3">
            {hazards.length > 0 ? (
              hazards.map((hazard) => (
                <div
                  key={hazard._id}
                  className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white uppercase tracking-wider">
                        {hazard.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          hazard.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : hazard.severity === 'high'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {hazard.status === 'resolved' ? 'Resolved' : `${hazard.severity} Severity`}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{hazard.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        Lat: {hazard.latitude?.toFixed(4)}, Lng: {hazard.longitude?.toFixed(4)}
                      </span>
                      <span>Reported: {formatDate(hazard.createdAt || hazard.recordedAt)}</span>
                    </div>
                  </div>

                  {hazard.status === 'active' && (
                    <button
                      onClick={() => handleResolveHazard(hazard._id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 rounded-3xl glass-card border border-slate-800 text-center space-y-2 py-12 text-slate-500">
                <AlertTriangle className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs text-slate-400">No road hazards found matching criteria.</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {!isNearbySearchMode && totalPages > 1 && (
            <div className="flex items-center justify-between p-4 rounded-2xl glass-card border border-slate-800 text-xs text-slate-400">
              <span>Showing Page {page} of {totalPages} ({totalCount} total hazards)</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Hazards;
