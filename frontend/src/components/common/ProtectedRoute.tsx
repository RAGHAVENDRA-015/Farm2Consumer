import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import { Button } from './Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary flex items-center justify-center text-2xl animate-bounce">
          🌿
        </div>
        <p className="text-sm font-medium text-grayText">Connecting to FarmLink...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-gray-100 shadow-subtle text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-darkText mb-2">Access Denied</h2>
        <p className="text-sm text-grayText mb-6">
          You need special permissions ({allowedRoles.join(' or ')}) to access this section. You are
          currently logged in as <span className="font-semibold text-darkText">{user.role}</span>.
        </p>
        <Link to="/">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};
