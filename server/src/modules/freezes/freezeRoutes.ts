import { Router } from 'express';
import { getFreezes, useFreeze } from './freezeController';
import { authenticate } from '../../common/middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getFreezes);
router.post('/use', useFreeze);

export default router;
