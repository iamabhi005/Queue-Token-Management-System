import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History, 
  Tv, 
  Ticket, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Radio, 
  RotateCcw,
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueue } from '../../context/QueueContext';

export default function AdminSidebar({ isMobileOpen, setIsMobileOpen }) {
  const { user, logout } = useAuth();
  const { counters, activeCounterId, setActiveCounterId, activeCounter, waitingCount, resetToMockData } = useQueue();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';
  const isCustomer = user?.role === 'CUSTOMER';

  const navItems = isCustomer ? [
    { name: 'My Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Book a Token', path: '/customer', icon: Ticket },
    { name: 'Track Live Status', path: '/customer?tab=check', icon: History },
    { name: 'Public TV Display', path: '/display', icon: Tv, highlight: true }
  ] : isStaff ? [
    { name: 'Station Terminal', path: '/admin', icon: LayoutDashboard },
    { name: 'Token History', path: '/history', icon: History },
    { name: 'Public TV Display', path: '/display', icon: Tv, highlight: true },
    { name: 'Customer Kiosk', path: '/customer', icon: Ticket, count: waitingCount }
  ] : [
    { name: 'Admin Console', path: '/admin', icon: LayoutDashboard },
    { name: 'Token History', path: '/history', icon: History },
    { name: 'Public TV Display', path: '/display', icon: Tv, highlight: true },
    { name: 'Customer Kiosk', path: '/customer', icon: Ticket, count: waitingCount }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-900/30 shrink-0">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">SmartQueue</h2>
            <p className="text-[11px] font-medium text-purple-400">
              {isAdmin ? 'System Administration' : isStaff ? 'Station Operations' : 'Customer Portal'}
            </p>
          </div>
        </div>
        {setIsMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Active Counter Switcher (Only for Admin & Staff operators) */}
      {!isCustomer && (
        <div className="p-4 mx-4 my-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              Station Assignment
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              activeCounter?.status === 'OPEN' ? 'bg-emerald-900/60 text-emerald-300' : 'bg-amber-900/60 text-amber-300'
            }`}>
              {activeCounter?.status || 'OPEN'}
            </span>
          </div>
          <select
            value={activeCounterId || ''}
            onChange={(e) => setActiveCounterId(e.target.value)}
            className="w-full text-xs font-semibold bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            {counters.map(c => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.name || c.number || 'Counter'}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-1.5 truncate">
            Operator: <span className="text-slate-300">{user?.name || activeCounter?.staffName || 'Operator'}</span>
          </p>
        </div>
      )}

      {/* Main Navigation Links */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Main Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-900/30'
                    : item.highlight
                    ? 'text-indigo-400 hover:bg-slate-800 hover:text-indigo-300'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                  {item.count}
                </span>
              )}
            </NavLink>
          );
        })}

        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-slate-800">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Simulation Controls
            </p>
            <button
              onClick={() => {
                resetToMockData();
                alert('Queue reset to default mock state!');
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        )}
      </nav>

      {/* User Session Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-purple-900/80 border border-purple-700/60 flex items-center justify-center text-xs font-bold text-purple-200">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-purple-400 font-semibold truncate">
                {isAdmin ? '👑 Administrator' : isStaff ? '👤 Staff Operator' : '🎫 Customer'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 fixed inset-y-0 left-0 z-30 shadow-xl border-r border-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
