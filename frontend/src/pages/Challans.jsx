import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  ArrowLeft,
  MapPin,
  Filter,
  ArrowUpDown,
  ExternalLink,
  IndianRupee,
  Bike,
  Car,
  Truck,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import { formatDate } from '../utils/formatters';

const INDIAN_STATES = [
  'Delhi',
  'Maharashtra',
  'Bihar',
  'Karnataka',
  'Tamil Nadu',
  'Uttar Pradesh',
  'West Bengal',
  'Rajasthan',
  'Gujarat',
  'Punjab',
  'Haryana',
  'Kerala'
];

const VEHICLE_TYPES = ['All', 'TwoWheeler', 'FourWheeler', 'Commercial'];

const CATEGORIES = [
  'All Categories',
  'Helmet',
  'Speed',
  'Signal',
  'License',
  'DUI',
  'Seatbelt',
  'Parking',
  'Insurance'
];

export const Challans = () => {
  const [selectedState, setSelectedState] = useState('Delhi');
  const [selectedVehicleType, setSelectedVehicleType] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [page, setPage] = useState(1);
  const [limit] = useState(9); // 9 items per page (3x3 grid)

  const [fineRecords, setFineRecords] = useState([]);
  const [stateName, setStateName] = useState('Delhi');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  /**
   * Fetch state-wise defined traffic fines from GET /api/challans/:state
   */
  const fetchChallanInfo = useCallback(async () => {
    if (!selectedState) return;

    try {
      setIsLoading(true);
      setApiError(null);

      const params = new URLSearchParams({
        page,
        limit
      });

      if (selectedCategory && selectedCategory !== 'All Categories') {
        params.append('category', selectedCategory);
      }

      if (selectedVehicleType && selectedVehicleType !== 'All') {
        params.append('vehicleType', selectedVehicleType);
      }

      // Query Express Backend GET /api/challans/:state
      const response = await apiClient.get(`/challans/${encodeURIComponent(selectedState)}?${params.toString()}`);

      if (response && response.success && Array.isArray(response.data)) {
        let items = response.data;

        // Perform client-side sorting based on fineAmount
        items = [...items].sort((a, b) => {
          const fineA = Number(a.fineAmount) || 0;
          const fineB = Number(b.fineAmount) || 0;
          return sortOrder === 'desc' ? fineB - fineA : fineA - fineB;
        });

        setFineRecords(items);
        setStateName(response.stateName || selectedState);
        if (response.pagination) {
          setPagination(response.pagination);
        } else {
          setPagination({ page, totalPages: 1, total: items.length });
        }
      } else {
        setFineRecords([]);
        setPagination({ page: 1, totalPages: 1, total: 0 });
      }
    } catch (err) {
      console.error('[Challan Info Fetch Error]', err);
      setApiError(err.message || `Failed to fetch defined traffic fine records for ${selectedState}.`);
      setFineRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedState, selectedCategory, selectedVehicleType, sortOrder, page, limit]);

  useEffect(() => {
    fetchChallanInfo();
  }, [fetchChallanInfo]);

  const handleStateChange = (e) => {
    setSelectedState(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPage(1);
  };

  const handleVehicleTypeChange = (type) => {
    setSelectedVehicleType(type);
    setPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  // Helper icon renderer for vehicle type
  const renderVehicleIcon = (type) => {
    switch (type) {
      case 'TwoWheeler':
        return <Bike className="w-4 h-4 text-cyan-400" />;
      case 'FourWheeler':
        return <Car className="w-4 h-4 text-blue-400" />;
      case 'Commercial':
        return <Truck className="w-4 h-4 text-purple-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
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
              <FileText className="w-6 h-6 text-amber-400" />
              Defined Traffic Fine Information
            </h1>
            <p className="text-xs text-slate-400">
              Statutory Fine Amounts & Motor Vehicle Penalty Guidelines by State
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> GET /api/challans/:state
        </span>
      </div>

      {/* Mandatory Disclaimer Notice Banner */}
      <div className="p-4 rounded-2xl glass-card border border-amber-500/30 bg-amber-950/20 text-amber-200 flex items-start gap-3 shadow-lg">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold text-amber-300 block">
            Defined Traffic Fine Information Service Notice
          </span>
          <p className="text-amber-200/90 leading-relaxed">
            This module displays <strong>defined traffic fine amounts</strong> and statutory penalty guidelines established under state Motor Vehicle Act regulations. This feature is for informational reference and is <strong>not a live government e-Challan registration lookup</strong>.
          </p>
        </div>
      </div>

      {/* Filter & Sort Controls Panel */}
      <div className="p-4 rounded-3xl glass-card border border-slate-800 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* State Selection Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> Select State
            </label>
            <select
              value={selectedState}
              onChange={handleStateChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-amber-500 transition-colors"
            >
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-cyan-400" /> Violation Category
            </label>
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-500 transition-colors"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Type Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-blue-400" /> Vehicle Type
            </label>
            <div className="flex items-center gap-1 flex-wrap">
              {VEHICLE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleVehicleTypeChange(type)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    selectedVehicleType === type
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {renderVehicleIcon(type)}
                  <span>{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort Order Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" /> Sort Fine Amount
            </label>
            <button
              onClick={toggleSortOrder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-white text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>{sortOrder === 'desc' ? 'Highest Fine First' : 'Lowest Fine First'}</span>
              <ArrowUpDown className="w-4 h-4 text-purple-400" />
            </button>
          </div>
        </div>
      </div>

      {/* API Error Box */}
      {apiError && (
        <div className="p-4 rounded-2xl glass-card border border-rose-500/30 bg-rose-950/20 text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="text-xs font-medium">{apiError}</span>
          </div>
          <button
            onClick={fetchChallanInfo}
            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Defined Fines Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Defined Fines for {stateName}</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {pagination.total} Fine Records Found
          </span>
        </div>

        {isLoading ? (
          /* Loading Skeleton Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-6 rounded-3xl glass-card border border-slate-800 animate-pulse space-y-4">
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-6 bg-slate-800 rounded w-2/3" />
                <div className="h-12 bg-slate-800 rounded" />
                <div className="h-8 bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : fineRecords.length > 0 ? (
          /* Defined Fine Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fineRecords.map((item) => (
              <div
                key={item.id || item.title}
                className="p-6 rounded-3xl glass-card border border-slate-800/90 bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20 hover:border-amber-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Category & Vehicle Type Badges */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      {item.category || 'Traffic Penalty'}
                    </span>

                    <span className="text-[11px] font-semibold text-slate-300 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                      {renderVehicleIcon(item.vehicleType)}
                      <span>{item.vehicleType || 'All'}</span>
                    </span>
                  </div>

                  {/* Violation Title */}
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Fine Amount & Source Link */}
                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Statutory Fine Amount</span>
                    <div className="flex items-center text-amber-400 font-extrabold text-lg font-mono">
                      <IndianRupee className="w-4 h-4 mr-0.5" />
                      <span>{Number(item.fineAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>State: {stateName}</span>

                    {item.sourceUrl ? (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-sans font-medium"
                      >
                        <span>Official Source</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-slate-500">Official Gazette</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State Display */
          <div className="p-12 rounded-3xl glass-card border border-slate-800 text-center space-y-3 py-16 text-slate-500">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-300">No Defined Fines Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No traffic penalty records matched the selected state "{selectedState}" and filter parameters.
            </p>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl glass-card border border-slate-800 text-xs text-slate-400">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total fine records)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-amber-400 font-bold px-2">{page}</span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Challans;
