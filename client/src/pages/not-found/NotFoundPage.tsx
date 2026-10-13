import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/Button';
import { Sprout } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0B1914] text-white text-center space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
        <Sprout className="w-8 h-8 animate-bounce" />
      </div>
      <h1 className="text-6xl font-black font-heading text-white">404</h1>
      <h2 className="text-xl font-bold font-heading text-emerald-200">Uncharted Soil</h2>
      <p className="text-xs text-emerald-400/70 max-w-sm">
        This grove does not exist yet. Return to the main sanctuary to tend your flora.
      </p>
      <Link to="/dashboard">
        <Button variant="primary">Return to Sanctuary</Button>
      </Link>
    </div>
  );
};
