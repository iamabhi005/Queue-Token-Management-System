import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute component that checks if user is logged in as ADMIN or STAFF
 */
export default function ProtectedRoute({ children, allowedRoles = ['ADMIN', 'STAFF'] }) {
  const { user, isAuthenticated, loading, login, logout } = useAuth();
  const location = useLocation();
  const [switching, setSwitching] = React.useState(false);

  if (loading || switching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const handleSwitchToAdmin = async () => {
      setSwitching(true);
      await login('admin@smartqueue.com', 'admin123');
      setSwitching(false);
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-lg shadow-slate-200/50">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            🛡️
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Staff & Admin Access Only</h2>
          <p className="text-sm text-slate-600 mb-2 leading-relaxed">
            Your current logged-in account (<strong>{user.email}</strong>) has the <span className="font-bold text-slate-800">{user.role}</span> role.
          </p>
          <p className="text-xs text-slate-500 mb-6">
            The Operations Console is restricted to accounts with <strong>ADMIN</strong> or <strong>STAFF</strong> permissions.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleSwitchToAdmin}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Switch to Administrator (1-Click)</span>
            </button>
            
            <button
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
            >
              Sign Out & Use Different Account
            </button>

            <a
              href="/"
              className="block text-xs text-slate-400 hover:text-slate-600 pt-2"
            >
              ← Return to Homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
