import { Router } from 'express';
import { getReminders, upsertReminder, deleteReminder } from './reminderController';
import { authenticate } from '../../common/middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getReminders);
router.post('/', upsertReminder);
router.delete('/:id', deleteReminder);

export default router;
