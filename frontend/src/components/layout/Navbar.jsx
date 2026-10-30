import React, { useState } from 'react';
  import { Link, useLocation } from 'react-router-dom';
import { 
  Ticket, 
  Tv, 
  LayoutDashboard, 
  User, 
  RotateCcw, 
  Menu, 
  X, 
  Layers,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';

export default function Navbar() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { resetToMockData, waitingCount } = useQueue();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resetAlert, setResetAlert] = useState(false);

  const handleReset = () => {
    resetToMockData();
    setResetAlert(true);
    setTimeout(() => setResetAlert(false), 2500);
  };

  const dashboardName = user?.role === 'ADMIN' 
    ? 'Admin Console' 
    : user?.role === 'STAFF' 
    ? 'Station Console' 
    : user?.role === 'CUSTOMER' 
    ? 'My Dashboard' 
    : 'Portal';

  const navLinks = [
    { name: 'Home', path: '/', icon: Layers },
    { name: 'Get / Track Token', path: '/customer', icon: Ticket, badge: waitingCount > 0 ? `${waitingCount} waiting` : null },
    { name: 'Public TV Display', path: '/display', icon: Tv, highlight: true },
    { name: dashboardName, path: '/admin', icon: LayoutDashboard }
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-purple-800 flex items-center justify-center shadow-md shadow-indigo-950/20 group-hover:scale-105 transition-transform">
              <Ticket className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Smart<span className="text-purple-600">Queue</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/60 rounded">
                  v2.0
                </span>
              </div>
              <p className="hidden sm:block text-[10px] text-slate-400 font-medium -mt-0.5">
                Intelligent Queue Management
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs xl:text-sm font-medium transition-all ${
                    active
                      ? 'bg-purple-50 text-purple-700 font-semibold shadow-xs'
                      : link.highlight
                      ? 'text-indigo-600 hover:bg-indigo-50/70 hover:text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-purple-600' : 'text-slate-400'}`} />
                  <span className="whitespace-nowrap">{link.name}</span>
                  {link.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            {/* Reset mock data button (Admin only) */}
            {user?.role === 'ADMIN' && (
              <button
                onClick={handleReset}
                title="Reset queue to default mock data"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>{resetAlert ? 'Reset Done!' : 'Reset Demo'}</span>
              </button>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">
                    {user?.role === 'ADMIN' ? '👑 Admin' : user?.role === 'STAFF' ? '👤 Staff' : '🎫 Customer'}
                  </p>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-all hover:shadow"
              >
                <User className="w-4 h-4 text-purple-300" />
                <span>Sign In / Register</span>
              </Link>
            )}
          </div>

          {/* Mobile & Tablet Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile & Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium ${
                  active
                    ? 'bg-purple-50 text-purple-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </div>
                {link.badge && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-600"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{resetAlert ? 'Demo State Reset!' : 'Reset Demo Mock Data'}</span>
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-rose-50 text-rose-600"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({user.name})</span>
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white"
              >
                <User className="w-4 h-4 text-purple-300" />
                <span>Admin Login</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
