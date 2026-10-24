import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Ticket, 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  KeyRound, 
  CheckCircle2, 
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking'); // 'online' | 'offline' | 'checking'

  // Check backend server health on mount
  React.useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/health', { method: 'GET', signal: AbortSignal.timeout(3000) });
        if (res.ok && isMounted) {
          setServerStatus('online');
        } else if (isMounted) {
          setServerStatus('offline');
        }
      } catch {
        if (isMounted) setServerStatus('offline');
      }
    };
    checkServer();
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();

    // Validation
    if (!cleanEmail) {
      setError('Please provide an email address.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(cleanEmail, password);
      if (result.success) {
        navigate('/admin');
      } else {
        setError(result.message || 'Invalid email or password.');
      }
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('connect')) {
        setError('Cannot connect to backend server on port 5001. Please run `npm run dev` in your terminal.');
      } else {
        setError(err.message || 'Unable to connect to authentication server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminDemoFill = () => {
    setEmail('admin@smartqueue.com');
    setPassword('admin123');
    setError('');
  };

  const handleStaffDemoFill = () => {
    setEmail('staff@smartqueue.com');
    setPassword('staff123');
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          
          {/* Main Card */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl shadow-slate-200/50">
            
            {/* Header Icon & Title */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-purple-800 flex items-center justify-center text-white mx-auto mb-4 shadow-md shadow-purple-900/20">
                <ShieldCheck className="w-7 h-7 text-purple-300" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Staff & Admin Portal
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Enter your authorized credentials to access queue operations.
              </p>

              {/* Server Status Pill */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  serverStatus === 'online' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : serverStatus === 'offline'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    serverStatus === 'online' ? 'bg-emerald-500 animate-pulse' : serverStatus === 'offline' ? 'bg-rose-500' : 'bg-slate-400'
                  }`} />
                  {serverStatus === 'online' && 'Backend API Connected (Port 5001)'}
                  {serverStatus === 'offline' && 'Backend Server Offline'}
                  {serverStatus === 'checking' && 'Checking backend status...'}
                </span>
              </div>
            </div>

            {/* Backend Offline Warning */}
            {serverStatus === 'offline' && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  Backend server is not running on port 5001
                </p>
                <p>Run <code className="px-1.5 py-0.5 bg-amber-100 rounded text-amber-900 font-mono font-bold">npm run dev</code> in the project directory to start both the backend API and frontend concurrently.</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-sm animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Staff Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="name@smartqueue.com"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600 text-sm bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Password
                  </label>
                  <span className="text-[11px] text-purple-600 font-medium cursor-pointer hover:underline">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600 text-sm bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl text-base font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/20 hover:shadow-slate-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Authenticating Session...
                  </span>
                ) : (
                  <>
                    <span>Sign In to Station</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>

            {/* Demo Credentials Quick Fill Chip */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-100/90 text-left">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Demo Credentials (1-Click Fill)
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Admin Fill Button */}
                  <button
                    type="button"
                    onClick={handleAdminDemoFill}
                    className="p-2.5 rounded-xl bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-left shadow-2xs group cursor-pointer"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800 text-[11px] mb-1">
                      <span>Administrator</span>
                      <span className="text-[10px] text-purple-600 group-hover:underline">Fill</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">admin@smartqueue.com</div>
                    <div className="text-[10px] text-slate-500 font-mono">Pass: admin123</div>
                  </button>

                  {/* Staff Fill Button */}
                  <button
                    type="button"
                    onClick={handleStaffDemoFill}
                    className="p-2.5 rounded-xl bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-left shadow-2xs group cursor-pointer"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800 text-[11px] mb-1">
                      <span>Staff Member</span>
                      <span className="text-[10px] text-purple-600 group-hover:underline">Fill</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">staff@smartqueue.com</div>
                    <div className="text-[10px] text-slate-500 font-mono">Pass: staff123</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Back to Home Link */}
            <div className="mt-6 text-center">
              <Link to="/" className="text-xs font-medium text-slate-500 hover:text-slate-800">
                ← Return to Public Homepage
              </Link>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
