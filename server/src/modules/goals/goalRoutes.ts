import { Router } from 'express';
import { getGoals, createGoal, updateGoal, deleteGoal } from './goalController';
import { authenticate } from '../../common/middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getGoals);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;
