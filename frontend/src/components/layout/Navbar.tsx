import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  User as UserIcon,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Package,
  MapPin,
  LayoutDashboard,
  ShieldCheck,
  Tractor,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Button } from '../common/Button';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isFarmer, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'Farmers', path: '/farmers' },
    { name: 'About', path: '/about' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🌿</span>
            <span className="text-xl font-bold tracking-tight text-primary-700">
              Farm<span className="text-primary">Link</span>
            </span>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? 'text-primary font-semibold' : 'text-darkText'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Search Bar (Desktop) */}
          <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-xs relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vegetables, fruits, farms..."
              className="w-full bg-gray-50 text-sm pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400"
            />
            <Search className="w-4 h-4 text-grayText absolute left-3 pointer-events-none" />
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative p-2 text-darkText hover:text-primary hover:bg-primary-50 rounded-xl transition-colors"
              title="View Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-primary rounded-full animate-in zoom-in">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Authentication / Profile Dropdown */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl text-darkText hover:bg-gray-50 border border-gray-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold max-w-[90px] truncate">
                    {user?.name || 'Account'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-grayText" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-in zoom-in-95 duration-150 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-grayText">Signed in as</p>
                      <p className="text-sm font-bold text-darkText truncate">{user?.name}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-primary-50 text-primary-700">
                        {user?.role}
                      </span>
                    </div>

                    {/* Role Specific Portals */}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-darkText hover:bg-primary-50 hover:text-primary transition-colors font-medium"
                      >
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        Admin Dashboard
                      </Link>
                    )}

                    {isFarmer && (
                      <Link
                        to="/farmer"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-darkText hover:bg-primary-50 hover:text-primary transition-colors font-medium"
                      >
                        <Tractor className="w-4 h-4 text-primary" />
                        Farmer Portal
                      </Link>
                    )}

                    {/* Standard User Links */}
                    <Link
                      to="/customer"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-darkText hover:bg-primary-50 hover:text-primary transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-grayText" />
                      Dashboard
                    </Link>
                    <Link
                      to="/customer/orders"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-darkText hover:bg-primary-50 hover:text-primary transition-colors"
                    >
                      <Package className="w-4 h-4 text-grayText" />
                      My Orders
                    </Link>
                    <Link
                      to="/customer/addresses"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-darkText hover:bg-primary-50 hover:text-primary transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-grayText" />
                      Saved Addresses
                    </Link>

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={logout}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" className="hidden sm:inline-flex">
                  <Button variant="primary" size="sm">
                    Join FarmLink
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-darkText hover:text-primary md:hidden rounded-xl"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 space-y-3 animate-in slide-in-from-top-2">
            <form onSubmit={handleSearch} className="relative px-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search produce..."
                className="w-full bg-gray-50 text-sm pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
              />
              <Search className="w-4 h-4 text-grayText absolute left-5 top-3 pointer-events-none" />
            </form>

            <div className="flex flex-col space-y-1 px-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="px-3 py-2 rounded-xl text-sm font-medium text-darkText hover:bg-primary-50 hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-primary bg-primary-50"
                >
                  Register as Customer or Farmer
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
