import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { User } from '../../types';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  initialOtpHint?: string;
  onSuccess: (user: User) => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  initialOtpHint,
  onSuccess,
}) => {
  const { verifyEmailOtp, resendEmailOtp } = useAuth();
  const { success, error } = useToast();

  const [otp, setOtp] = useState('');
  const [currentOtpHint, setCurrentOtpHint] = useState<string | undefined>(initialOtpHint);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Keep OTP hint in sync if prop changes
  React.useEffect(() => {
    if (initialOtpHint) {
      setCurrentOtpHint(initialOtpHint);
    }
  }, [initialOtpHint]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setIsLoading(true);
      const user = await verifyEmailOtp(email, cleanOtp);
      success('Email verified successfully! Welcome to FarmLink.');
      onSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setErrorMessage('');
    try {
      setIsResending(true);
      const res = await resendEmailOtp(email);
      if (res.otpHint) {
        setCurrentOtpHint(res.otpHint);
      }
      success('A fresh 6-digit verification code has been sent to your email.');
    } catch (err: any) {
      error(err.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Email Verification" maxWidth="md">
      <div className="space-y-5">
        {/* Header Icon & Message */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary flex items-center justify-center text-2xl mx-auto shadow-2xs">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-darkText">Verify Your Email Address</h3>
          <p className="text-xs text-grayText leading-relaxed">
            A 6-digit verification code has been sent to{' '}
            <span className="font-bold text-darkText">{email}</span>. Please check your inbox (and spam or junk folder) and enter the code below.
          </p>
        </div>

        {/* Error alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-darkText mb-1.5 text-center">
              Enter 6-Digit Code
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
              className="w-full text-center text-2xl font-mono tracking-[0.6em] py-3 px-4 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-gray-50/50"
              autoFocus
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            size="lg"
            isLoading={isLoading}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            Verify Email & Proceed
          </Button>
        </form>

        {/* Resend Code Section */}
        <div className="text-center pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-grayText">
          <span>Didn't receive the code?</span>
          <button
            type="button"
            disabled={isResending}
            onClick={handleResend}
            className="font-bold text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
            {isResending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
