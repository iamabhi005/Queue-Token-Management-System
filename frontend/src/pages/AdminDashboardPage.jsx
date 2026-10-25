import React, { useState } from 'react';
import { 
  Ticket, 
  Users, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Volume2, 
  UserCheck, 
  UserX, 
  ArrowRight, 
  Filter, 
  Search, 
  RotateCcw, 
  Menu, 
  Sparkles, 
  Radio, 
  AlertCircle,
  BellRing,
  ExternalLink,
  Phone
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/layout/AdminSidebar';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { 
    tokens, 
    counters, 
    activeCounterId, 
    setActiveCounterId, 
    activeCounter, 
    totalToday, 
    waitingCount, 
    servingCount, 
    completedCount, 
    avgWaitMinutes,
    callNext,
    completeToken,
    skipToken,
    recallToken,
    setCounterStatus,
    resetToMockData,
    resolveServiceId,
    resolveCounterId
  } = useQueue();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [tableFilter, setTableFilter] = useState('ALL'); // ALL, WAITING, SERVING, COMPLETED, SKIPPED
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFeedback, setActionFeedback] = useState(null);

  // Current token being served at active counter — handles populated counterId object
  const currentCounterServingToken = tokens.find(
    t => resolveCounterId(t.counterId) === activeCounterId && t.status === 'SERVING'
  );

  // Eligible waiting tokens for this counter — handles populated serviceId/counterId objects
  const counterWaitingTokens = tokens.filter(t => {
    if (t.status !== 'WAITING') return false;
    const tServiceId = resolveServiceId(t.serviceId);
    const activeServiceId = resolveServiceId(activeCounter?.serviceId);
    if (activeCounter?.supportedServiceIds && Array.isArray(activeCounter.supportedServiceIds)) {
      return activeCounter.supportedServiceIds.includes(tServiceId);
    }
    return !activeServiceId || activeServiceId === tServiceId;
  });

  const showFeedback = (message, type = 'success') => {
    setActionFeedback({ message, type });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleCallNext = async () => {
    const res = await callNext(activeCounterId);
    if (res.success) {
      showFeedback(`Called ${res.token.tokenNumber} to ${activeCounter?.name || 'Counter'}!`, 'success');
    } else {
      showFeedback(res.message, 'warning');
    }
  };

  const handleComplete = async (tokenId) => {
    const res = await completeToken(tokenId);
    if (res.success) {
      showFeedback('Token marked as Completed.', 'success');
    } else {
      showFeedback(res.message || 'Failed to complete token.', 'warning');
    }
  };

  const handleSkip = async (tokenId) => {
    const res = await skipToken(tokenId);
    if (res.success) {
      showFeedback('Token marked as Skipped (No-Show).', 'info');
    } else {
      showFeedback(res.message || 'Failed to skip token.', 'warning');
    }
  };

  const handleRecall = () => {
    if (currentCounterServingToken) {
      recallToken(currentCounterServingToken.tokenNumber, activeCounter?.name || 'Counter');
      showFeedback(`Re-announced ${currentCounterServingToken.tokenNumber} on display!`, 'success');
    }
  };

  // Filtered tokens for table
  const filteredTokens = tokens.filter(token => {
    const sName = token.serviceName || (typeof token.serviceId === 'object' ? token.serviceId?.name : '') || '';
    const matchesFilter = tableFilter === 'ALL' || token.status === tableFilter;
    const matchesSearch = 
      (token.tokenNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (token.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      sName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <AdminSidebar
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Top Operational Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">Operations Console</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                Welcome back, {user?.name || 'Administrator'} • {activeCounter?.name}
              </p>
            </div>
          </div>

          {/* Quick Counter Selector & Status Pill */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 flex-1 sm:flex-initial">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 px-1.5 hidden md:inline">Station:</span>
              <select
                value={activeCounterId}
                onChange={(e) => setActiveCounterId(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs focus:outline-hidden cursor-pointer w-full sm:w-auto"
              >
                {counters.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.number || 'Counter'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={() => setCounterStatus(activeCounterId, 'OPEN')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeCounter?.status === 'OPEN'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setCounterStatus(activeCounterId, 'ON_BREAK')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeCounter?.status === 'ON_BREAK'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Break
              </button>
            </div>
          </div>
        </header>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div className={`mx-4 sm:mx-6 lg:mx-8 mt-4 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold transition-all shadow-sm ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : actionFeedback.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            <BellRing className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>{actionFeedback.message}</span>
          </div>
        )}

        <main className="p-3.5 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1">
          
          {/* 1. KEY METRIC STAT CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCard
              title="Total Tokens"
              value={totalToday}
              icon={Ticket}
              color="purple"
              changeText="Registered today"
            />
            <StatCard
              title="Waiting In Queue"
              value={waitingCount}
              icon={Users}
              color="amber"
              changeText={`${counterWaitingTokens.length} for this counter`}
            />
            <StatCard
              title="Serving Now"
              value={currentCounterServingToken?.tokenNumber || (servingCount > 0 ? `${servingCount} Active` : 'None')}
              icon={Zap}
              color="emerald"
              changeText={currentCounterServingToken ? `At ${activeCounter?.number}` : 'Awaiting next call'}
            />
            <StatCard
              title="Completed"
              value={completedCount}
              icon={CheckCircle2}
              color="blue"
              changeText="Turnaround finalized"
            />
            <div className="col-span-2 sm:col-span-1 md:col-span-1">
              <StatCard
                title="Avg Waiting Time"
                value={`~${avgWaitMinutes}m`}
                icon={Clock}
                color="rose"
                changeText="Rolling SLA window"
              />
            </div>
          </div>

          {/* 2. OPERATIONAL TERMINAL: NOW SERVING & QUICK ACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Active Station Call Card (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0"></span>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      Active Station ({activeCounter?.name || activeCounter?.number || 'Counter'})
                    </h2>
                  </div>
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500">
                    Assigned: <strong className="text-slate-800">{activeCounter?.name}</strong>
                  </span>
                </div>

                {/* Big Serving Display */}
                <div className="my-5 sm:my-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 shadow-md text-center sm:text-left">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                      Currently Serving
                    </span>
                    <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono-num tracking-tight mt-1 text-white">
                      {currentCounterServingToken?.tokenNumber || '— NO TOKEN —'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      {currentCounterServingToken
                        ? `${currentCounterServingToken.customerName} • ${currentCounterServingToken.serviceName}`
                        : 'Station idle. Click "Call Next Customer" below.'}
                    </p>
                  </div>

                  {currentCounterServingToken && (
                    <div className="flex flex-col items-center sm:items-end gap-2">
                      <Badge status={currentCounterServingToken.priority} />
                      <button
                        onClick={handleRecall}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-purple-200 transition-colors cursor-pointer border border-white/10"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Repeat Announcement</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={handleCallNext}
                  className="py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-purple-200" />
                  <span>Call Next</span>
                </button>

                <button
                  onClick={() => currentCounterServingToken && handleComplete(currentCounterServingToken.id)}
                  disabled={!currentCounterServingToken}
                  className="py-3.5 px-4 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Complete</span>
                </button>

                <button
                  onClick={() => currentCounterServingToken && handleSkip(currentCounterServingToken.id)}
                  disabled={!currentCounterServingToken}
                  className="py-3.5 px-4 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <UserX className="w-4 h-4" />
                  <span>Skip (No-Show)</span>
                </button>
              </div>

            </div>

            {/* Right: Counter Queue Backlog (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Waiting for This Station ({counterWaitingTokens.length})
                  </h3>
                  <span className="text-[11px] font-semibold text-purple-600">
                    FIFO Priority Order
                  </span>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {counterWaitingTokens.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-medium">No waiting customers for this counter.</p>
                    </div>
                  ) : (
                    counterWaitingTokens.map((t, idx) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center font-mono-num">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-extrabold text-slate-900 font-mono-num">
                                {t.tokenNumber}
                              </span>
                              {t.priority === 'PRIORITY' && <Badge status="PRIORITY" />}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate max-w-[140px] sm:max-w-[180px]">
                              {t.customerName}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] font-medium text-slate-400 block font-mono-num">
                            Waiting {t.waitMinutes || 5}m
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Total backlog today: {waitingCount}</span>
                <button
                  onClick={resetToMockData}
                  className="text-purple-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Queue Data
                </button>
              </div>

            </div>

          </div>

          {/* 3. RECENT TOKEN REGISTRY TABLE */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            
            {/* Table Header Controls */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Recent Token Activity</h3>
                <p className="text-xs text-slate-500">Real-time lifecycle log across all service categories.</p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search customer / token..."
                    className="w-full sm:w-56 pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-600 bg-slate-50"
                  />
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto max-w-full no-scrollbar">
                  {['ALL', 'WAITING', 'SERVING', 'COMPLETED', 'SKIPPED'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setTableFilter(f)}
                      className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        tableFilter === f
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[700px]">
                <thead className="bg-slate-50/70 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Token #</th>
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-6 py-3.5">Service Type</th>
                    <th className="px-6 py-3.5">Assigned Station</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Wait Time</th>
                    <th className="px-6 py-3.5 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTokens.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                        <Ticket className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm font-semibold">No tokens match your filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTokens.slice(0, 10).map((token) => (
                      <tr key={token.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-mono-num font-bold text-slate-900">
                          <span className="text-purple-700">{token.tokenNumber}</span>
                          {token.priority === 'PRIORITY' && (
                            <span className="ml-1.5 text-[10px] text-amber-600 font-bold">★</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800 leading-snug">{token.customerName}</p>
                          <p className="text-xs text-slate-400">{token.phone}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">
                          {token.serviceName || (typeof token.serviceId === 'object' ? token.serviceId?.name : 'General Service')}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                          {token.counterNumber || (typeof token.counterId === 'object' ? token.counterId?.name : '—')}
                        </td>
                        <td className="px-6 py-4">
                          <Badge status={token.status} />
                        </td>
                        <td className="px-6 py-4 text-xs font-mono-num text-slate-500">
                          {token.waitMinutes} mins
                        </td>
                        <td className="px-6 py-4 text-right">
                          {token.status === 'WAITING' ? (
                            <button
                              onClick={() => {
                                handleCallNext();
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
                            >
                              Call Now
                            </button>
                          ) : token.status === 'SERVING' ? (
                            <div className="inline-flex gap-1">
                              <button
                                onClick={() => handleComplete(token.id)}
                                className="px-2 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                              >
                                Finish
                              </button>
                              <button
                                onClick={() => handleSkip(token.id)}
                                className="px-2 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                              >
                                Skip
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Finalized</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
