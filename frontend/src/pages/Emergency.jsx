import React, { useState, useEffect, useCallback } from 'react';
import {
  PhoneCall,
  ArrowLeft,
  ShieldAlert,
  AlertOctagon,
  UserPlus,
  Trash2,
  Edit2,
  Navigation,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Users,
  Info,
  Clock,
  RefreshCw,
  Send,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import { formatDate } from '../utils/formatters';

export const Emergency = () => {
  // Current Active User
  const [userId, setUserId] = useState('driver_user_101');

  // Location State for SOS
  const [latitude, setLatitude] = useState(28.6139);
  const [longitude, setLongitude] = useState(77.2090);
  const [geoError, setGeoError] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // Contacts State
  const [contacts, setContacts] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Add Contact Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRelationship, setFormRelationship] = useState('Parent');
  const [isAddingContact, setIsAddingContact] = useState(false);

  // Edit Contact Modal/State
  const [editingContact, setEditingContact] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRelationship, setEditRelationship] = useState('');
  const [isUpdatingContact, setIsUpdatingContact] = useState(false);

  // SOS Execution State
  const [showSosModal, setShowSosModal] = useState(false);
  const [isSendingSos, setIsSendingSos] = useState(false);
  const [sosResult, setSosResult] = useState(null);

  // Global Error & Success Alerts
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  /**
   * Capture current browser geolocation
   */
  const handleGetCurrentLocation = useCallback(() => {
    setGeoError(null);
    setIsLocating(true);

    if (!navigator.geolocation) {
      setGeoError('Browser Geolocation is not supported.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(Number(position.coords.latitude.toFixed(5)));
        setLongitude(Number(position.coords.longitude.toFixed(5)));
        setIsLocating(false);
      },
      (err) => {
        console.error('[Geolocation Error]', err);
        let msg = 'Could not obtain location.';
        if (err.code === 1) {
          msg = 'Location permission denied. Please enter coordinates manually.';
        } else if (err.code === 2) {
          msg = 'Location position unavailable.';
        } else if (err.code === 3) {
          msg = 'Location request timed out.';
        }
        setGeoError(msg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    // Attempt auto location capture on load
    handleGetCurrentLocation();
  }, [handleGetCurrentLocation]);

  /**
   * Fetch emergency contacts for selected userId (GET /api/emergency/contacts/:userId)
   */
  const fetchContacts = useCallback(async () => {
    if (!userId.trim()) return;

    try {
      setIsLoadingContacts(true);
      setApiError(null);

      const response = await apiClient.get(`/emergency/contacts/${encodeURIComponent(userId.trim())}`);

      if (response && response.success && Array.isArray(response.data)) {
        setContacts(response.data);
      } else {
        setContacts([]);
      }
    } catch (err) {
      console.error('[Fetch Contacts Error]', err);
      setApiError(err.message || 'Failed to fetch emergency contacts.');
      setContacts([]);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  /**
   * Add new emergency contact (POST /api/emergency/contacts)
   */
  const handleAddContact = async (e) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);

    if (!formName.trim() || !formPhone.trim() || !formRelationship.trim()) {
      setApiError('Please fill in all contact fields.');
      return;
    }

    try {
      setIsAddingContact(true);

      const payload = {
        userId: userId.trim(),
        name: formName.trim(),
        phone: formPhone.trim(),
        relationship: formRelationship.trim()
      };

      const response = await apiClient.post('/emergency/contacts', payload);

      if (response && response.success) {
        setSuccessMessage(`Emergency contact "${formName}" added successfully.`);
        setFormName('');
        setFormPhone('');
        fetchContacts();
      }
    } catch (err) {
      console.error('[Add Contact Error]', err);
      setApiError(err.message || 'Failed to add emergency contact.');
    } finally {
      setIsAddingContact(false);
    }
  };

  /**
   * Open Edit Contact Modal
   */
  const handleStartEditContact = (contact) => {
    setEditingContact(contact);
    setEditName(contact.name);
    setEditPhone(contact.phone);
    setEditRelationship(contact.relationship);
  };

  /**
   * Submit Contact Update (PUT /api/emergency/contacts/:contactId)
   */
  const handleUpdateContact = async (e) => {
    e.preventDefault();
    if (!editingContact) return;

    try {
      setIsUpdatingContact(true);
      setApiError(null);

      const response = await apiClient.put(`/emergency/contacts/${editingContact._id}`, {
        name: editName.trim(),
        phone: editPhone.trim(),
        relationship: editRelationship.trim()
      });

      if (response && response.success) {
        setSuccessMessage('Emergency contact updated successfully.');
        setEditingContact(null);
        fetchContacts();
      }
    } catch (err) {
      console.error('[Update Contact Error]', err);
      setApiError(err.message || 'Failed to update contact.');
    } finally {
      setIsUpdatingContact(false);
    }
  };

  /**
   * Delete contact (DELETE /api/emergency/contacts/:contactId)
   */
  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this emergency contact?')) return;

    try {
      setApiError(null);
      const response = await apiClient.delete(`/emergency/contacts/${contactId}`);

      if (response && response.success) {
        setSuccessMessage('Emergency contact deleted.');
        fetchContacts();
      }
    } catch (err) {
      console.error('[Delete Contact Error]', err);
      setApiError(err.message || 'Failed to delete contact.');
    }
  };

  /**
   * Dispatch SOS Emergency Alert (POST /api/emergency/sos)
   */
  const handleTriggerSOS = async () => {
    setShowSosModal(false);
    setApiError(null);
    setSosResult(null);

    try {
      setIsSendingSos(true);

      const payload = {
        userId: userId.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        eventType: 'SOS'
      };

      const response = await apiClient.post('/emergency/sos', payload);

      if (response && response.success && response.data) {
        setSosResult(response.data);
      } else {
        setApiError('Invalid or unexpected response from Emergency SOS service.');
      }
    } catch (err) {
      console.error('[SOS Trigger Error]', err);
      setApiError(err.message || 'Failed to dispatch SOS emergency alert.');
    } finally {
      setIsSendingSos(false);
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
              <PhoneCall className="w-6 h-6 text-rose-400" />
              Emergency SOS & Dispatch System
            </h1>
            <p className="text-xs text-slate-400">
              Instant Panic Trigger & Emergency Contact Dispatching
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5">
          <AlertOctagon className="w-3.5 h-3.5" /> POST /api/emergency/sos
        </span>
      </div>

      {/* Global Alerts Banner */}
      {apiError && (
        <div className="p-4 rounded-2xl glass-card border border-rose-500/30 bg-rose-950/20 text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold block text-rose-200">Emergency System Error</span>
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

      {/* Section 1: SOS Panic Trigger Hero Section */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-8 border border-rose-500/30 bg-gradient-to-r from-rose-950/50 via-slate-900 to-slate-950 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-extrabold tracking-wider uppercase inline-block">
              Emergency Panic Protocol
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Instant SOS Location Broadcast
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Triggers instant GPS location dispatch to all registered emergency contacts and logs an emergency alert event in the system.
            </p>

            {/* GPS Coordinates Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>Lat: <strong>{latitude}</strong>, Lng: <strong>{longitude}</strong></span>
              </div>

              <button
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Navigation className={`w-3.5 h-3.5 text-cyan-400 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Locating...' : 'Refresh GPS'}</span>
              </button>
            </div>

            {geoError && <p className="text-xs text-rose-400">{geoError}</p>}
          </div>

          {/* Huge Pulsing SOS Button */}
          <button
            onClick={() => setShowSosModal(true)}
            disabled={isSendingSos}
            className="group relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 text-white font-black text-xl sm:text-2xl tracking-widest uppercase flex flex-col items-center justify-center shadow-2xl shadow-rose-600/50 hover:scale-105 active:scale-95 transition-all duration-300 shrink-0 cursor-pointer border-4 border-white/20"
          >
            <AlertOctagon className="w-10 h-10 mb-1 group-hover:rotate-12 transition-transform" />
            <span>TRIGGER</span>
            <span className="text-sm font-bold tracking-normal opacity-90">SOS</span>
            <span className="absolute inset-0 rounded-full border-4 border-rose-500 animate-ping opacity-40 pointer-events-none" />
          </button>
        </div>

        {/* SOS Confirmation Modal */}
        {showSosModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md p-6 rounded-3xl glass-card border border-rose-500/40 bg-slate-900 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-base font-bold text-rose-400 flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5" /> Confirm SOS Alert Trigger
                </span>
                <button onClick={() => setShowSosModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <p>
                  You are about to trigger an emergency SOS alert for User ID: <strong className="text-white font-mono">{userId}</strong>.
                </p>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono space-y-1">
                  <div>GPS Latitude: {latitude}</div>
                  <div>GPS Longitude: {longitude}</div>
                  <div>Contacts to Notify: {contacts.length}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowSosModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTriggerSOS}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-4 h-4" /> Confirm & Send SOS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SOS Result & Provider Status Card */}
        {sosResult && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-rose-500/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-white">SOS Event Logged ({sosResult.sosId})</span>
              </div>
              <span className="text-xs font-mono text-slate-400">{formatDate(sosResult.timestamp)}</span>
            </div>

            {/* Notification Provider Status Notice - MANDATORY MVP NOTICE */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Backend Notification Provider Status
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                    sosResult.notification?.status === 'NOT_IMPLEMENTED_MVP'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : sosResult.notification?.status === 'NO_CONTACTS_REGISTERED'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {sosResult.notification?.status || 'PROCESSED'}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {sosResult.notification?.message || 'Emergency dispatch completed.'}
              </p>

              {/* Explicit Mandatory Explanation Disclaimer */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>MVP Notification Notice:</strong> Real-time SMS/Call delivery is simulated in the hackathon MVP (<code className="font-mono text-amber-300">NOT_IMPLEMENTED_MVP</code>). No real SMS fees or phone calls were incurred.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Emergency Contacts Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Add New Contact Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <form
            onSubmit={handleAddContact}
            className="p-6 rounded-3xl glass-card border border-slate-800 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-rose-400" /> Add Emergency Contact
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">POST /api/emergency/contacts</span>
            </div>

            {/* Active User ID Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target User ID (userId)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={fetchContacts}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  Fetch
                </button>
              </div>
            </div>

            {/* Contact Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Contact Full Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Phone Number (with country code)</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            {/* Relationship Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Relationship</label>
              <select
                value={formRelationship}
                onChange={(e) => setFormRelationship(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
              >
                <option value="Parent">Parent</option>
                <option value="Spouse">Spouse</option>
                <option value="Sibling">Sibling</option>
                <option value="Friend">Friend</option>
                <option value="Doctor">Doctor</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAddingContact}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <UserPlus className={`w-4 h-4 ${isAddingContact ? 'animate-spin' : ''}`} />
              <span>{isAddingContact ? 'Saving Contact...' : 'Save Emergency Contact'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Emergency Contacts List (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>Registered Contacts ({contacts.length})</span>
            </h2>

            <button
              onClick={fetchContacts}
              disabled={isLoadingContacts}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingContacts ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Contacts List Cards */}
          <div className="space-y-3">
            {isLoadingContacts ? (
              <div className="p-6 rounded-3xl glass-card border border-slate-800 text-center text-xs text-slate-400">
                Loading contacts for user "{userId}"...
              </div>
            ) : contacts.length > 0 ? (
              contacts.map((contact) => (
                <div
                  key={contact._id}
                  className="p-4 rounded-2xl glass-card border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-4 shadow-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{contact.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {contact.relationship}
                      </span>
                    </div>

                    <p className="text-xs text-cyan-400 font-mono">{contact.phone}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEditContact(contact)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                      title="Edit Contact"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteContact(contact._id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-colors"
                      title="Delete Contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 rounded-3xl glass-card border border-slate-800 text-center space-y-2 py-12 text-slate-500">
                <Users className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs text-slate-400">No emergency contacts registered for "{userId}".</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateContact}
            className="w-full max-w-md p-6 rounded-3xl glass-card border border-slate-800 bg-slate-900 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" /> Edit Emergency Contact
              </span>
              <button
                type="button"
                onClick={() => setEditingContact(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Relationship</label>
                <select
                  value={editRelationship}
                  onChange={(e) => setEditRelationship(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="Parent">Parent</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingContact(null)}
                className="w-1/2 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingContact}
                className="w-1/2 py-2 rounded-xl bg-cyan-600 text-white font-bold text-xs flex items-center justify-center gap-1"
              >
                <span>{isUpdatingContact ? 'Saving...' : 'Update Contact'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Emergency;
