import { Router } from 'express';
import { getRestDays, createRestDay, deleteRestDay } from './restDayController';
import { authenticate } from '../../common/middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getRestDays);
router.post('/', createRestDay);
router.delete('/:id', deleteRestDay);

export default router;
