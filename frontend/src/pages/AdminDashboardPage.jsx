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
  Search, 
  RotateCcw, 
  Menu, 
  Sparkles, 
  Radio, 
  AlertCircle,
  BellRing,
  Plus,
  Layers,
  Building2,
  Tv,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import AdminSidebar from '../components/layout/AdminSidebar';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { 
    services,
    counters, 
    tokens, 
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
    generateToken,
    syncQueueState,
    resolveServiceId,
    resolveCounterId
  } = useQueue();

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';
  const isCustomer = user?.role === 'CUSTOMER';

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [tableFilter, setTableFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFeedback, setActionFeedback] = useState(null);

  // Admin Active Tab: 'operations' | 'services_counters' | 'tokens'
  const [adminTab, setAdminTab] = useState('operations');

  // Admin Modal States: 'service' | 'counter' | null
  const [activeModal, setActiveModal] = useState(null);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [modalError, setModalError] = useState('');

  // Service Form State
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceAvgTime, setServiceAvgTime] = useState(10);

  // Counter Form State
  const [counterName, setCounterName] = useState('');
  const [counterServiceId, setCounterServiceId] = useState(services[0]?.id || '');

  // Customer Active Token tracking
  const customerActiveToken = tokens.find(t => 
    (t.customerName?.toLowerCase() === user?.name?.toLowerCase() || 
     t.customerEmail?.toLowerCase() === user?.email?.toLowerCase()) &&
    ['WAITING', 'SERVING'].includes(t.status)
  );

  // Customer Token Booking State
  const [customerBookingServiceId, setCustomerBookingServiceId] = useState(services[0]?.id || '');
  const [customerBookingSuccess, setCustomerBookingSuccess] = useState(null);
  const [isBookingToken, setIsBookingToken] = useState(false);

  // Current token being served at active station (with fallback to any SERVING token if unassigned or single station)
  const currentCounterServingToken = tokens.find(t => {
    if (t.status !== 'SERVING') return false;
    const cId = resolveCounterId(t.counterId);
    if (!cId || !activeCounterId) return true;
    return String(cId) === String(activeCounterId);
  }) || tokens.find(t => t.status === 'SERVING');

  // Eligible waiting tokens for this counter
  const counterWaitingTokens = tokens.filter(t => {
    if (t.status !== 'WAITING') return false;
    const tServiceId = resolveServiceId(t.serviceId);
    const activeServiceId = resolveServiceId(activeCounter?.serviceId);
    if (activeCounter?.supportedServiceIds && Array.isArray(activeCounter.supportedServiceIds)) {
      return activeCounter.supportedServiceIds.includes(tServiceId);
    }
    return !activeServiceId || String(activeServiceId) === String(tServiceId);
  });

  // Display waiting tokens fallback to all waiting tokens if counter-specific queue is empty
  const displayWaitingTokens = counterWaitingTokens.length > 0
    ? counterWaitingTokens
    : tokens.filter(t => t.status === 'WAITING');

  const showFeedback = (message, type = 'success') => {
    setActionFeedback({ message, type });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleCallNext = async () => {
    const targetCounter = activeCounterId || counters[0]?.id || counters[0]?._id;
    const res = await callNext(targetCounter);
    if (res.success) {
      showFeedback(`Called ${res.token?.tokenNumber || 'Customer'} to ${activeCounter?.name || counters[0]?.name || 'Counter'}!`, 'success');
    } else {
      showFeedback(res.message, 'warning');
    }
  };

  const handleComplete = async (tokenId) => {
    const targetId = tokenId || 
      currentCounterServingToken?.id || currentCounterServingToken?._id ||
      displayWaitingTokens[0]?.id || displayWaitingTokens[0]?._id;

    if (!targetId) {
      showFeedback('No waiting or serving tokens available to complete.', 'warning');
      return;
    }
    const res = await completeToken(targetId);
    if (res.success) {
      showFeedback(`Token ${res.data?.tokenNumber || ''} marked as Completed.`, 'success');
    } else {
      showFeedback(res.message || 'Failed to complete token.', 'warning');
    }
  };

  const handleSkip = async (tokenId) => {
    const targetId = tokenId || 
      currentCounterServingToken?.id || currentCounterServingToken?._id ||
      displayWaitingTokens[0]?.id || displayWaitingTokens[0]?._id;

    if (!targetId) {
      showFeedback('No waiting or serving tokens available to skip.', 'warning');
      return;
    }
    const res = await skipToken(targetId);
    if (res.success) {
      showFeedback(`Token ${res.data?.tokenNumber || ''} marked as Skipped (No-Show).`, 'info');
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

  // Create Service Handler (Admin)
  const handleCreateService = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!serviceName.trim()) {
      setModalError('Please enter a service name.');
      return;
    }
    setIsSubmittingModal(true);
    try {
      await adminAPI.createService(serviceName.trim(), serviceDesc.trim(), Number(serviceAvgTime));
      await syncQueueState();
      showFeedback(`Service "${serviceName.trim()}" created successfully!`, 'success');
      setServiceName('');
      setServiceDesc('');
      setActiveModal(null);
    } catch (err) {
      setModalError(err.message || 'Failed to create service.');
    } finally {
      setIsSubmittingModal(false);
    }
  };

  // Create Counter Handler (Admin)
  const handleCreateCounter = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!counterName.trim()) {
      setModalError('Please enter a counter station name.');
      return;
    }
    const targetSrvId = counterServiceId || services[0]?.id;
    if (!targetSrvId) {
      setModalError('Please select a service for this counter.');
      return;
    }
    setIsSubmittingModal(true);
    try {
      await adminAPI.createCounter(counterName.trim(), targetSrvId);
      await syncQueueState();
      showFeedback(`Counter "${counterName.trim()}" created successfully!`, 'success');
      setCounterName('');
      setActiveModal(null);
    } catch (err) {
      setModalError(err.message || 'Failed to create counter.');
    } finally {
      setIsSubmittingModal(false);
    }
  };

  // Customer Instant Token Booking
  const handleCustomerBookToken = async (serviceId) => {
    setIsBookingToken(true);
    try {
      const targetServiceId = serviceId || customerBookingServiceId || services[0]?.id;
      const customerName = user?.name || 'Valued Customer';
      const token = await generateToken({ customerName, serviceId: targetServiceId });
      setCustomerBookingSuccess(token);
      showFeedback(`Token ${token.tokenNumber} generated! You are in queue.`, 'success');
    } catch (err) {
      showFeedback(err.message || 'Failed to generate token.', 'warning');
    } finally {
      setIsBookingToken(false);
    }
  };

  // Filtered tokens for registry table
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
        
        {/* ─────────────── TOP BAR ─────────────── */}
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
                <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                  {isAdmin ? '👑 Administrator Management Console' : isStaff ? '👤 Staff Station Operator Terminal' : '🎫 Customer Service Portal'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                Signed in as <strong>{user?.name || 'User'}</strong> ({user?.email}) • Role:{' '}
                <span className="font-bold uppercase text-purple-700">{user?.role || 'Customer'}</span>
              </p>
            </div>
          </div>

          {/* Top Right Quick Controls for Admin/Staff */}
          {!isCustomer ? (
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 flex-1 sm:flex-initial">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 px-1.5 hidden md:inline">Station:</span>
                <select
                  value={activeCounterId || ''}
                  onChange={(e) => setActiveCounterId(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs focus:outline-hidden cursor-pointer w-full sm:w-auto"
                >
                  {counters.map(c => (
                    <option key={c.id || c._id} value={c.id || c._id}>
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
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="/display"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Open Public TV Screen</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          )}
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

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* 1. ADMINISTRATOR DASHBOARD VIEW                                       */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {isAdmin && (
          <main className="p-3.5 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1">
            
            {/* Admin Header with Management Tabs & Add Buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  Executive Control Center
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  System Administration Overview
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full control over queue throughput, services, counters, and CSV database synchronization.
                </p>
              </div>

              {/* Admin Actions: Add Service & Add Counter */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <button
                  onClick={() => { setActiveModal('service'); setModalError(''); }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Service</span>
                </button>
                <button
                  onClick={() => { setActiveModal('counter'); setModalError(''); }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <span>Add Counter</span>
                </button>
              </div>
            </div>

            {/* Admin Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <StatCard
                title="Total Tokens"
                value={totalToday}
                icon={Ticket}
                color="purple"
                changeText="Registered today"
              />
              <StatCard
                title="Waiting Backlog"
                value={waitingCount}
                icon={Users}
                color="amber"
                changeText={`${displayWaitingTokens.length} in queue`}
              />
              <StatCard
                title="Serving Now"
                value={currentCounterServingToken?.tokenNumber || (servingCount > 0 ? `${servingCount} Active` : 'None')}
                icon={Zap}
                color="emerald"
                changeText={currentCounterServingToken ? `At ${activeCounter?.name || 'Station'}` : 'Awaiting next call'}
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
                  title="Avg Waiting SLA"
                  value={`~${avgWaitMinutes}m`}
                  icon={Clock}
                  color="rose"
                  changeText="Target: <15 mins"
                />
              </div>
            </div>

            {/* Admin Tab Switcher */}
            <div className="flex bg-slate-200/80 p-1 rounded-2xl w-full sm:w-fit text-xs font-bold text-slate-600">
              <button
                onClick={() => setAdminTab('operations')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  adminTab === 'operations' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                Station Operations
              </button>
              <button
                onClick={() => setAdminTab('services_counters')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  adminTab === 'services_counters' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                Services & Counters ({services.length} / {counters.length})
              </button>
              <button
                onClick={() => setAdminTab('tokens')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  adminTab === 'tokens' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                Tokens Registry ({tokens.length})
              </button>
            </div>

            {/* TAB 1: OPERATIONS */}
            {adminTab === 'operations' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Station Simulator Call Box */}
                <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0"></span>
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          Active Counter Simulator ({activeCounter?.name || 'Counter 1'})
                        </h2>
                      </div>
                      <span className="text-[11px] sm:text-xs font-medium text-slate-500">
                        Department: <strong className="text-slate-800">{activeCounter?.serviceId?.name || activeCounter?.name}</strong>
                      </span>
                    </div>

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
                            ? `${currentCounterServingToken.customerName} • ${currentCounterServingToken.serviceName || 'General Service'}`
                            : 'Station idle. Click "Call Next Customer" below.'}
                        </p>
                      </div>

                      {currentCounterServingToken && (
                        <div className="flex flex-col items-center sm:items-end gap-2">
                          <Badge status={currentCounterServingToken.status} />
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

                  {/* Operational Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={handleCallNext}
                      className="py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-purple-200" />
                      <span>Call Next</span>
                    </button>

                    <button
                      onClick={() => handleComplete()}
                      disabled={!currentCounterServingToken && displayWaitingTokens.length === 0}
                      className="py-3.5 px-4 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{currentCounterServingToken ? 'Complete' : 'Complete Next'}</span>
                    </button>

                    <button
                      onClick={() => handleSkip()}
                      disabled={!currentCounterServingToken && displayWaitingTokens.length === 0}
                      className="py-3.5 px-4 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <UserX className="w-4 h-4" />
                      <span>{currentCounterServingToken ? 'Skip (No-Show)' : 'Skip Next'}</span>
                    </button>
                  </div>
                </div>

                {/* Counter Backlog FIFO */}
                <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <h3 className="text-sm font-bold text-slate-900">
                        Station Queue ({displayWaitingTokens.length})
                      </h3>
                      <span className="text-[11px] font-semibold text-purple-600">
                        FIFO Priority Order
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {displayWaitingTokens.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs font-medium">No waiting customers in queue.</p>
                        </div>
                      ) : (
                        displayWaitingTokens.map((t, idx) => (
                          <div
                            key={t.id || t._id}
                            className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between hover:bg-slate-100/70 transition-colors gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center font-mono-num shrink-0">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <span className="text-sm font-extrabold text-slate-900 font-mono-num block">
                                  {t.tokenNumber}
                                </span>
                                <p className="text-[11px] text-slate-500 truncate max-w-[120px] sm:max-w-[150px]">
                                  {t.customerName}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleComplete(t.id || t._id)}
                                title="Complete this ticket"
                                className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <UserCheck className="w-3 h-3" />
                                <span>Done</span>
                              </button>
                              <button
                                onClick={() => handleSkip(t.id || t._id)}
                                title="Skip ticket"
                                className="px-2 py-1 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <UserX className="w-3 h-3" />
                                <span>Skip</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                    <span>Total waiting: {waitingCount}</span>
                    <button
                      onClick={resetToMockData}
                      className="text-purple-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset Demo Data
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SERVICES & COUNTERS CONFIGURATION */}
            {adminTab === 'services_counters' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Services List Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Service Categories ({services.length})</h3>
                      <p className="text-xs text-slate-500">Configured departments and their average service times.</p>
                    </div>
                    <button
                      onClick={() => { setActiveModal('service'); setModalError(''); }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
                    >
                      + Add Service
                    </button>
                  </div>

                  <div className="space-y-3">
                    {services.map((s) => (
                      <div key={s.id || s._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{s.name}</h4>
                          <p className="text-xs text-slate-500">{s.description || 'Standard service queue'}</p>
                          <span className="inline-block mt-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                            Avg Time: {s.averageServiceTime || 10} mins
                          </span>
                        </div>
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Counters List Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Physical Counter Stations ({counters.length})</h3>
                      <p className="text-xs text-slate-500">Service booths assigned to specific service categories.</p>
                    </div>
                    <button
                      onClick={() => { setActiveModal('counter'); setModalError(''); }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      + Add Counter
                    </button>
                  </div>

                  <div className="space-y-3">
                    {counters.map((c) => (
                      <div key={c.id || c._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                          <p className="text-xs text-slate-500">
                            Assigned: <strong className="text-slate-700">{c.serviceId?.name || 'General Department'}</strong>
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          c.status === 'ON_BREAK' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {c.status || 'OPEN'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TOKEN REGISTRY TABLE */}
            {(adminTab === 'tokens' || adminTab === 'operations') && (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">Recent Queue Activity Log</h3>
                    <p className="text-xs text-slate-500">Synchronized in real-time across database and CSV exports.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search token / customer..."
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

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[700px]">
                    <thead className="bg-slate-50/70 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5">Token #</th>
                        <th className="px-6 py-3.5">Customer</th>
                        <th className="px-6 py-3.5">Service Type</th>
                        <th className="px-6 py-3.5">Station</th>
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
                            <p className="text-sm font-semibold">No tokens found.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredTokens.slice(0, 10).map((token) => (
                          <tr key={token.id || token._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-6 py-4 font-mono-num font-bold text-slate-900">
                              <span className="text-purple-700">{token.tokenNumber}</span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-800 leading-snug">{token.customerName}</p>
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
                              {token.waitMinutes || 5} mins
                            </td>
                            <td className="px-6 py-4 text-right">
                              {token.status === 'WAITING' ? (
                                <div className="inline-flex gap-1">
                                  <button
                                    onClick={handleCallNext}
                                    className="px-2 py-1 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
                                  >
                                    Call
                                  </button>
                                  <button
                                    onClick={() => handleComplete(token.id || token._id)}
                                    className="px-2 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                                  >
                                    Done
                                  </button>
                                  <button
                                    onClick={() => handleSkip(token.id || token._id)}
                                    className="px-2 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                                  >
                                    Skip
                                  </button>
                                </div>
                              ) : token.status === 'SERVING' ? (
                                <div className="inline-flex gap-1">
                                  <button
                                    onClick={() => handleComplete(token.id || token._id)}
                                    className="px-2 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                                  >
                                    Finish
                                  </button>
                                  <button
                                    onClick={() => handleSkip(token.id || token._id)}
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
            )}

          </main>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* 2. STAFF / COUNTER OPERATOR DASHBOARD VIEW                            */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {isStaff && (
          <main className="p-3.5 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1">
            
            {/* Staff Station Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-purple-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5 mb-1">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Active Station Assigned: {activeCounter?.name || 'Counter 1'}
                </span>
                <h2 className="text-2xl font-black tracking-tight">
                  Operator Calling Terminal
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  You are currently managing <strong>{activeCounter?.name}</strong> for {activeCounter?.serviceId?.name || 'General Service'}.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-center">
                  <span className="text-[10px] uppercase font-bold text-purple-200 block">Queue Backlog</span>
                  <span className="text-xl font-black">{displayWaitingTokens.length} waiting</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-center">
                  <span className="text-[10px] uppercase font-bold text-purple-200 block">Station Status</span>
                  <span className="text-sm font-bold text-emerald-300">{activeCounter?.status || 'OPEN'}</span>
                </div>
              </div>
            </div>

            {/* Staff Operations Terminal Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left: Active Calling Card */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">Station Calling Unit</h3>
                    <span className="text-xs text-slate-500">Press "Call Next" to pick next ticket</span>
                  </div>

                  <div className="my-6 p-6 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center text-center shadow-inner">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      Now Serving at Station
                    </span>
                    <h3 className="text-5xl sm:text-6xl font-black font-mono-num tracking-tight mt-2 text-white">
                      {currentCounterServingToken?.tokenNumber || '— NONE —'}
                    </h3>
                    <p className="text-sm text-slate-300 mt-2 font-medium">
                      {currentCounterServingToken
                        ? `${currentCounterServingToken.customerName} • ${currentCounterServingToken.serviceName || 'Service'}`
                        : 'No customer currently at counter.'}
                    </p>

                    {currentCounterServingToken && (
                      <button
                        onClick={handleRecall}
                        className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-purple-200 transition-colors cursor-pointer border border-white/15"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Re-Announce on TV Screen</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Operator Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={handleCallNext}
                    className="py-4 px-4 rounded-2xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-purple-200" />
                    <span>Call Next Customer</span>
                  </button>

                  <button
                    onClick={() => handleComplete()}
                    disabled={!currentCounterServingToken && displayWaitingTokens.length === 0}
                    className="py-4 px-4 rounded-2xl text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{currentCounterServingToken ? 'Complete' : 'Complete Next'}</span>
                  </button>

                  <button
                    onClick={() => handleSkip()}
                    disabled={!currentCounterServingToken && displayWaitingTokens.length === 0}
                    className="py-4 px-4 rounded-2xl text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <UserX className="w-4 h-4" />
                    <span>{currentCounterServingToken ? 'Skip No-Show' : 'Skip Next'}</span>
                  </button>
                </div>
              </div>

              {/* Right: Station Queue Backlog */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <h3 className="font-bold text-slate-900">Waiting for {activeCounter?.name}</h3>
                    <span className="text-xs font-bold text-purple-600">{displayWaitingTokens.length} tickets</span>
                  </div>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {displayWaitingTokens.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p className="text-xs font-semibold">No waiting customers in queue.</p>
                      </div>
                    ) : (
                      displayWaitingTokens.map((t, idx) => (
                        <div
                          key={t.id || t._id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center font-mono-num shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <span className="text-sm font-extrabold text-slate-900 font-mono-num block">
                                {t.tokenNumber}
                              </span>
                              <p className="text-xs text-slate-500 truncate max-w-[120px] sm:max-w-[150px]">{t.customerName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleComplete(t.id || t._id)}
                              title="Complete ticket"
                              className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Done</span>
                            </button>
                            <button
                              onClick={() => handleSkip(t.id || t._id)}
                              title="Skip ticket"
                              className="px-2 py-1 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <UserX className="w-3 h-3" />
                              <span>Skip</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
                  Live synced with public display board
                </div>
              </div>

            </div>

          </main>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* 3. CUSTOMER / USER PERSONAL DASHBOARD VIEW                            */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {isCustomer && (
          <main className="p-3.5 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1 max-w-5xl">
            
            {/* Customer Welcome Hero */}
            <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-purple-200 backdrop-blur-md mb-3">
                  <UserIcon className="w-3.5 h-3.5" />
                  Customer Self-Service Portal
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Welcome, {user?.name || 'Customer'}!
                </h2>
                <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-lg leading-relaxed">
                  Book service tokens, track your live queue position in real time, and avoid waiting in crowded physical lines.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center shrink-0">
                <span className="text-xs text-purple-200 block font-medium">Estimated General Wait</span>
                <span className="text-3xl font-black">~{avgWaitMinutes} mins</span>
                <span className="text-[10px] text-purple-300 block mt-0.5">{waitingCount} customers in line</span>
              </div>
            </div>

            {/* CUSTOMER ACTIVE TOKEN CARD (IF ISSUED) */}
            {customerActiveToken ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-purple-500 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="text-lg font-bold text-slate-900">Your Active Queue Token</h3>
                  </div>
                  <Badge status={customerActiveToken.status} />
                </div>

                <div className="my-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                    <span className="text-xs text-purple-600 font-bold uppercase">Token Number</span>
                    <h4 className="text-4xl font-black text-purple-900 font-mono-num mt-1">
                      {customerActiveToken.tokenNumber}
                    </h4>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-bold uppercase">Assigned Station</span>
                    <h4 className="text-2xl font-black text-slate-800 mt-2">
                      {customerActiveToken.counterNumber || 'Waiting for Counter...'}
                    </h4>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-bold uppercase">Estimated Wait</span>
                    <h4 className="text-2xl font-black text-slate-800 mt-2">
                      ~{customerActiveToken.waitMinutes || 10} mins
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-slate-500 text-center">
                  Keep this tab open. When your token is announced, your assigned counter will appear above and on the Public TV Screen.
                </p>
              </div>
            ) : null}

            {/* 1-CLICK TOKEN GENERATOR CARDS */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Book a Service Token (1-Click)</h3>
                  <p className="text-xs text-slate-500">Select a category below to generate your queue ticket immediately.</p>
                </div>
                <span className="text-xs font-bold text-purple-600">Booking as: {user?.name}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((s) => (
                  <div
                    key={s.id || s._id}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-purple-400 bg-slate-50 hover:bg-purple-50/50 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                          {s.name.charAt(0)}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          ~{s.averageServiceTime || 10}m
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                        {s.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {s.description || 'General inquiry and department services.'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleCustomerBookToken(s.id || s._id)}
                      disabled={isBookingToken}
                      className="mt-4 w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-purple-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Take Token</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Queue Overview Table */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-1">Today's Live Queue Overview</h3>
              <p className="text-xs text-slate-500 mb-4">Active queue tickets currently waiting across all stations.</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">Token #</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Serving Counter</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {tokens.slice(0, 5).map((t) => (
                      <tr key={t.id || t._id}>
                        <td className="px-4 py-3 font-bold font-mono-num text-purple-700">{t.tokenNumber}</td>
                        <td className="px-4 py-3 text-slate-600">{t.serviceName || (typeof t.serviceId === 'object' ? t.serviceId?.name : 'General')}</td>
                        <td className="px-4 py-3 text-slate-700">{t.counterNumber || (typeof t.counterId === 'object' ? t.counterId?.name : '—')}</td>
                        <td className="px-4 py-3"><Badge status={t.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </main>
        )}

      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ADMIN MODALS (ADD SERVICE & ADD COUNTER)                               */}
      {/* ═════════════════════════════════════════════════════════════════════ */}

      {/* 1. Add Service Modal */}
      {activeModal === 'service' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">Create Service Category</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Name</label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. VIP Concierge"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="Brief summary of department requests"
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Average Service Time (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={serviceAvgTime}
                  onChange={(e) => setServiceAvgTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingModal}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingModal ? 'Saving...' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Counter Modal */}
      {activeModal === 'counter' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">Create Counter Station</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateCounter} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Counter Station Name</label>
                <input
                  type="text"
                  value={counterName}
                  onChange={(e) => setCounterName(e.target.value)}
                  placeholder="e.g. Counter 5 - FastTrack"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Service Category</label>
                <select
                  value={counterServiceId}
                  onChange={(e) => setCounterServiceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-600 focus:outline-hidden cursor-pointer"
                >
                  {services.map((s) => (
                    <option key={s.id || s._id} value={s.id || s._id}>
                      {s.name} ({s.averageServiceTime}m avg)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingModal}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingModal ? 'Saving...' : 'Create Station'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
