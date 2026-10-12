import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, MapPin, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const CustomerLayout: React.FC = () => {
  const { user } = useAuth();

  const tabs = [
    { name: 'Dashboard', path: '/customer', icon: <LayoutDashboard className="w-4 h-4" />, end: true },
    { name: 'My Orders', path: '/customer/orders', icon: <Package className="w-4 h-4" />, end: false },
    { name: 'Saved Addresses', path: '/customer/addresses', icon: <MapPin className="w-4 h-4" />, end: false },
    { name: 'My Profile', path: '/customer/profile', icon: <UserIcon className="w-4 h-4" />, end: false },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-darkText tracking-tight">
          Welcome back, {user?.name || 'Friend'} 👋
        </h1>
        <p className="text-sm text-grayText mt-1">
          Manage your fresh farm produce orders, delivery addresses, and account details.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.path}
            end={tab.end}
            className={({ isActive }) =>
              `inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-grayText hover:text-darkText hover:bg-gray-50'
              }`
            }
          >
            {tab.icon}
            {tab.name}
          </NavLink>
        ))}
      </div>

      {/* Content */}
      <Outlet />
    </div>
  );
};
