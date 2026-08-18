import { Router } from 'express';
import { getRulesByState } from '../controllers/trafficRule.controller.js';

const router = Router();

/**
 * GET /api/rules/:state
 * Retrieve traffic rules for a specific state with optional query parameters:
 * - category (string)
 * - vehicleType (string)
 * - page (number, default: 1)
 * - limit (number, default: 20, max: 50)
 */
router.get('/:state', getRulesByState);

export default router;
