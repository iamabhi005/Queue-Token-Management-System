import React from 'react';
import { Ticket, ShieldCheck, Zap, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
              <Ticket className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              Smart<span className="text-purple-600">Queue</span>
            </span>
            <span className="text-xs text-slate-400 pl-2 border-l border-slate-200 hidden sm:inline">
              Queue Token Management
            </span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-xs text-slate-500">
            <Link to="/customer" className="hover:text-purple-600 transition-colors">Customer Kiosk</Link>
            <Link to="/display" className="hover:text-purple-600 transition-colors">Display Screen</Link>
            <Link to="/admin" className="hover:text-purple-600 transition-colors">Admin Dashboard</Link>
            <Link to="/history" className="hover:text-purple-600 transition-colors">Token History</Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>React 19 + Tailwind</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Live Sync
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
}
