import { Router } from 'express';
import { getBadges, getRecentBadges } from './badgeController';
import { authenticate } from '../../common/middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getBadges);
router.get('/recent', getRecentBadges);

export default router;
