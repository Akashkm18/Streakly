import { Router } from 'express';
import { getHabits, getHabitById, createHabit, updateHabit, archiveHabit } from './habitController';
import { authenticate } from '../../common/middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getHabits);
router.post('/', createHabit);
router.get('/:id', getHabitById);
router.patch('/:id', updateHabit);
router.delete('/:id', archiveHabit);

export default router;
