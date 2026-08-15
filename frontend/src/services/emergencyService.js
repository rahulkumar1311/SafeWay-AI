import apiClient from './api';

/**
 * Emergency SOS & Contact Dispatch Service Client
 */

/**
 * Fetch emergency contacts for a given user
 */
export const getEmergencyContacts = async (userId) => {
  return apiClient.get(`/emergency/contacts/${encodeURIComponent(userId)}`);
};

/**
 * Add a new emergency contact
 */
export const createEmergencyContact = async (contactData) => {
  return apiClient.post('/emergency/contacts', contactData);
};

/**
 * Update an existing emergency contact
 */
export const updateEmergencyContact = async (contactId, updateData) => {
  return apiClient.put(`/emergency/contacts/${contactId}`, updateData);
};

/**
 * Delete an emergency contact
 */
export const deleteEmergencyContact = async (contactId) => {
  return apiClient.delete(`/emergency/contacts/${contactId}`);
};

/**
 * Dispatch SOS Emergency Alert
 */
export const triggerSOS = async (sosData) => {
  return apiClient.post('/emergency/sos', sosData);
};

export default {
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  triggerSOS
};
