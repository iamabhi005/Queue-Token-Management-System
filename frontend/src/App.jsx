import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { QueueProvider } from './context/QueueContext';

import HomePage from './pages/HomePage';
import CustomerTokenPage from './pages/CustomerTokenPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import PublicDisplayPage from './pages/PublicDisplayPage';
import TokenHistoryPage from './pages/TokenHistoryPage';
import ProtectedRoute from './components/common/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <QueueProvider>
        <BrowserRouter>
          <Routes>
            {/* 1. Home Page */}
            <Route path="/" element={<HomePage />} />

            {/* 2. Customer Token Page */}
            <Route path="/customer" element={<CustomerTokenPage />} />

            {/* 3. Admin Login Page */}
            <Route path="/login" element={<AdminLoginPage />} />

            {/* 4. Admin Dashboard (Protected) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* 5. Public Display Screen */}
            <Route path="/display" element={<PublicDisplayPage />} />

            {/* 6. Token History Page (Protected) */}
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <TokenHistoryPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueueProvider>
    </AuthProvider>
  );
}
