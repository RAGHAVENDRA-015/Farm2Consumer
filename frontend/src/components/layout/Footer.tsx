import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-gray-100">
          {/* Brand & Mission */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🌿</span>
              <span className="text-xl font-bold tracking-tight text-primary-700">
                Farm<span className="text-primary">Link</span>
              </span>
            </Link>
            <p className="text-sm text-grayText leading-relaxed">
              Empowering local farmers and bringing 100% fresh, natural produce directly to your
              doorstep without middlemen.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-xs font-semibold text-primary-700">
              🌱 Direct from Farm to Table
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-darkText text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-grayText">
              <li>
                <Link to="/products" className="hover:text-primary transition-colors">
                  All Produce
                </Link>
              </li>
              <li>
                <Link to="/products?isOrganic=true" className="hover:text-primary transition-colors">
                  Certified Organic
                </Link>
              </li>
              <li>
                <Link to="/farmers" className="hover:text-primary transition-colors">
                  Meet Our Farmers
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  About FarmLink
                </Link>
              </li>
            </ul>
          </div>

          {/* Sourcing & Categories */}
          <div>
            <h4 className="font-bold text-darkText text-sm mb-4">Produce Categories</h4>
            <ul className="space-y-2.5 text-sm text-grayText">
              <li>
                <Link to="/products?category=vegetables" className="hover:text-primary transition-colors">
                  Fresh Vegetables
                </Link>
              </li>
              <li>
                <Link to="/products?category=fruits" className="hover:text-primary transition-colors">
                  Orchard Fruits
                </Link>
              </li>
              <li>
                <Link to="/products?category=grains" className="hover:text-primary transition-colors">
                  Farm Grains & Rice
                </Link>
              </li>
              <li>
                <Link to="/products?category=pulses" className="hover:text-primary transition-colors">
                  Natural Pulses & Dal
                </Link>
              </li>
            </ul>
          </div>

          {/* Farmers & Platform */}
          <div>
            <h4 className="font-bold text-darkText text-sm mb-4">For Farmers</h4>
            <p className="text-xs text-grayText leading-relaxed mb-4">
              Are you an agricultural producer? Sell directly to consumers at transparent, fair
              prices.
            </p>
            <Link
              to="/register?type=farmer"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 font-semibold text-xs border border-primary-200 transition-colors"
            >
              🌱 Join as a Verified Farmer
            </Link>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-grayText">
          <p>© {new Date().getFullYear()} FarmLink by Tech Harvest. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Cultivated with care and</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>for sustainable local agriculture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
