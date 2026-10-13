import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Lock, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { PasswordStrengthMeter, evaluatePasswordRules } from '@/shared/ui/PasswordStrengthMeter';
import { useToast } from '@/shared/ui/Toast';
import { apiClient } from '@/shared/api/client';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // 60-second resend countdown timer
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiClient('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });

      addToast({
        type: 'success',
        title: 'Verification Code Sent',
        message: 'A 6-digit verification code has been sent to your email.',
      });
      setStep(2);
      setResendCooldown(60);
      setCanResend(false);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Handle OTP box inputs and paste
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setError('Please enter all 6 digits of the verification code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient<{ resetToken: string }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), otp }),
      });

      setResetToken(data.resetToken);
      addToast({
        type: 'success',
        title: 'Code Verified',
        message: 'Enter your new password below.',
      });
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      await apiClient('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });

      addToast({
        type: 'info',
        title: 'Code Resent',
        message: 'A new 6-digit code has been sent.',
      });
      setResendCooldown(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const strength = evaluatePasswordRules(newPassword);
    if (strength.score < 5) {
      setError('Please ensure your password meets all complexity requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiClient('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ resetToken, newPassword }),
      });

      setIsSuccess(true);
      addToast({
        type: 'success',
        title: 'Password Changed',
        message: 'Your password has been reset successfully!',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <span className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              ⚡ Streakly
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            {isSuccess
              ? 'Password Updated'
              : step === 1
              ? 'Reset your password'
              : step === 2
              ? 'Enter verification code'
              : 'Create new password'}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {isSuccess
              ? 'Your password has been changed. You can now sign in.'
              : step === 1
              ? 'Enter your account email to receive a 6-digit code.'
              : step === 2
              ? `We sent a 6-digit code to ${email}`
              : 'Choose a strong password to protect your account.'}
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Step Indicator */}
          {!isSuccess && (
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= 1 ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  1
                </span>
                <span className={`text-xs font-medium ${step === 1 ? 'text-zinc-200' : 'text-zinc-500'}`}>
                  Email
                </span>
              </div>
              <div className="h-0.5 w-8 bg-zinc-800" />
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= 2 ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  2
                </span>
                <span className={`text-xs font-medium ${step === 2 ? 'text-zinc-200' : 'text-zinc-500'}`}>
                  Verify OTP
                </span>
              </div>
              <div className="h-0.5 w-8 bg-zinc-800" />
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= 3 ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  3
                </span>
                <span className={`text-xs font-medium ${step === 3 ? 'text-zinc-200' : 'text-zinc-500'}`}>
                  New Password
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-sm text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Success Screen */}
          {isSuccess ? (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">All Set!</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Your password has been reset successfully. All other active sessions have been signed out.
                </p>
              </div>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium text-white transition-all shadow-lg shadow-indigo-600/25"
              >
                Sign in with new password
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : step === 1 ? (
            /* STEP 1: Request Email */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Account Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700/80 rounded-xl text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  <>
                    Send verification code
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to login
                </Link>
              </div>
            </form>
          ) : step === 2 ? (
            /* STEP 2: 6-Box OTP Form */
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-3 text-center">
                  Enter the 6-digit code sent to your email
                </label>

                {/* 6 Digit Input Boxes */}
                <div className="flex items-center justify-between gap-2 sm:gap-2.5">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-14 text-center text-xl font-bold font-mono bg-zinc-800/90 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otpDigits.join('').length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying code...
                  </>
                ) : (
                  <>
                    Verify code
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend Cooldown */}
              <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="hover:text-zinc-200 transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Change email
                </button>

                <div>
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      Resend code
                    </button>
                  ) : (
                    <span>Resend in {resendCooldown}s</span>
                  )}
                </div>
              </div>
            </form>
          ) : (
            /* STEP 3: New Password Form */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700/80 rounded-xl text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <PasswordStrengthMeter password={newPassword} />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700/80 rounded-xl text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-rose-400 mt-1">Passwords do not match.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !newPassword || newPassword !== confirmPassword}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  <>
                    Set new password
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
