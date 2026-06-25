import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';

// Layout components
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import Home from './pages/Home.jsx';
import Markets from './pages/Markets.jsx';
import MarketDetails from './pages/MarketDetails.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Portfolio from './pages/Portfolio.jsx';
import Wallet from './pages/Wallet.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';

import { useTradeStore } from './store/tradeStore.js';

export default function App() {
  const { checkAuth } = useAuthStore();
  const { toastMessage, setToast } = useTradeStore();

  // Validate session on app initialization
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Auto-expire global toast notifications
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToast(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, setToast]);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-[#F9F8F6] text-[#2D2A26]">
        {/* Sticky Global Navigation */}
        <Navbar />

        {/* Global Action Toast Notification Banner */}
        {toastMessage && (
          <div className="fixed top-20 right-6 bg-white border border-emerald-100 rounded-xl px-5 py-3.5 shadow-2xl z-[100] flex items-center gap-2.5 text-xs font-black text-slate-800 border-l-4 border-l-[#10B981] animate-bounce select-none">
            <span className="flex h-2 w-2 rounded-full bg-[#10B981] animate-ping"></span>
            {toastMessage}
          </div>
        )}

        {/* Main Content Router */}
        <main className="flex-grow">
          <Routes>
            {/* Public landing */}
            <Route path="/" element={<Home />} />
            
            {/* Public markets listing & trading pages */}
            <Route path="/markets" element={<Markets />} />
            <Route path="/markets/:id" element={<MarketDetails />} />
            <Route path="/leaderboard" element={<Leaderboard />} />

            {/* Auth forms */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* User dashboard & wallets (Protected) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portfolio"
              element={
                <ProtectedRoute>
                  <Portfolio />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet"
              element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              }
            />

            {/* Administrative console (Protected + Admin Only) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback routing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
