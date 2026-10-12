import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, ShoppingCart, Sprout, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

type RoleType = 'CUSTOMER' | 'FARMER' | 'ADMIN';

export const LoginPage: React.FC = () => {
  const { loginWithEmail } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [selectedRole, setSelectedRole] = useState<RoleType>('CUSTOMER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Selecting a role only changes the active role state without populating input fields
  const handleSelectRole = (role: RoleType) => {
    setSelectedRole(role);
    setErrorMessage('');
  };

  // Prefetch target layout & dashboard modules in the background so post-login transition is instant
  const prefetchDashboard = (role: RoleType) => {
    try {
      if (role === 'CUSTOMER') {
        import('../customer/CustomerDashboardPage');
        import('../../layouts/CustomerLayout');
      } else if (role === 'FARMER') {
        import('../farmer/FarmerDashboardPage');
        import('../../layouts/FarmerLayout');
      } else if (role === 'ADMIN') {
        import('../admin/AdminDashboardPage');
        import('../../layouts/AdminLayout');
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    try {
      import('../public/HomePage');
    } catch {
      // ignore
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();

    if (!trimmedEmail || !trimmedPass) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (trimmedPass.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      const user = await loginWithEmail(trimmedEmail, trimmedPass, selectedRole);

      const targetPath = redirect !== '/' ? redirect : '/';
      navigate(targetPath);

      if (user.role === 'FARMER' && user.farmerProfile?.isApproved) {
        success(`Welcome to your verified Farmer Workspace, ${user.name}!`);
      } else {
        success(`Welcome back, ${user.name}!`);
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to sign in. Please verify your credentials.';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-primary-50/40 via-white to-white">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-card space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary flex items-center justify-center text-3xl mx-auto shadow-xs">
            🌿
          </div>
          <h1 className="text-2xl font-bold text-darkText tracking-tight">Welcome Back</h1>
          <p className="text-xs text-grayText">
            Sign in to access your FarmLink orders, produce, and account.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="login-password" className="block text-xs font-semibold text-darkText">
                Password
              </label>
              <Link
                to={`/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`}
                className="text-xs font-medium text-primary hover:underline hover:text-primary-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2 shadow-sm hover:shadow transition-all duration-200"
            size="lg"
            isLoading={isLoading}
            onMouseEnter={() => prefetchDashboard(selectedRole)}
            onFocus={() => prefetchDashboard(selectedRole)}
            leftIcon={!isLoading ? <LogIn className="w-4 h-4" /> : undefined}
          >
            {isLoading
              ? 'Signing In...'
              : `Sign In as ${selectedRole === 'FARMER' ? 'Farmer' : selectedRole === 'ADMIN' ? 'Admin' : 'Customer'}`}
          </Button>
        </form>

        {/* Role Select Buttons below the Sign In button */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <div className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Select Account Role
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              id="btn-role-customer"
              onClick={() => handleSelectRole('CUSTOMER')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border transition-all text-xs font-semibold ${
                selectedRole === 'CUSTOMER'
                  ? 'border-primary bg-primary-50 text-primary-800 ring-2 ring-primary/20 shadow-xs'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ShoppingCart
                className={`w-4 h-4 mb-1 ${
                  selectedRole === 'CUSTOMER' ? 'text-primary' : 'text-gray-400'
                }`}
              />
              <span>Customer</span>
            </button>

            <button
              type="button"
              id="btn-role-farmer"
              onClick={() => handleSelectRole('FARMER')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border transition-all text-xs font-semibold ${
                selectedRole === 'FARMER'
                  ? 'border-primary bg-primary-50 text-primary-800 ring-2 ring-primary/20 shadow-xs'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Sprout
                className={`w-4 h-4 mb-1 ${
                  selectedRole === 'FARMER' ? 'text-primary' : 'text-gray-400'
                }`}
              />
              <span>Farmer</span>
            </button>

            <button
              type="button"
              id="btn-role-admin"
              onClick={() => handleSelectRole('ADMIN')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border transition-all text-xs font-semibold ${
                selectedRole === 'ADMIN'
                  ? 'border-gray-800 bg-gray-900 text-white ring-2 ring-gray-900/20 shadow-xs'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ShieldCheck
                className={`w-4 h-4 mb-1 ${
                  selectedRole === 'ADMIN' ? 'text-primary-300' : 'text-gray-400'
                }`}
              />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Register footer link */}
        <div className="text-center pt-2 border-t border-gray-100 text-xs text-grayText">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-primary hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};
