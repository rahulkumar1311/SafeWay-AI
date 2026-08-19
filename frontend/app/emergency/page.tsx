'use client';

import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  AlertOctagon,
  Plus,
  Trash2,
  MapPin,
  RefreshCw,
  X,
  User,
  Phone,
  Radio
} from 'lucide-react';
import emergencyApi from '@/services/emergencyApi';
import { EmergencyContact, SOSResult } from '@/types';
import LoadingState from '@/components/common/LoadingState';

export default function EmergencyPage() {
  const userId = 'user_safeway_01';
  const [location] = useState({ lat: 25.5941, lng: 85.1376 });
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showSOSConfirmModal, setShowSOSConfirmModal] = useState<boolean>(false);
  const [isTriggeringSOS, setIsTriggeringSOS] = useState<boolean>(false);
  const [sosResult, setSosResult] = useState<SOSResult | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('Family');

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const response = await emergencyApi.getContacts(userId);
      if (response && response.data) {
        setContacts(response.data);
      } else {
        setContacts([]);
      }
    } catch (err) {
      console.warn('Fetch emergency contacts error:', err);
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    try {
      const response = await emergencyApi.createContact({
        userId,
        name: name.trim(),
        phone: phone.trim(),
        relationship
      });
      if (response && response.success) {
        setShowAddModal(false);
        setName('');
        setPhone('');
        fetchContacts();
      }
    } catch (err: any) {
      console.error('Add contact error:', err);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await emergencyApi.deleteContact(contactId);
      fetchContacts();
    } catch (err: any) {
      console.error('Delete contact error:', err);
    }
  };

  const handleConfirmSOS = async () => {
    try {
      setIsTriggeringSOS(true);
      const response = await emergencyApi.triggerSOS({
        userId,
        latitude: location.lat,
        longitude: location.lng,
        eventType: 'CRASH',
        timestamp: new Date().toISOString()
      });

      if (response && response.data) {
        setSosResult(response.data);
      }
    } catch (err: any) {
      console.error('SOS trigger error:', err);
    } finally {
      setIsTriggeringSOS(false);
      setShowSOSConfirmModal(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
            <PhoneCall className="w-4 h-4" />
            <span>Critical Driver Safety Protocol</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-outfit">
            Emergency SOS Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            One-touch emergency dispatch sending real-time GPS location coordinates to registered emergency contacts.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <MapPin className="w-4 h-4 text-rose-400" />
          <span>GPS Coordinates: <strong className="text-white">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</strong></span>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-8 border border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 text-center space-y-6 shadow-2xl">
        <div className="max-w-md mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-rose-400">One-Touch Emergency Dispatch</span>
          <h2 className="text-2xl font-extrabold text-white">Press for Emergency Assistance</h2>
          <p className="text-xs text-slate-300">
            Broadcasting live GPS coordinates to {contacts.length} registered contact(s).
          </p>
        </div>

        <div className="py-4">
          <button
            onClick={() => setShowSOSConfirmModal(true)}
            className="w-40 h-40 rounded-full bg-gradient-to-tr from-rose-600 via-red-600 to-rose-500 text-white font-black text-3xl shadow-2xl shadow-rose-600/50 hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-rose-400/40 flex flex-col items-center justify-center mx-auto group cursor-pointer"
          >
            <AlertOctagon className="w-12 h-12 mb-1 group-hover:animate-pulse" />
            <span>SOS</span>
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-400 font-mono">
          <span>Police: <strong className="text-white">112</strong></span>
          <span>Ambulance: <strong className="text-white">108</strong></span>
          <span>Highway Patrol: <strong className="text-white">1033</strong></span>
        </div>
      </div>

      {sosResult && (
        <div className="glass-card rounded-3xl p-6 border border-rose-500 bg-rose-950/40 space-y-4 animate-bounce">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <Radio className="w-5 h-5 animate-pulse" />
              <span className="text-base text-white">SOS Emergency Alert Broadcasted!</span>
            </div>
            <span className="text-xs font-mono text-slate-400">{sosResult.sosId}</span>
          </div>

          <div className="text-xs text-slate-300 space-y-1">
            <p><strong>Status:</strong> {sosResult.notification?.message || 'Emergency dispatch payload created.'}</p>
            <p><strong>Notified Contacts:</strong> {sosResult.contactsNotifiedCount} person(s)</p>
          </div>
        </div>
      )}

      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Registered Emergency Contacts</h3>
            <p className="text-xs text-slate-400">People notified automatically during an SOS emergency event</p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>

        {isLoading && <LoadingState message="Loading registered emergency contacts..." />}

        {!isLoading && contacts.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2 border border-dashed border-slate-800 rounded-2xl">
            <User className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-bold text-white">No Emergency Contacts Registered</p>
            <p>Add at least one family member or emergency contact to receive SOS alerts.</p>
          </div>
        )}

        {!isLoading && contacts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((c) => (
              <div
                key={c._id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <strong className="text-sm font-bold text-white block">{c.name}</strong>
                  <div className="text-xs text-cyan-400 font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{c.phone}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{c.relationship}</span>
                </div>

                <button
                  onClick={() => handleDeleteContact(c._id)}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
                  title="Remove contact"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSOSConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-md w-full border border-rose-500/60 bg-slate-900 space-y-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/40 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white">Confirm Emergency SOS?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                This will trigger an immediate emergency notification with your GPS location coordinates to your registered emergency contacts.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowSOSConfirmModal(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSOS}
                disabled={isTriggeringSOS}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/40"
              >
                {isTriggeringSOS ? 'Broadcasting...' : 'YES, TRIGGER SOS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-800 bg-slate-900 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Add Emergency Contact</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddContactSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Contact Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g. Jane Doe"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="E.g. +919876543210"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Relationship</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Family">Family / Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Friend">Friend</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
