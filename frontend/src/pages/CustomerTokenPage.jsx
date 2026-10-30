import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Ticket, 
  Search, 
  Clock, 
  Users, 
  CheckCircle2, 
  Printer, 
  RefreshCw, 
  ArrowRight, 
  Sparkles, 
  CreditCard, 
  UserCheck, 
  Briefcase, 
  Stethoscope, 
  GraduationCap, 
  AlertCircle,
  QrCode,
  ShieldAlert,
  ChevronRight,
  Tv,
  Building2
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Badge from '../components/common/Badge';

// Map icon strings to Lucide components
const iconMap = {
  CreditCard,
  UserCheck,
  Briefcase,
  Stethoscope,
  GraduationCap
};

export default function CustomerTokenPage() {
  const location = useLocation();
  const { services, tokens, counters, generateToken, waitingTokens, getCountersForService } = useQueue();

  // Helper to resolve serviceId from populated object or raw string
  const resolveServiceId = (serviceId) => {
    if (!serviceId) return null;
    if (typeof serviceId === 'object') return serviceId.id || serviceId._id;
    return serviceId;
  };

  // Mode: 'generate' or 'track'
  const [activeTab, setActiveTab] = useState('generate');

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [isPriority, setIsPriority] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Generated Result (persisted in session so customer does not lose their ticket on reload)
  const [generatedToken, setGeneratedToken] = useState(() => {
    try {
      const saved = sessionStorage.getItem('smartqueue_customer_token');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Track Token Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [trackedToken, setTrackedToken] = useState(null);
  const [searchError, setSearchError] = useState('');

  // Keep customer token in sync with live real-time status updates (SERVING, COMPLETED, etc.)
  useEffect(() => {
    if (generatedToken) {
      const gId = generatedToken.id || generatedToken._id;
      const latest = tokens.find(t => (t.id || t._id) === gId);
      if (latest && (latest.status !== generatedToken.status || latest.counterNumber !== generatedToken.counterNumber)) {
        const updated = { ...generatedToken, ...latest };
        setGeneratedToken(updated);
        try {
          sessionStorage.setItem('smartqueue_customer_token', JSON.stringify(updated));
        } catch {
          // ignore storage error
        }
      }
    }
  }, [tokens, generatedToken]);

  // Check URL query parameters (e.g. ?tab=check)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'check') {
      setActiveTab('track');
    }
  }, [location.search]);

  // Auto-select first service when services load from backend
  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  // Selected Service object and its designated counters
  const selectedService = services.find(s => s.id === selectedServiceId) || services[0];
  const selectedAssignedCounters = getCountersForService ? getCountersForService(selectedService?.id) : [];
  const selectedCounterNames = selectedAssignedCounters.length > 0 
    ? selectedAssignedCounters.map(c => c.name).join(', ') 
    : 'Counter Station';

  // Live queue data for selected service
  const waitingInSelectedService = waitingTokens.filter(t => resolveServiceId(t.serviceId) === selectedService?.id).length;
  const servingInSelectedService = tokens.find(t => resolveServiceId(t.serviceId) === selectedService?.id && t.status === 'SERVING');

  // Handle Token Generation
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setFormError('Please enter your name to issue a token.');
      return;
    }
    if (!selectedServiceId) {
      setFormError('Please choose a required service from the list below.');
      return;
    }
    setFormError('');
    setIsSubmitting(true);

    try {
      const token = await generateToken({
        customerName,
        serviceId: selectedServiceId
      });
      setGeneratedToken(token);
      try {
        sessionStorage.setItem('smartqueue_customer_token', JSON.stringify(token));
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Token generation error:', err);
      setFormError(err.message || 'Failed to generate token.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Search for Existing Token
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchError('Please enter a token number (e.g. A-102).');
      return;
    }
    setSearchError('');

    const query = searchQuery.trim().toUpperCase();
    const localFound = tokens.find(t => t.tokenNumber.toUpperCase() === query || (t.id && t.id.toUpperCase() === query));

    if (localFound && localFound.id) {
      try {
        const statusRes = await tokenAPI.getTokenStatus(localFound.id);
        if (statusRes.success && statusRes.data) {
          const sData = statusRes.data;
          setTrackedToken({
            ...localFound,
            status: sData.status,
            waitingAhead: sData.waitingAhead,
            estimatedWaitMinutes: sData.estimatedWaitMinutes,
            currentServing: sData.currentServing,
            serviceName: sData.token?.serviceId?.name || localFound.serviceName
          });
          return;
        }
      } catch (err) {
        console.warn('Status API fallback to local data:', err);
      }
      setTrackedToken(localFound);
    } else if (localFound) {
      setTrackedToken(localFound);
    } else {
      setSearchError(`Token "${query}" not found in today's registry.`);
      setTrackedToken(null);
    }
  };

  // Compute live ahead count for a specific token
  const getAheadCount = (token) => {
    if (!token || token.status !== 'WAITING') return 0;
    const tSvcId = resolveServiceId(token.serviceId);
    return waitingTokens.filter(
      t => resolveServiceId(t.serviceId) === tSvcId && new Date(t.createdAt) < new Date(token.createdAt)
    ).length;
  };

  const getServiceServingToken = (serviceId) => {
    return tokens.find(t => resolveServiceId(t.serviceId) === resolveServiceId(serviceId) && t.status === 'SERVING');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        
        {/* Header Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/70 mb-3">
            <Ticket className="w-3.5 h-3.5 text-purple-600" />
            <span>Customer Self-Service Terminal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Queue Pass & Live Tracker
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Generate your digital queuing pass in seconds, check live position ahead, or monitor your estimated wait time.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-6 sm:mb-8 px-2">
          <div className="bg-white p-1 rounded-2xl border border-slate-200/90 shadow-xs w-full max-w-sm sm:max-w-md grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'generate'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Ticket className="w-4 h-4 shrink-0" />
              <span className="truncate">Issue Token</span>
            </button>

            <button
              onClick={() => setActiveTab('track')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'track'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4 shrink-0" />
              <span className="truncate">Track Token</span>
            </button>
          </div>
        </div>

        {/* TAB 1: GENERATE TOKEN */}
        {activeTab === 'generate' && (
          <div>
            {!generatedToken ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left: Input Form (8 cols) */}
                <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
                  <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <span>Select Service & Enter Details</span>
                  </h2>

                  {formError && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <form onSubmit={handleGenerate} className="space-y-6">
                    
                    {/* Service Selection Cards */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                        Choose Required Service <span className="text-rose-500">*</span>
                      </label>
                      {services.length === 0 ? (
                        <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center bg-slate-50/50">
                          <p className="text-sm font-semibold text-slate-600">Connecting to server and loading services...</p>
                          <p className="text-xs text-slate-400 mt-1">Please ensure the backend is running at http://localhost:5001</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {services.map((service) => {
                            const Icon = iconMap[service.iconName] || Ticket;
                            const isSelected = selectedServiceId === service.id;
                            const prefixCode = service.code || service.name?.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase() || 'SRV';
                            const estMinutes = service.averageServiceTime || service.estimatedTime || 10;
                            const assignedCtrs = getCountersForService ? getCountersForService(service.id) : [];
                            const assignedCounterNames = assignedCtrs.length > 0 ? assignedCtrs.map(c => c.name).join(', ') : 'Station Counter';
                            return (
                              <div
                                key={service.id}
                                onClick={() => setSelectedServiceId(service.id)}
                                className={`cursor-pointer p-4 rounded-2xl border transition-all text-left relative flex flex-col justify-between ${
                                  isSelected
                                    ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-600/20'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                      isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      <Icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono-num">
                                      Prefix {prefixCode}
                                    </span>
                                  </div>
                                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{service.name}</h3>
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{service.description}</p>
                                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-purple-700 bg-purple-50/90 px-2 py-0.5 rounded-lg border border-purple-200/70 w-fit">
                                    <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                    <span>Counter: {assignedCounterNames}</span>
                                  </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    ~{estMinutes}m / customer
                                  </span>
                                  {isSelected && (
                                    <span className="text-purple-600 font-bold flex items-center gap-0.5">
                                      Selected <CheckCircle2 className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Customer Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                          Your Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                          Mobile Number <span className="text-slate-400 font-normal lowercase">(optional)</span>
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm bg-white"
                        />
                      </div>
                    </div>

                    {/* Priority Flag */}
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPriority}
                          onChange={(e) => setIsPriority(e.target.checked)}
                          className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                        />
                        <div>
                          <span className="text-xs font-bold text-amber-900 block">
                            Special Assistance / Priority Queue
                          </span>
                          <span className="text-xs text-amber-700 leading-relaxed block mt-0.5">
                            Check this if you are a senior citizen (60+), expectant mother, person with disabilities, or in need of urgent care.
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-2xl text-base font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/30 hover:shadow-purple-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Generating Secure Token...</span>
                        </>
                      ) : (
                        <>
                          <Ticket className="w-5 h-5" />
                          <span>Generate Token</span>
                        </>
                      )}
                    </button>

                  </form>
                </div>

                {/* Right: Live Queue Context Summary (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
                      Service Live Status
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-purple-50/80 border border-purple-200">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-semibold text-purple-900">Service Counter</span>
                        </div>
                        <span className="text-sm font-black text-purple-900 font-mono-num">
                          {selectedCounterNames}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
                        <p className="text-xs font-semibold text-purple-700">Currently Serving</p>
                        <p className="text-2xl font-extrabold text-slate-900 font-mono-num mt-1">
                          {servingInSelectedService?.tokenNumber || 'No token active'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {servingInSelectedService ? `At ${servingInSelectedService.counterNumber}` : 'Counters ready'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-medium text-slate-600">Waiting Ahead</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 font-mono-num">
                          {waitingInSelectedService} customers
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-medium text-slate-600">Est. Wait Time</span>
                        </div>
                        <span className="text-sm font-bold text-indigo-600 font-mono-num">
                          ~{Math.max(5, (waitingInSelectedService + 1) * (selectedService?.estimatedTime || 10))} mins
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <Link
                        to="/display"
                        className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center justify-between group"
                      >
                        <span className="flex items-center gap-1.5">
                          <Tv className="w-4 h-4" />
                          Open Public Hall Display
                        </span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* Generated Token Slip Presentation */
              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-purple-200 shadow-xl relative overflow-hidden">
                  
                  {/* Decorative background header */}
                  <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-purple-600 to-indigo-600" />

                  {/* Header */}
                  <div className="text-center pt-2 pb-5 border-b border-dashed border-slate-200">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                      ✓ Token Successfully Issued
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">SmartQueue Digital Pass</h2>
                    <p className="text-xs text-slate-500 mt-1">{generatedToken.serviceName}</p>
                  </div>

                  {/* Big Token Number Display */}
                  <div className="py-6 sm:py-8 text-center bg-slate-50/80 rounded-2xl my-5 sm:my-6 border border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                      Your Token Number
                    </p>
                    <p className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight font-mono-num text-purple-700">
                      {generatedToken.tokenNumber}
                    </p>
                    {generatedToken.priority === 'PRIORITY' && (
                      <div className="mt-2">
                        <Badge status="PRIORITY" />
                      </div>
                    )}
                  </div>

                  {/* Real-time Status Breakdown */}
                  <div className="space-y-3 py-2 text-sm">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/80 border border-purple-200/80 mb-2">
                      <span className="flex items-center gap-2 text-xs font-bold text-purple-900">
                        <Building2 className="w-4 h-4 text-purple-600" />
                        Assigned Service Counter:
                      </span>
                      <span className="font-extrabold text-purple-900 font-mono-num text-sm">
                        {generatedToken.counterNumber || generatedToken.designatedCounter || selectedCounterNames || 'Station Counter'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-2 text-xs">
                        <Users className="w-4 h-4 text-amber-500" />
                        People Waiting Ahead:
                      </span>
                      <span className="font-bold text-slate-900 font-mono-num">
                        {getAheadCount(generatedToken)} customers
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-2 text-xs">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        Estimated Waiting Time:
                      </span>
                      <span className="font-bold text-indigo-600 font-mono-num">
                        ~{generatedToken.waitMinutes} minutes
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-2 text-xs">
                        <Tv className="w-4 h-4 text-emerald-500" />
                        Currently Serving:
                      </span>
                      <span className="font-bold text-emerald-700 font-mono-num">
                        {getServiceServingToken(generatedToken.serviceId)?.tokenNumber || 'None yet'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 pt-2 border-t border-slate-100">
                      <span className="text-xs text-slate-400">Customer Name:</span>
                      <span className="font-medium text-slate-700 text-xs truncate max-w-[180px]">{generatedToken.customerName}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-xs text-slate-400">Issued Timestamp:</span>
                      <span className="font-mono-num text-slate-500 text-xs">
                        {new Date(generatedToken.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* QR Simulation */}
                  <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-dashed border-slate-200 flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <QrCode className="w-9 h-9 sm:w-10 sm:h-10 text-slate-800 shrink-0" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800">Scan to Track on Phone</p>
                        <p className="text-[10px] text-slate-500">Live SMS & Audio alerts</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono-num bg-slate-200 px-2 py-1 rounded text-slate-700 font-semibold shrink-0">
                      #{(generatedToken.id || generatedToken._id || '').slice(-6)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                    <button
                      onClick={handlePrint}
                      className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Slip</span>
                    </button>

                    <button
                      onClick={() => {
                        setGeneratedToken(null);
                        try {
                          sessionStorage.removeItem('smartqueue_customer_token');
                        } catch {
                          // ignore
                        }
                        setCustomerName('');
                      }}
                      className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>New Token</span>
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TRACK EXISTING TOKEN */}
        {activeTab === 'track' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-xs">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Check Live Queue Status</h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-6">
                Enter your issued token number (e.g. <span className="font-mono-num font-bold text-purple-600">A-101</span>, <span className="font-mono-num font-bold text-purple-600">B-102</span>) to see your real-time waiting position.
              </p>

              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 mb-6">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter token number (e.g. A-102)"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600 text-sm font-mono-num uppercase"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-colors cursor-pointer shadow-sm"
                >
                  Track Status
                </button>
              </form>

              {searchError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3 mb-6">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Track Result Card */}
              {trackedToken && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-lg">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-purple-400 font-semibold">
                        {trackedToken.serviceName}
                      </p>
                      <h3 className="text-3xl font-black font-mono-num text-white mt-1">
                        {trackedToken.tokenNumber}
                      </h3>
                    </div>
                    <Badge status={trackedToken.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 my-6">
                    <div className="p-3.5 rounded-xl bg-white/10">
                      <p className="text-xs text-slate-300">Queue Position</p>
                      <p className="text-xl font-bold font-mono-num text-white mt-0.5">
                        {trackedToken.status === 'WAITING' ? `${getAheadCount(trackedToken)} Ahead` : trackedToken.status}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/10">
                      <p className="text-xs text-slate-300">Est. Remaining Time</p>
                      <p className="text-xl font-bold font-mono-num text-white mt-0.5">
                        {trackedToken.status === 'WAITING' ? `~${Math.max(2, getAheadCount(trackedToken) * 8)} mins` : 'Immediate'}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Customer:</span>
                      <span className="font-semibold text-white">{trackedToken.customerName}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">Assigned Station / Counter:</span>
                      <span className="font-bold text-emerald-400">{trackedToken.counterNumber || trackedToken.designatedCounter || 'Station Counter'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Issued At:</span>
                      <span>{new Date(trackedToken.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sample suggestions */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-2">Try checking sample active tokens:</p>
                <div className="flex flex-wrap gap-2">
                  {tokens.slice(0, 4).map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSearchQuery(t.tokenNumber);
                        setTrackedToken(t);
                        setSearchError('');
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono-num font-semibold bg-slate-100 text-slate-700 hover:bg-purple-100 hover:text-purple-700 transition-colors cursor-pointer border border-slate-200"
                    >
                      {t.tokenNumber} ({t.status})
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
