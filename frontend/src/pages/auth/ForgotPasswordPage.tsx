import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail,
  Lock,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword, resetPassword } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initial state from query params
  const initialEmail = searchParams.get('email') || '';

  // Step state: 1 = Enter Email, 2 = Enter OTP & New Password, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form fields
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    try {
      setIsLoading(true);
      await forgotPassword(trimmedEmail);
      setStep(2);
      setResendCooldown(30);
      success('Reset code sent! Please check your Gmail inbox.');
    } catch (err: any) {
      const msg = err.message || 'Failed to request password reset code. Please try again.';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMessage('');

    try {
      setIsResending(true);
      await forgotPassword(email.trim().toLowerCase());
      setResendCooldown(30);
      success('A fresh reset code has been sent to your Gmail inbox.');
    } catch (err: any) {
      const msg = err.message || 'Failed to resend reset code. Please try again.';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: Submit OTP and new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify and re-enter.');
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword(email.trim().toLowerCase(), cleanOtp, newPassword);
      setStep(3);
      success('Your password has been successfully reset!');
    } catch (err: any) {
      const msg = err.message || 'Failed to reset password. Please check your code and try again.';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-primary-50/40 via-white to-white">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-card space-y-6 transition-all">
        
        {/* Step 1: Request Reset Code */}
        {step === 1 && (
          <>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary flex items-center justify-center text-2xl mx-auto shadow-xs">
                <KeyRound className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-darkText tracking-tight">Forgot Password?</h1>
              <p className="text-xs text-grayText leading-relaxed">
                No worries! Enter the email address associated with your FarmLink account, and we’ll issue a 6-digit reset code.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <Input
                label="Registered Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage('');
                }}
                leftIcon={<Mail className="w-4 h-4" />}
                autoFocus
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                size="lg"
                isLoading={isLoading}
              >
                Send Reset Code
              </Button>
            </form>

            <div className="text-center pt-2 border-t border-gray-100 text-xs">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 font-bold text-gray-600 hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </>
        )}

        {/* Step 2: Verify Code & Set New Password */}
        {step === 2 && (
          <>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary flex items-center justify-center text-2xl mx-auto shadow-xs">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-darkText tracking-tight">Create New Password</h1>
              <p className="text-xs text-grayText leading-relaxed">
                We've sent a 6-digit reset code to{' '}
                <span className="font-semibold text-darkText">{email}</span>. Check your Gmail inbox and enter the code below.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setErrorMessage('');
                }}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Not your email? Change email
              </button>
            </div>

            {/* Email sent notice */}
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-2.5 text-xs text-blue-800">
              <Mail className="w-4 h-4 text-blue-500 shrink-0" />
              <span>
                A 6-digit code was sent to <strong>{email}</strong>. Check your Gmail inbox (and spam folder).
              </span>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* 6-Digit Code Input */}
              <div>
                <label className="block text-xs font-semibold text-darkText mb-1.5 text-center">
                  Enter 6-Digit Reset Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(val);
                    setErrorMessage('');
                  }}
                  placeholder="••••••"
                  className="w-full text-center text-2xl font-mono tracking-[0.6em] py-2.5 px-4 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-gray-50/50"
                  autoFocus
                  required
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-darkText mb-1">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-grayText pointer-events-none flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white pl-10 pr-10 py-2.5 transition-all outline-none placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 text-grayText hover:text-darkText"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-darkText mb-1">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-grayText pointer-events-none flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white pl-10 pr-10 py-2.5 transition-all outline-none placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 text-grayText hover:text-darkText"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                size="lg"
                isLoading={isLoading}
              >
                Reset Password
              </Button>
            </form>

            {/* Resend Code Section */}
            <div className="text-center pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-grayText">
              <span>Didn't receive the code?</span>
              <button
                type="button"
                disabled={isResending || resendCooldown > 0}
                onClick={handleResendOtp}
                className="font-bold text-primary hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : isResending
                  ? 'Sending...'
                  : 'Resend Code'}
              </button>
            </div>
          </>
        )}

        {/* Step 3: Success Confirmation */}
        {step === 3 && (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-3xl bg-green-50 text-green-600 flex items-center justify-center mx-auto shadow-sm animate-bounce-short">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-darkText tracking-tight">Password Reset Complete!</h2>
              <p className="text-xs text-grayText leading-relaxed max-w-xs mx-auto">
                Your password has been updated successfully. You can now log into your FarmLink account using your new credentials.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              className="w-full"
              size="lg"
              onClick={() => navigate('/login')}
            >
              Sign In Now
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};
