import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Sprout, ShoppingCart, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { EmailVerificationModal } from '../../components/auth/EmailVerificationModal';

export const RegisterPage: React.FC = () => {
  const { registerUser } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialRole = searchParams.get('type') === 'farmer' ? 'FARMER' : 'CUSTOMER';
  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'FARMER'>(initialRole);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Email OTP verification state
  const [verificationState, setVerificationState] = useState<{
    isOpen: boolean;
    email: string;
    otpHint?: string;
    isFarmer: boolean;
  }>({
    isOpen: false,
    email: '',
    otpHint: undefined,
    isFarmer: false,
  });

  // Farmer specific fields
  const [farmName, setFarmName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [bio, setBio] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name || !email || !password) {
      setErrorMessage('Please fill in your name, email, and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (selectedRole === 'FARMER') {
      if (!farmName || !city || !state || !address || !pincode) {
        setErrorMessage('Please complete all farm address details.');
        return;
      }
    }

    try {
      setIsLoading(true);
      const isFarmer = selectedRole === 'FARMER';
      const result = await registerUser(name, email, password, isFarmer, isFarmer ? {
        farmName,
        city,
        state,
        address,
        pincode,
        bio: bio.trim() || undefined,
      } : undefined);

      if (result.requiresVerification) {
        setVerificationState({
          isOpen: true,
          email: result.email,
          otpHint: result.otpHint,
          isFarmer,
        });
        success('Verification code sent. Please enter the code to verify your email and activate your account.');
      } else {
        success('Account created successfully!');
        if (isFarmer) {
          navigate('/farmer');
        } else {
          navigate('/customer');
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-primary-50/40 via-white to-white">
      <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-card space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary flex items-center justify-center text-3xl mx-auto shadow-xs">
            🌿
          </div>
          <h1 className="text-2xl font-bold text-darkText tracking-tight">
            Create Your FarmLink Account
          </h1>
          <p className="text-xs text-grayText">
            Join the direct farm-to-consumer revolution today.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Role Selector Tabs (PRD Section 15) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-darkText uppercase tracking-wider text-center">
            How would you like to use FarmLink?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole('CUSTOMER')}
              className={`flex flex-col items-center p-4 rounded-2xl border text-center transition-all ${
                selectedRole === 'CUSTOMER'
                  ? 'border-primary bg-primary-50/60 shadow-xs ring-2 ring-primary/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ShoppingCart
                className={`w-6 h-6 mb-2 ${
                  selectedRole === 'CUSTOMER' ? 'text-primary' : 'text-gray-400'
                }`}
              />
              <span className="text-sm font-bold text-darkText">🛒 Customer</span>
              <span className="text-[11px] text-grayText mt-0.5">Buy fresh produce</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('FARMER')}
              className={`flex flex-col items-center p-4 rounded-2xl border text-center transition-all ${
                selectedRole === 'FARMER'
                  ? 'border-primary bg-primary-50/60 shadow-xs ring-2 ring-primary/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Sprout
                className={`w-6 h-6 mb-2 ${
                  selectedRole === 'FARMER' ? 'text-primary' : 'text-gray-400'
                }`}
              />
              <span className="text-sm font-bold text-darkText">🌱 Farmer</span>
              <span className="text-[11px] text-grayText mt-0.5">Sell produce directly</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="Sai Raghavendra"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          {/* Additional Farmer Fields */}
          {selectedRole === 'FARMER' && (
            <div className="p-4 rounded-2xl bg-primary-50/50 border border-primary-100 space-y-3 pt-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary-800">
                <Sprout className="w-4 h-4" />
                <span>Farm & Agriculture Details</span>
              </div>

              <Input
                label="Farm Name"
                placeholder="e.g. Green Valley Organic Farms"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="City / Village"
                  placeholder="e.g. Guntur"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
                <Input
                  label="State"
                  placeholder="e.g. Andhra Pradesh"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Input
                    label="Farm Address"
                    placeholder="Street or survey number"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Pincode"
                  placeholder="522001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-darkText mb-1">
                  Farm Story / Bio (Optional)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell consumers what you cultivate and your sustainable farming practices..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-primary"
                />
              </div>

              <p className="text-[11px] text-grayText italic">
                * Note: Farmer accounts undergo verification by our team before products go public.
              </p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create {selectedRole === 'FARMER' ? 'Farmer' : 'Customer'} Account
          </Button>
        </form>



        {/* Login footer */}
        <div className="text-center pt-2 border-t border-gray-100 text-xs text-grayText">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Sign In Instead
          </Link>
        </div>

        {/* Email Verification Modal */}
        <EmailVerificationModal
          isOpen={verificationState.isOpen}
          onClose={() => setVerificationState((prev) => ({ ...prev, isOpen: false }))}
          email={verificationState.email}
          initialOtpHint={verificationState.otpHint}
          onSuccess={() => {
            setVerificationState((prev) => ({ ...prev, isOpen: false }));
            if (verificationState.isFarmer) {
              navigate('/farmer');
            } else {
              navigate('/customer');
            }
          }}
        />
      </div>
    </div>
  );
};
