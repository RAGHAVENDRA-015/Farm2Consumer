import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Sprout,
  Tags,
  ShoppingBag,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Store,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Overview', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" />, end: true },
    { name: 'Farmer Approvals', path: '/admin/farmers', icon: <Sprout className="w-5 h-5" />, end: false },
    { name: 'Customers & Users', path: '/admin/customers', icon: <Users className="w-5 h-5" />, end: false },
    { name: 'Product Catalog', path: '/admin/products', icon: <ShoppingBag className="w-5 h-5" />, end: false },
    { name: 'Categories', path: '/admin/categories', icon: <Tags className="w-5 h-5" />, end: false },
    { name: 'Global Orders', path: '/admin/orders', icon: <ShieldCheck className="w-5 h-5" />, end: false },
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
          <span className="text-xl">🛡️</span>
          <span className="font-bold text-darkText">Admin Console</span>
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
            <span className="text-2xl">🌿</span>
            <div>
              <span className="font-bold text-darkText block leading-tight">FarmLink</span>
              <span className="text-[11px] font-bold text-primary-700 uppercase tracking-wider">
                Admin Console
              </span>
            </div>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-darkText"
          >
            <X className="w-4 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="bg-gray-100 rounded-2xl p-3.5 mb-6">
          <p className="text-xs text-grayText">Super Administrator</p>
          <p className="font-bold text-darkText text-sm truncate">{user?.name}</p>
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
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
