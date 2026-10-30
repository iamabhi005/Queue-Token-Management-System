import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles,
  Eye,
  EyeOff,
  User,
  UserPlus,
  LogIn,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Redirect if already logged in (role-based)
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ADMIN' || user.role === 'STAFF') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/customer', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Tab state: 'login' or 'register'
  const [activeTab, setActiveTab] = useState('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('ADMIN');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Shared state
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');

  // Check backend server health on mount
  React.useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        const res = await fetch(`${apiUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(3000) });
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

  // Switch tab handler (clears errors)
  const switchTab = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccessMsg('');
  };

  // ─────────────── LOGIN HANDLER ───────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = loginEmail.trim();
    if (!cleanEmail) { setError('Please provide an email address.'); return; }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) { setError('Please enter a valid email address.'); return; }
    if (!loginPassword) { setError('Please enter your password.'); return; }

    setIsLoading(true);
    try {
      const result = await login(cleanEmail, loginPassword);
      if (result.success) {
        const role = result.user?.role;
        if (role === 'ADMIN' || role === 'STAFF') {
          navigate('/admin');
        } else {
          navigate('/customer');
        }
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

  // ─────────────── REGISTER HANDLER ───────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim();

    if (!cleanName) { setError('Please enter your full name.'); return; }
    if (cleanName.length < 2) { setError('Name must be at least 2 characters.'); return; }
    if (!cleanEmail) { setError('Please provide an email address.'); return; }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) { setError('Please enter a valid email address.'); return; }
    if (!regPassword) { setError('Please create a password.'); return; }
    if (regPassword.length < 6) { setError('Password must be at least 6 characters long.'); return; }
    if (regPassword !== regConfirmPassword) { setError('Passwords do not match.'); return; }

    setIsLoading(true);
    try {
      const result = await register(cleanName, cleanEmail, regPassword, regRole);
      if (result.success) {
        setSuccessMsg(`Account created successfully! Welcome, ${result.user?.name || cleanName}.`);
        // Auto-redirect after successful registration (role-based)
        const userRole = result.user?.role || finalRole;
        setTimeout(() => {
          if (userRole === 'ADMIN' || userRole === 'STAFF') {
            navigate('/admin');
          } else {
            navigate('/customer');
          }
        }, 1500);
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('connect')) {
        setError('Cannot connect to backend server on port 5001. Please run `npm run dev` in your terminal.');
      } else {
        setError(err.message || 'Registration failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Demo credential fill handlers
  const handleAdminDemoFill = () => {
    setLoginEmail('admin@smartqueue.com');
    setLoginPassword('admin123');
    setError('');
    setActiveTab('login');
  };

  const handleStaffDemoFill = () => {
    setLoginEmail('staff@smartqueue.com');
    setLoginPassword('staff123');
    setError('');
    setActiveTab('login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          
          {/* Main Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl shadow-slate-200/50">
            
            {/* Header Icon & Title */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-purple-800 flex items-center justify-center text-white mx-auto mb-4 shadow-md shadow-purple-900/20">
                <ShieldCheck className="w-7 h-7 text-purple-300" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                SmartQueue Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Sign in to your account or create a new one
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
              <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  Backend server is not running on port 5001
                </p>
                <p>Run <code className="px-1.5 py-0.5 bg-amber-100 rounded text-amber-900 font-mono font-bold">npm run dev</code> in the project directory to start both the backend API and frontend concurrently.</p>
              </div>
            )}

            {/* ═══════════ TAB SWITCHER ═══════════ */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => switchTab('login')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/80'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchTab('register')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/80'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Register
              </button>
            </div>

            {/* Success Message */}
            {successMsg && (
              <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-700 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="leading-snug">{successMsg}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-sm animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* ═══════════ LOGIN FORM ═══════════ */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => { setLoginEmail(e.target.value); setError(''); }}
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
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => { setLoginPassword(e.target.value); setError(''); }}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600 text-sm bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                      Authenticating...
                    </span>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Switch to register prompt */}
                <p className="text-center text-sm text-slate-500 mt-4">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => switchTab('register')} className="text-purple-600 font-semibold hover:underline cursor-pointer">
                    Create Account
                  </button>
                </p>
              </form>
            )}

            {/* ═══════════ REGISTER FORM ═══════════ */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => { setRegName(e.target.value); setError(''); }}
                      placeholder="Abhishek Patel"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600 text-sm bg-white"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => { setRegEmail(e.target.value); setError(''); }}
                      placeholder="name@example.com"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600 text-sm bg-white"
                    />
                  </div>
                </div>

                {/* Role Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Account Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'ADMIN', label: 'Admin', icon: '🛡️' },
                      { value: 'STAFF', label: 'Staff', icon: '👤' },
                      { value: 'CUSTOMER', label: 'Customer', icon: '🎫' }
                    ].map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRegRole(r.value)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          regRole === r.value
                            ? 'bg-purple-50 border-purple-400 text-purple-800 ring-2 ring-purple-200'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-base mb-0.5">{r.icon}</span>
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Select <strong>Admin</strong> or <strong>Staff</strong> to access the operational console.
                  </p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => { setRegPassword(e.target.value); setError(''); }}
                      placeholder="Min 6 characters"
                      className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600 text-sm bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => { setRegConfirmPassword(e.target.value); setError(''); }}
                      placeholder="Re-enter password"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600 text-sm bg-white"
                    />
                  </div>
                  {/* Password match indicator */}
                  {regConfirmPassword && (
                    <p className={`mt-1.5 text-xs font-medium flex items-center gap-1 ${
                      regPassword === regConfirmPassword ? 'text-emerald-600' : 'text-rose-500'
                    }`}>
                      {regPassword === regConfirmPassword ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Passwords match</>
                      ) : (
                        <><AlertCircle className="w-3.5 h-3.5" /> Passwords do not match</>
                      )}
                    </p>
                  )}
                </div>

                {/* Register Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-600 hover:to-purple-800 shadow-md shadow-purple-900/20 hover:shadow-purple-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Creating Account...
                    </span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>

                {/* Switch to login prompt */}
                <p className="text-center text-sm text-slate-500 mt-4">
                  Already have an account?{' '}
                  <button type="button" onClick={() => switchTab('login')} className="text-purple-600 font-semibold hover:underline cursor-pointer">
                    Sign In
                  </button>
                </p>
              </form>
            )}

            {/* ═══════════ DEMO CREDENTIALS (only in login tab) ═══════════ */}
            {activeTab === 'login' && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-100/90 text-left">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      Demo Credentials (1-Click Fill)
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Admin Fill Button */}
                    <button
                      type="button"
                      onClick={handleAdminDemoFill}
                      className="p-2.5 rounded-xl bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-left shadow-2xs group cursor-pointer"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800 text-[11px] mb-1">
                        <span>🛡️ Administrator</span>
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
                        <span>👤 Staff Member</span>
                        <span className="text-[10px] text-purple-600 group-hover:underline">Fill</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">staff@smartqueue.com</div>
                      <div className="text-[10px] text-slate-500 font-mono">Pass: staff123</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

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
