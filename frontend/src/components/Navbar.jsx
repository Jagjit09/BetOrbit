import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useCurrencyStore } from '../store/currencyStore.js';
import { useTradeStore } from '../store/tradeStore.js';
import axiosClient from '../api/axiosClient.js';
import { Menu, X, Search, Gift, Bell, ChevronDown, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, token, logout, checkAuth } = useAuthStore();
  const { currency, setCurrency, format } = useCurrencyStore();
  const { portfolio, fetchPortfolio, orders = [], fetchOrders } = useTradeStore();
  const navigate = useNavigate();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [faucetMsg, setFaucetMsg] = useState('');

  useEffect(() => {
    if (token) {
      fetchPortfolio();
      fetchOrders();
    }
  }, [token, fetchPortfolio, fetchOrders]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    setNotificationsOpen(false);
    navigate('/');
  };

  const handleClaimFaucet = async () => {
    try {
      const res = await axiosClient.post('/wallet/faucet');
      setFaucetMsg(res.data.message);
      // Reload states
      await checkAuth();
      await fetchPortfolio();
      setTimeout(() => setFaucetMsg(''), 4000);
    } catch (err) {
      setFaucetMsg(err.response?.data?.error || 'Deposit failed');
      setTimeout(() => setFaucetMsg(''), 4000);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[#EBE7DF] bg-[#FAF8F5]/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="select-none">
                <defs>
                  <linearGradient id="navLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0072F5" />
                    <stop offset="100%" stopColor="#8c6ef0" />
                  </linearGradient>
                </defs>
                <ellipse cx="50" cy="50" rx="38" ry="14" stroke="url(#navLogoGrad)" strokeWidth="5" fill="none" transform="rotate(-28 50 50)" />
                <circle cx="82" cy="35" r="7" fill="#10b981" />
                <circle cx="50" cy="50" r="22" fill="#FAF8F5" stroke="url(#navLogoGrad)" strokeWidth="5" />
                <path d="M44 38H50C54 38 56 40 56 43C56 45 54 47 51 47.5C54.5 48 57 50.5 57 54C57 57.5 54 59.5 50 59.5H44V38ZM48 45.5V47.5H50.5C52 47.5 52.5 47 52.5 46.2C52.5 45.5 52 45.5 50.5 45.5H48ZM48 51.5V56.5H51C52.5 56.5 53 56 53 55C53 54 52.5 53.5 51 53.5H48Z" fill="#2D2A26" />
              </svg>
              <span className="text-[#2D2A26] text-lg font-black tracking-tight select-none">
                BetOrbit
              </span>
            </Link>
          </div>

          {/* Centered Search Bar */}
          <div className="hidden md:flex items-center flex-grow max-w-[420px] mx-auto relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C867A]">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Search BetOrbit..."
              className="w-full bg-[#FAF8F5] border border-[#E1DCD3] focus:border-[#0072F5]/45 focus:bg-white focus:outline-none rounded-xl py-2 pl-10 pr-4 text-sm font-semibold text-[#2D2A26] placeholder:text-[#8C867A] transition-all shadow-inner"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate(`/markets?search=${encodeURIComponent(e.target.value)}`);
                }
              }}
            />
          </div>

          {/* Desktop Links / Balances (Right) */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {token && user ? (
              <>
                {/* Currency selector toggle */}
                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-sm shrink-0 select-none">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-transparent border-none text-slate-600 hover:text-slate-800 font-bold focus:outline-none cursor-pointer text-sm tracking-wide"
                  >
                    <option value="USD" className="bg-white text-slate-800 font-bold">USD ($)</option>
                    <option value="INR" className="bg-white text-slate-800 font-bold">INR (₹)</option>
                  </select>
                </div>

                {/* Portfolio value */}
                <Link to="/portfolio" className="flex flex-col items-end px-1 border-r border-slate-200 select-none shrink-0 pr-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-0.5">Portfolio</span>
                  <span className="text-sm font-black text-[#059669] leading-none">
                    {format(portfolio?.totalPositionsValue || 0)}
                  </span>
                </Link>

                {/* Cash balance */}
                <Link to="/wallet" className="flex flex-col items-end px-1 select-none shrink-0 pr-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-0.5">Cash</span>
                  <span className="text-sm font-black text-[#059669] leading-none">
                    {format(user.demoBalance)}
                  </span>
                </Link>

                {/* Deposit pill button */}
                <button
                  onClick={() => navigate('/wallet')}
                  className="bg-[#0072F5] hover:bg-[#0062D2] text-white font-extrabold text-sm py-2 px-5 rounded-lg shadow transition-all active:scale-[0.98] cursor-pointer select-none shrink-0"
                >
                  Deposit
                </button>

                {/* Toast alerts for faucet claim */}


                {/* Bell notification */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      setProfileMenuOpen(false);
                    }}
                    className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer relative select-none focus:outline-none"
                    title="Notifications"
                  >
                    <Bell size={16} />
                    {orders.length > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl z-50 text-xs font-bold text-slate-700">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                        <span className="text-sm font-extrabold text-slate-900">Activity & Trades</span>
                        <button
                          onClick={() => setNotificationsOpen(false)}
                          className="text-slate-400 hover:text-slate-600 font-extrabold"
                        >
                          Close
                        </button>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                        {orders.length === 0 ? (
                          <div className="py-6 text-center text-slate-400 font-semibold">
                            No recent activity
                          </div>
                        ) : (
                          orders.slice(0, 10).map((order) => {
                            const sideLabel = order.side === 'buy' ? 'Buy' : 'Sell';
                            const sideColor = order.side === 'buy' ? 'text-emerald-600 bg-emerald-50 border-emerald-200/60' : 'text-rose-600 bg-rose-50 border-rose-200/60';
                            
                            const statusLabel = order.status;
                            const statusColor = 
                              order.status === 'filled' ? 'bg-blue-50 text-blue-700 border-blue-200/60' :
                              order.status === 'open' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
                              'bg-slate-50 text-slate-500 border-slate-200/60';

                            const timeStr = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const dateStr = new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });

                            return (
                              <div
                                key={order.id}
                                className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all flex flex-col gap-1 text-left"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-black border ${sideColor}`}>
                                      {sideLabel}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border ${statusColor}`}>
                                      {statusLabel}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    {dateStr}, {timeStr}
                                  </span>
                                </div>

                                <div className="text-slate-800 font-extrabold text-[11px] leading-snug">
                                  {order.market?.title || 'Unknown Market'}
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-0.5">
                                  <span>Outcome: <strong className="text-slate-700 font-bold">{order.outcome?.name}</strong></span>
                                  <span>
                                    {order.quantity} shares @ {format(order.price)}
                                  </span>
                                </div>
                                <div className="text-right text-[10px] text-slate-700 font-extrabold mt-0.5">
                                  Total: {format(order.price * order.quantity)}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-1 p-0.5 rounded-full hover:bg-slate-100 transition-all focus:outline-none select-none"
                  >
                    <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center font-black text-white text-[11px] uppercase border border-white/20 shadow">
                      {user.name.charAt(0)}
                    </div>
                    <ChevronDown size={12} className="text-slate-500" />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl z-50 text-xs font-bold text-slate-700">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1.5 text-slate-500">
                        <p className="font-extrabold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[9px] capitalize tracking-wider font-semibold">{user.role}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/portfolio"
                        onClick={() => setProfileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        Portfolio holdings
                      </Link>
                      <Link
                        to="/wallet"
                        onClick={() => setProfileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        Wallet Transactions
                      </Link>
                      <Link
                        to="/leaderboard"
                        onClick={() => setProfileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        NAV Leaderboard
                      </Link>

                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileMenuOpen(false)}
                          className="block rounded-lg px-3 py-2 text-yellow-600 hover:bg-slate-50 transition-colors border-t border-slate-100 mt-1 pt-1.5"
                        >
                          Admin Console
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full text-left rounded-lg px-3 py-2 text-rose-600 hover:bg-slate-50 transition-colors border-t border-slate-100 mt-1.5 pt-2 cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Currency Switcher */}
                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs select-none">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-transparent border-none text-slate-500 font-bold focus:outline-none cursor-pointer text-[10px]"
                  >
                    <option value="USD" className="bg-white text-slate-700">USD ($)</option>
                    <option value="INR" className="bg-white text-slate-700">INR (₹)</option>
                  </select>
                </div>

                <Link to="/login" className="btn-secondary py-1.5 px-4 text-xs font-black rounded-lg">
                  Login
                </Link>
                <Link to="/register" className="btn-primary py-1.5 px-4 text-xs font-black rounded-lg">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-2">
            {token && user && (
              <button
                onClick={() => navigate('/wallet')}
                className="flex items-center gap-1 rounded bg-[#0072F5] px-2.5 py-1 text-[10px] font-bold text-white cursor-pointer"
              >
                Deposit
              </button>
            )}
            
            {/* Currency selector (mobile) */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded px-1.5 py-1 text-[10px]">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-transparent border-none text-slate-600 font-bold focus:outline-none cursor-pointer"
              >
                <option value="USD">USD</option>
                <option value="INR">INR</option>
              </select>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white/95 backdrop-blur-lg md:hidden">
          <div className="space-y-1 px-3 pb-4 pt-2.5 text-sm font-bold text-slate-600">
            <Link
              to="/markets"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-lg hover:bg-slate-100 hover:text-slate-900"
            >
              Markets
            </Link>

            {token && user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-3 rounded-lg hover:bg-slate-100 hover:text-slate-900"
                >
                  Dashboard
                </Link>
                <Link
                  to="/portfolio"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-3 rounded-lg hover:bg-slate-100 hover:text-slate-900"
                >
                  Portfolio
                </Link>
                <Link
                  to="/wallet"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-3 rounded-lg hover:bg-slate-100 hover:text-slate-900"
                >
                  Wallet (Balance: {format(user.demoBalance)})
                </Link>
                <Link
                  to="/leaderboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-3 rounded-lg hover:bg-slate-100 hover:text-slate-900"
                >
                  Leaderboard
                </Link>

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2.5 px-3 rounded-lg text-yellow-600 hover:bg-slate-100 border-t border-slate-100 mt-2"
                  >
                    Admin Panel
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-500/10 py-2.5 text-sm font-bold text-rose-600 border border-rose-500/20 mt-3"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-3 border-t border-slate-100 pt-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-secondary py-2 text-center text-xs"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary py-2 text-center text-xs"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
