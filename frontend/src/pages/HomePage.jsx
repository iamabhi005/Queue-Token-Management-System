import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Ticket, 
  Search, 
  ShieldCheck, 
  Tv, 
  Clock, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  Landmark, 
  Hospital, 
  GraduationCap,
  Sparkles,
  Zap,
  TrendingUp,
  Volume2
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function HomePage() {
  const { totalToday, waitingCount, servingCount, avgWaitMinutes, counters } = useQueue();

  const domains = [
    { name: 'Hospitals & Clinics', icon: Hospital, desc: 'Triage, doctor OPD, pharmacy, and radiology token flow.' },
    { name: 'Banks & Financial', icon: Landmark, desc: 'Tellers, deposits, wealth advisors, and loan desks.' },
    { name: 'Colleges & Universities', icon: GraduationCap, desc: 'Admissions, semester fee payment, and registrar offices.' },
    { name: 'Government Offices', icon: Building2, desc: 'Permits, civil registration, passport, and tax counters.' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-100">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-purple-50/70 via-indigo-50/30 to-transparent pointer-events-none -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 mb-6 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Next-Gen Real-Time Queue Management</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Eliminate Waiting Lines with <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-slate-900 bg-clip-text text-transparent">SmartQueue</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              A modern, intelligent token management platform for hospitals, banks, universities, and government offices. Streamline customer flow, empower counter staff, and broadcast real-time updates.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/customer"
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-base font-bold bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all hover:-translate-y-0.5"
              >
                <Ticket className="w-5 h-5 text-purple-200" />
                <span>Generate Token</span>
              </Link>

              <Link
                to="/customer?tab=check"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 transition-all"
              >
                <Search className="w-5 h-5 text-slate-500" />
                <span>Check Token Status</span>
              </Link>

              <Link
                to="/login"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all"
              >
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <span>Admin Login</span>
              </Link>
            </div>

            {/* Public display callout */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
              <span>Looking for the TV screen view?</span>
              <Link to="/display" className="font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 underline underline-offset-4">
                <Tv className="w-3.5 h-3.5" />
                Open Public Display Screen
              </Link>
            </div>

          </div>

          {/* Real-time Live Metrics Strip */}
          <div className="mt-16 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
            <div className="text-center p-3 border-r border-slate-100 last:border-r-0">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-semibold mb-1">
                <Ticket className="w-3.5 h-3.5 text-purple-500" />
                <span>Tokens Today</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono-num">{totalToday}</p>
            </div>

            <div className="text-center p-3 border-r border-slate-100 last:border-r-0">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-semibold mb-1">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                <span>In Queue</span>
              </div>
              <p className="text-2xl font-extrabold text-amber-600 font-mono-num">{waitingCount}</p>
            </div>

            <div className="text-center p-3 border-r border-slate-100 last:border-r-0">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-semibold mb-1">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>Serving Now</span>
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 font-mono-num">{servingCount}</p>
            </div>

            <div className="text-center p-3">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-semibold mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Avg Wait</span>
              </div>
              <p className="text-2xl font-extrabold text-indigo-600 font-mono-num">~{avgWaitMinutes}m</p>
            </div>
          </div>

        </div>
      </section>

      {/* Domain Flexibility Grid */}
      <section className="py-16 bg-slate-50/60 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">
              Multi-Industry Architecture
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Tailored for Any High-Volume Service
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {domains.map((d) => {
              const Icon = d.icon;
              return (
                <div key={d.name} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{d.name}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{d.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-purple-300 mb-6">
                  <Ticket className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Customer Self-Service</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Customers can generate digital token passes from touchscreen kiosks or track their position live on their mobile devices with real-time ETA.
                </p>
              </div>
              <Link to="/customer" className="inline-flex items-center gap-2 text-sm font-semibold text-purple-300 hover:text-white transition-colors">
                Launch Kiosk Interface <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
                  <Tv className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Public TV Display</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Full-screen TV layout with dynamic multi-counter boards, dual-tone chimes, and automatic speech voice announcements for waiting halls.
                </p>
              </div>
              <Link to="/display" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                Open Public Display <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Counter Staff Console</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  One-click "Call Next", "Complete", and "Skip" actions, multi-service counter assignment, and real-time SLA turnaround monitoring.
                </p>
              </div>
              <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors">
                Enter Admin Portal <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
