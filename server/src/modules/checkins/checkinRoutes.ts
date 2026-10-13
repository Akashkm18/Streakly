import { Router } from 'express';
import { checkIn, undoCheckIn } from './checkinController';
import { authenticate } from '../../common/middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/:id/checkin', checkIn);
router.delete('/:id/checkin/:date', undoCheckIn);

export default router;
