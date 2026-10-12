import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Users, HeartHandshake, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100/60 text-xs font-bold text-primary-800">
          🌱 Our Agricultural Mission
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-darkText tracking-tight">
          Bringing the Farm to Your Table, Directly.
        </h1>
        <p className="text-base sm:text-lg text-grayText max-w-2xl mx-auto leading-relaxed">
          FarmLink is a modern farm-to-consumer digital marketplace created by Tech Harvest to
          dismantle unnecessary supply chain layers and empower regional growers.
        </p>
      </div>

      <div className="rounded-3xl overflow-hidden shadow-card border border-gray-100 aspect-16/9 bg-primary-50">
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1200"
          alt="Lush green agriculture field"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="space-y-6 text-sm text-grayText leading-relaxed">
        <h2 className="text-2xl font-bold text-darkText">Why We Built FarmLink</h2>
        <p>
          For generations, agricultural producers have faced severe price exploitation from
          aggregators, middlemen, and complex distribution channels. By the time fresh produce
          reaches consumer households, its nutritional quality has degraded, and prices have
          multiplied—with the farmers receiving only a small fraction of the final value.
        </p>
        <p>
          FarmLink changes this equation entirely. Our platform enables farmers to directly list
          their crops, set honest prices, and dispatch produce within hours of harvesting.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
        <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-subtle space-y-2">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-darkText text-base">Fair Compensation</h3>
          <p className="text-xs text-grayText leading-relaxed">
            Every rupee spent directly benefits local farming families, supporting sustainable
            agricultural livelihoods.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-subtle space-y-2">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
            <Sprout className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-darkText text-base">Peak Nutritional Freshness</h3>
          <p className="text-xs text-grayText leading-relaxed">
            Eliminating intermediate warehouses guarantees that vegetables and fruits reach you at
            peak freshness.
          </p>
        </div>
      </div>

      <div className="p-8 sm:p-10 rounded-3xl bg-primary-50/70 border border-primary-100 text-center space-y-4">
        <h3 className="text-2xl font-bold text-darkText">Ready to taste true farm freshness?</h3>
        <p className="text-sm text-grayText max-w-md mx-auto">
          Explore seasonal harvests or join as a verified farmer today.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link to="/products">
            <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Explore Produce
            </Button>
          </Link>
          <Link to="/register?type=farmer">
            <Button variant="secondary">Join as a Farmer</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
