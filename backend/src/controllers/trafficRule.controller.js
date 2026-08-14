import { asyncHandler } from '../utils/asyncHandler.js';
import * as trafficRuleService from '../services/trafficRule.service.js';

/**
 * GET /api/rules/:state
 * Controller to retrieve traffic rules for a specific state with optional filters and pagination
 */
export const getRulesByState = asyncHandler(async (req, res) => {
  const { state } = req.params;
  const { rules, pagination } = await trafficRuleService.getRulesByState(
    state,
    req.query
  );

  return res.status(200).json({
    success: true,
    message: 'Traffic rules fetched successfully',
    data: rules,
    pagination
  });
});
