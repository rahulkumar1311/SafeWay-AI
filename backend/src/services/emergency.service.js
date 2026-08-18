import mongoose from 'mongoose';
import EmergencyContact from '../models/EmergencyContact.js';
import { dispatchEmergencyNotification } from './notification.service.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Validates phone number format (basic international / national digit & format check)
 */
const isValidPhone = (phone) => {
  if (typeof phone !== 'string') return false;
  const cleanPhone = phone.trim();
  return /^\+?[0-9\s\-]{5,20}$/.test(cleanPhone);
};

/**
 * Create a new emergency contact
 */
export const createContact = async (contactData = {}) => {
  const { userId, name, phone, relationship } = contactData;

  const missingFields = [];
  if (!userId || typeof userId !== 'string' || !userId.trim()) missingFields.push('userId');
  if (!name || typeof name !== 'string' || !name.trim()) missingFields.push('name');
  if (!phone || typeof phone !== 'string' || !phone.trim()) missingFields.push('phone');
  if (!relationship || typeof relationship !== 'string' || !relationship.trim()) missingFields.push('relationship');

  if (missingFields.length > 0) {
    throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
  }

  if (!isValidPhone(phone)) {
    throw new ApiError(400, 'Invalid phone number format');
  }

  const newContact = await EmergencyContact.create({
    userId: String(userId).trim(),
    name: String(name).trim(),
    phone: String(phone).trim(),
    relationship: String(relationship).trim()
  });

  return newContact;
};

/**
 * Get all emergency contacts for a given user
 */
export const getContactsByUserId = async (userId) => {
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    throw new ApiError(400, 'User ID parameter is required');
  }

  const contacts = await EmergencyContact.find({ userId: String(userId).trim() })
    .select('-__v')
    .sort({ createdAt: -1 })
    .lean();

  return contacts;
};

/**
 * Update an existing emergency contact
 */
export const updateContact = async (contactId, updateData = {}) => {
  if (!contactId || !mongoose.Types.ObjectId.isValid(contactId)) {
    throw new ApiError(400, 'Invalid contactId format');
  }

  const contact = await EmergencyContact.findById(contactId);
  if (!contact) {
    throw new ApiError(404, 'Emergency contact not found');
  }

  const { name, phone, relationship } = updateData;

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      throw new ApiError(400, 'Name must be a non-empty string');
    }
    contact.name = String(name).trim();
  }

  if (phone !== undefined) {
    if (!isValidPhone(phone)) {
      throw new ApiError(400, 'Invalid phone number format');
    }
    contact.phone = String(phone).trim();
  }

  if (relationship !== undefined) {
    if (typeof relationship !== 'string' || !relationship.trim()) {
      throw new ApiError(400, 'Relationship must be a non-empty string');
    }
    contact.relationship = String(relationship).trim();
  }

  await contact.save();
  return contact;
};

/**
 * Delete an emergency contact
 */
export const deleteContact = async (contactId) => {
  if (!contactId || !mongoose.Types.ObjectId.isValid(contactId)) {
    throw new ApiError(400, 'Invalid contactId format');
  }

  const contact = await EmergencyContact.findByIdAndDelete(contactId);
  if (!contact) {
    throw new ApiError(404, 'Emergency contact not found');
  }

  return { message: 'Emergency contact deleted successfully' };
};

/**
 * Process SOS Emergency Request
 */
export const processSOS = async (sosData = {}) => {
  const { userId, latitude, longitude, timestamp, eventType = 'SOS' } = sosData;

  const missingFields = [];
  if (!userId || typeof userId !== 'string' || !userId.trim()) missingFields.push('userId');
  if (latitude === undefined || latitude === null || latitude === '') missingFields.push('latitude');
  if (longitude === undefined || longitude === null || longitude === '') missingFields.push('longitude');

  if (missingFields.length > 0) {
    throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
  }

  const latNum = Number(latitude);
  if (isNaN(latNum) || latNum < -90 || latNum > 90) {
    throw new ApiError(400, 'Latitude must be a valid number between -90 and 90');
  }

  const lngNum = Number(longitude);
  if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
    throw new ApiError(400, 'Longitude must be a valid number between -180 and 180');
  }

  const cleanUserId = String(userId).trim();

  // Fetch registered emergency contacts for the user
  const contacts = await EmergencyContact.find({ userId: cleanUserId })
    .select('-__v')
    .lean();

  const eventTime = timestamp ? new Date(timestamp) : new Date();
  const validTimestamp = isNaN(eventTime.getTime()) ? new Date().toISOString() : eventTime.toISOString();

  // Invoke notification provider abstraction
  const notificationResult = await dispatchEmergencyNotification({
    userId: cleanUserId,
    contacts,
    location: { latitude: latNum, longitude: lngNum },
    eventType: String(eventType).toUpperCase(),
    timestamp: validTimestamp
  });

  const sosRecord = {
    sosId: `sos_${Date.now()}_${cleanUserId.slice(-4)}`,
    userId: cleanUserId,
    location: {
      latitude: latNum,
      longitude: lngNum
    },
    timestamp: validTimestamp,
    eventType: String(eventType).toUpperCase(),
    contactsNotifiedCount: contacts.length,
    contacts: contacts.map((c) => ({
      id: c._id,
      name: c.name,
      phone: c.phone,
      relationship: c.relationship
    })),
    notification: notificationResult
  };

  return sosRecord;
};
