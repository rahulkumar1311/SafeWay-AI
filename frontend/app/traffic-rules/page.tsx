'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Car,
  Filter,
  RefreshCw
} from 'lucide-react';
import trafficRuleApi from '@/services/trafficRuleApi';
import { TrafficRule } from '@/types';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';

const INDIAN_STATES = [
  'Bihar',
  'Maharashtra',
  'Delhi',
  'Karnataka',
  'Tamil Nadu',
  'Uttar Pradesh',
  'Gujarat',
  'West Bengal',
  'Andhra Pradesh',
  'Assam',
  'Goa',
  'Haryana',
  'Kerala',
  'Punjab',
  'Rajasthan',
  'Telangana'
];

const CATEGORIES = [
  'All',
  'Helmet',
  'Seat Belt',
  'Speed Limit',
  'Drunk Driving',
  'Mobile Phone While Driving',
  'Signal Violation',
  'No Parking',
  'Overloading',
  'Pollution/PUC',
  'Driving Without Licence',
  'Insurance',
  'Traffic Signs',
  'Emergency Vehicles'
];

export default function TrafficRulesPage() {
  const [selectedState, setSelectedState] = useState<string>('Bihar');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rules, setRules] = useState<TrafficRule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

  const fetchRules = async (queryToSearch = searchQuery) => {
    try {
      setIsLoading(true);
      setErrorMsg('');

      let response;
      if (queryToSearch.trim()) {
        response = await trafficRuleApi.searchRules(queryToSearch.trim(), {
          state: selectedState,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          limit: 50
        });
      } else {
        response = await trafficRuleApi.getRulesByState(selectedState, {
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          limit: 50
        });
      }

      if (response && response.data) {
        setRules(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setRules([]);
      }
    } catch (err: any) {
      console.error('Fetch traffic rules error:', err);
      setErrorMsg(err.message || 'Failed to load traffic rules from backend service.');
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // When state or category changes, fetch rules cleanly
    fetchRules(searchQuery);
  }, [selectedState, selectedCategory]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSearchQuery('');
    fetchRules('');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRules(searchQuery);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Government Verified Legal Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-outfit">
            Indian Traffic Rules & Penalties Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Sourced directly from MoRTH, Motor Vehicles (Amendment) Act 2019, and official State Transport Department Gazettes.
          </p>
        </div>

        {/* State Selector */}
        <div className="flex items-center gap-2 glass-card p-2 rounded-2xl border border-slate-800 shrink-0">
          <MapPin className="w-4 h-4 text-cyan-400 ml-2" />
          <span className="text-xs text-slate-400 font-semibold">State:</span>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {INDIAN_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="glass-card rounded-3xl p-4 sm:p-6 border border-slate-800 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search helmet, speeding, seat belt, section code..."
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all"
          >
            <span>Search</span>
          </button>
        </form>

        {/* Categories Horizontal Scroll Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-500 shrink-0 mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && <LoadingState message={`Fetching verified traffic rules for ${selectedState}...`} />}

      {!isLoading && errorMsg && <ErrorState message={errorMsg} onRetry={fetchRules} />}

      {!isLoading && !errorMsg && rules.length === 0 && (
        <EmptyState
          title="No Traffic Rules Found"
          message={`No rules matching category '${selectedCategory}' were found for ${selectedState}.`}
        />
      )}

      {/* Rules Grid */}
      {!isLoading && !errorMsg && rules.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Showing {rules.length} Traffic Rules applicable in {selectedState}</span>
            <span>Total: {pagination.total || rules.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rules.map((rule) => (
              <div
                key={rule._id || rule.ruleCode}
                className="glass-card rounded-3xl p-6 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 bg-slate-900/60 shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                        {rule.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
                        {rule.ruleCode}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border ${
                        rule.status === 'VERIFIED'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      }`}
                    >
                      {rule.status === 'VERIFIED' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Verified Government Source</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          <span>Requires Verification</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white leading-snug">{rule.title}</h3>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                      <span>Scope: <strong className="text-cyan-400">{rule.scope}</strong> {rule.state ? `(${rule.state})` : '(Nationwide)'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Car className="w-3 h-3 text-slate-400" />
                        {(rule.applicableVehicleTypes || [rule.vehicleType]).join(', ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{rule.description}</p>
                  {rule.violation && (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                      <strong className="text-slate-300 font-semibold uppercase tracking-wider text-[10px] block">Violation Details</strong>
                      <span>{rule.violation}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Statutory Fine:</span>
                    <span className="text-xl font-extrabold text-amber-400 font-outfit">
                      {rule.fineAmount !== null && rule.fineAmount !== undefined ? `₹${rule.fineAmount.toLocaleString('en-IN')}` : 'Requires Verification'}
                    </span>
                  </div>

                  {rule.additionalPenalty && (
                    <div className="text-[11px] text-rose-300 bg-rose-950/30 border border-rose-500/20 px-3 py-1.5 rounded-lg">
                      <strong>Additional Penalty:</strong> {rule.additionalPenalty}
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 space-y-1 font-mono pt-1">
                    <div>Legal Section: <strong className="text-slate-300">{rule.legalSection}</strong></div>
                    <div className="flex items-center justify-between">
                      <span className="truncate max-w-[200px]">Source: {rule.sourceName}</span>
                      {rule.sourceUrl && (
                        <a
                          href={rule.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-sans font-bold"
                        >
                          <span>Official Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
