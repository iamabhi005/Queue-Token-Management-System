import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Users, 
  Radio, 
  ArrowLeft, 
  Sparkles,
  Ticket,
  CheckCircle2,
  BellRing
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { announceToken, playChime } from '../utils/audioAnnouncer';

export default function PublicDisplayPage() {
  const { counters, tokens, waitingTokens, waitingCount, avgWaitMinutes, lastAnnouncedToken } = useQueue();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock tick every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Find most recent serving token
  const servingTokensList = tokens.filter(t => t.status === 'SERVING');
  const latestServingToken = servingTokensList.sort((a, b) => new Date(b.calledAt || b.createdAt) - new Date(a.calledAt || a.createdAt))[0];

  // Upcoming in queue (next 6 tokens)
  const upcomingTokens = waitingTokens.slice(0, 6);

  const handleTestAnnouncement = () => {
    if (latestServingToken) {
      announceToken(latestServingToken.tokenNumber, latestServingToken.counterNumber || 'Counter 1');
    } else {
      announceToken('A-101', 'Counter 1');
    }
  };

  return (
    <div className="min-h-screen bg-[#070d1e] text-white flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* Top TV Screen Bar */}
      <header className="px-3.5 sm:px-6 py-3 sm:py-4 bg-[#0c152e] border-b border-indigo-950/80 flex items-center justify-between shadow-md gap-2">
        
        {/* Brand & Live status */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/"
            className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Return to Home"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30 shrink-0">
              <Tv className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xs sm:text-base lg:text-lg font-black tracking-tight text-white flex items-center gap-1.5 sm:gap-2">
                SmartQueue <span className="text-purple-400 font-bold hidden xs:inline">Display</span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">Live Calling & Hall Monitor</p>
            </div>
          </div>
        </div>

        {/* Center Live Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Broadcasting Live</span>
        </div>

        {/* Right Utility Controls & Clock */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Audio Chime test button */}
          <button
            onClick={handleTestAnnouncement}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 transition-all cursor-pointer"
            title="Test Sound / Announcement"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden md:inline">Test Sound</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Toggle TV Fullscreen (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Live Digital Clock */}
          <div className="text-right pl-2 sm:pl-3 border-l border-indigo-950">
            <p className="text-sm sm:text-lg font-black font-mono-num text-purple-300 leading-tight">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>

        </div>

      </header>

      {/* Main Display Grid */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        
        {/* Left 8 Cols: NOW SERVING MAIN STAGE */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-5 sm:space-y-6">
          
          {/* Main Giant Callout Banner */}
          <div className="relative rounded-3xl p-6 sm:p-10 md:p-12 bg-gradient-to-br from-indigo-950 via-[#101b3b] to-purple-950 border-2 border-purple-500/30 shadow-2xl flex flex-col justify-center items-center text-center overflow-hidden">
            
            {/* Ambient background light */}
            <div className="absolute inset-0 bg-radial-gradient from-purple-500/15 via-transparent to-transparent pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/40 mb-3">
              <BellRing className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 animate-bounce" />
              <span>Now Calling</span>
            </div>

            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-slate-400 mb-2">
              Please Proceed To Assigned Station
            </p>

            {/* Giant Token Text */}
            <div className="my-1 sm:my-2">
              <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-mono-num tracking-tight text-white drop-shadow-[0_0_35px_rgba(168,85,247,0.45)]">
                {latestServingToken?.tokenNumber || 'A-101'}
              </h2>
            </div>

            {/* Destination Counter */}
            <div className="mt-3 sm:mt-4 px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2 sm:gap-3">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-slate-300">Proceed to:</span>
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-400 tracking-tight">
                {latestServingToken?.counterNumber || (typeof latestServingToken?.counterId === 'object' ? latestServingToken?.counterId?.name : '') || 'Counter 1'}
              </span>
            </div>

            <p className="text-[11px] sm:text-xs text-purple-300 mt-3 sm:mt-4 font-medium px-2">
              Service: <strong className="text-white">{latestServingToken?.serviceName || (typeof latestServingToken?.serviceId === 'object' ? latestServingToken?.serviceId?.name : '') || 'General Banking & Cashier'}</strong>
            </p>

          </div>

          {/* Multi-Counter Board Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-purple-400" />
              <span>All Active Service Counters</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {counters.map((c) => {
                // Handle both raw string ID and populated object
                const resolveId = (v) => v && typeof v === 'object' ? (v.id || v._id) : v;
                const isCurrent = latestServingToken && resolveId(latestServingToken.counterId) === c.id;
                const servingToken = tokens.find(t => resolveId(t.counterId) === c.id && t.status === 'SERVING');

                return (
                  <div
                    key={c.id}
                    className={`rounded-2xl p-5 border transition-all ${
                      isCurrent
                        ? 'bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-950/50'
                        : 'bg-[#0e1834] border-indigo-950/90'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {c.number}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${
                        c.status === 'OPEN' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`} />
                    </div>

                    <p className="text-3xl font-black font-mono-num text-white my-1">
                      {servingToken ? servingToken.tokenNumber : (c.status === 'OPEN' ? 'Ready' : 'Break')}
                    </p>

                    <p className="text-[11px] text-slate-400 truncate mt-1">
                      {c.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right 4 Cols: UPCOMING QUEUE & HALL METRICS */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
          
          {/* Upcoming Tokens Board */}
          <div className="bg-[#0e1834] rounded-3xl p-6 border border-indigo-950/90 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-indigo-950 mb-4">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white tracking-tight">Next in Line</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                {waitingCount} waiting
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {upcomingTokens.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-400" />
                  <p className="text-sm font-semibold">Queue is clear.</p>
                  <p className="text-xs">No pending customers in line.</p>
                </div>
              ) : (
                upcomingTokens.map((token, index) => (
                  <div
                    key={token.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-indigo-950 text-purple-300 font-mono-num text-xs font-bold flex items-center justify-center border border-indigo-800">
                        #{index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black font-mono-num text-white tracking-tight">
                            {token.tokenNumber}
                          </span>
                          {token.priority === 'PRIORITY' && (
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                              PRIORITY
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {token.serviceName || (typeof token.serviceId === 'object' ? token.serviceId?.name : '') || 'General Service'}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono-num text-slate-400">
                      ~{token.waitMinutes}m
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Waiting Queue Overview stats */}
            <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-indigo-950">
              <div className="p-3 rounded-xl bg-white/5 text-center">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Waiting</p>
                <p className="text-xl font-black font-mono-num text-amber-400">{waitingCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 text-center">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Avg Wait Time</p>
                <p className="text-xl font-black font-mono-num text-indigo-300">~{avgWaitMinutes}m</p>
              </div>
            </div>

          </div>

          {/* Quick Notice Card */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-900/60 text-xs text-slate-300 flex items-start gap-3">
            <Clock className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-0.5">Automated Voice Announcer Active</p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Tokens are announced via airport chimes and spoken voice prompts. Please keep your physical ticket or phone ready.
              </p>
            </div>
          </div>

        </div>

      </main>

      {/* Bottom Scrolling Marquee Ticker */}
      <footer className="bg-[#0c152e] border-t border-indigo-950 py-2.5 px-4 overflow-hidden flex items-center">
        <div className="flex items-center gap-2 pr-4 border-r border-indigo-900 text-xs font-bold text-purple-400 uppercase tracking-wider shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Notice:</span>
        </div>
        <div className="overflow-hidden whitespace-nowrap flex-1 pl-4">
          <div className="animate-marquee inline-block text-xs font-medium text-slate-300">
            Welcome to SmartQueue • Please watch this screen and listen for the audio chime when your token is called • Senior citizens and urgent care cases are prioritized • Scan your ticket QR code to track live progress on your phone • Operating hours: 9:00 AM – 5:00 PM •
          </div>
        </div>
      </footer>

    </div>
  );
}
