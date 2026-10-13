import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  demoLogin,
  forgotPassword,
  verifyOtp,
  resetPassword,
  deleteAccount,
} from './authController';
import { authenticate } from '../../common/middleware/auth';
import { authLimiter } from '../../common/middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/demo', demoLogin);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

// Password recovery with OTP
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/reset-password', authLimiter, resetPassword);

// Account deletion with password confirmation
router.delete('/account', authenticate, deleteAccount);

export default router;
