import { asyncHandler } from '../utils/asyncHandler.js';
import * as emergencyService from '../services/emergency.service.js';

/**
 * POST /api/emergency/contacts
 * Create a new emergency contact
 */
export const createContact = asyncHandler(async (req, res) => {
  const newContact = await emergencyService.createContact(req.body);

  return res.status(201).json({
    success: true,
    message: 'Emergency contact created successfully',
    data: newContact
  });
});

/**
 * GET /api/emergency/contacts/:userId
 * Retrieve all emergency contacts for a user
 */
export const getContactsByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const contacts = await emergencyService.getContactsByUserId(userId);

  return res.status(200).json({
    success: true,
    count: contacts.length,
    data: contacts
  });
});

/**
 * PUT /api/emergency/contacts/:contactId
 * Update an existing emergency contact
 */
export const updateContact = asyncHandler(async (req, res) => {
  const { contactId } = req.params;
  const updatedContact = await emergencyService.updateContact(contactId, req.body);

  return res.status(200).json({
    success: true,
    message: 'Emergency contact updated successfully',
    data: updatedContact
  });
});

/**
 * DELETE /api/emergency/contacts/:contactId
 * Delete an emergency contact
 */
export const deleteContact = asyncHandler(async (req, res) => {
  const { contactId } = req.params;
  const result = await emergencyService.deleteContact(contactId);

  return res.status(200).json({
    success: true,
    message: result.message
  });
});

/**
 * POST /api/emergency/sos
 * Trigger an emergency SOS request
 */
export const processSOS = asyncHandler(async (req, res) => {
  const sosRecord = await emergencyService.processSOS(req.body);

  return res.status(200).json({
    success: true,
    message: 'SOS alert processed successfully',
    data: sosRecord
  });
});
