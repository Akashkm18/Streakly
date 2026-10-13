import { Router } from 'express';
import { exportCsv, exportJson, getMonthlyReport } from './exportController';
import { authenticate } from '../../common/middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/csv', exportCsv);
router.get('/json', exportJson);
router.get('/monthly-report', getMonthlyReport);

export default router;
