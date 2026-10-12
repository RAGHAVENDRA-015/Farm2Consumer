import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  ClipboardList,
  Wallet,
  Settings,
  AlertTriangle,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Store,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const FarmerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isApproved = user?.farmerProfile?.isApproved ?? false;
  const farmName = user?.farmerProfile?.farmName || 'My Farm';

  const menuItems = [
    { name: 'Dashboard', path: '/farmer', icon: <LayoutDashboard className="w-5 h-5" />, end: true },
    { name: 'Products & Produce', path: '/farmer/products', icon: <Sprout className="w-5 h-5" />, end: false },
    { name: 'Fulfillment Orders', path: '/farmer/orders', icon: <ClipboardList className="w-5 h-5" />, end: false },
    { name: 'Earnings & Payouts', path: '/farmer/earnings', icon: <Wallet className="w-5 h-5" />, end: false },
    { name: 'Farm Profile', path: '/farmer/profile', icon: <Settings className="w-5 h-5" />, end: false },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Sidebar Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌿</span>
          <span className="font-bold text-darkText">Farmer Portal</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-darkText hover:bg-gray-100 rounded-xl"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 p-5 flex flex-col transition-transform duration-200 md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between mb-8 px-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <div>
              <span className="font-bold text-darkText block leading-tight">FarmLink</span>
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                Farmer Studio
              </span>
            </div>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-darkText"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Farm Profile Box */}
        <div className="bg-primary-50/60 rounded-2xl p-3.5 mb-6 border border-primary-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm">
              {farmName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-darkText text-xs truncate">{farmName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isApproved ? 'bg-primary' : 'bg-amber-400'
                  }`}
                />
                <span className="text-[11px] font-medium text-grayText">
                  {isApproved ? 'Verified Seller' : 'Pending Approval'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1.5 flex-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-grayText hover:text-darkText hover:bg-gray-100'
                }`
              }
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.name}</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-gray-100 space-y-1.5">
          <Link
            to="/"
            className="flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-grayText hover:text-darkText rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Store className="w-4 h-4" />
            <span>Public Marketplace</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Pending Approval Banner */}
        {!isApproved && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3.5 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs sm:text-sm text-amber-800 font-medium">
              <span className="font-bold">Verification Pending:</span> Your farm profile is currently
              under review by FarmLink administrators. Once verified, your products will be
              publicly visible in the marketplace.
            </p>
          </div>
        )}

        {/* Outlet Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
