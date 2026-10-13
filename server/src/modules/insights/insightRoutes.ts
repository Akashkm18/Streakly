import { Router } from 'express';
import {
  getInsightsSummary,
  getHeatmap,
  getBreakdown,
  getTrends,
} from './insightController';
import { authenticate } from '../../common/middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/summary', getInsightsSummary);
router.get('/heatmap', getHeatmap);
router.get('/breakdown', getBreakdown);
router.get('/trends', getTrends);

export default router;
