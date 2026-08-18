import { Router } from 'express';
import {
  createContact,
  getContactsByUserId,
  updateContact,
  deleteContact,
  processSOS
} from '../controllers/emergency.controller.js';

const router = Router();

// Emergency Contact CRUD routes
router.post('/contacts', createContact);
router.get('/contacts/:userId', getContactsByUserId);
router.put('/contacts/:contactId', updateContact);
router.delete('/contacts/:contactId', deleteContact);

// SOS Emergency Alert route
router.post('/sos', processSOS);

export default router;
