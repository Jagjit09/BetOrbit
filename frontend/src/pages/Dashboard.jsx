import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTradeStore } from '../store/tradeStore.js';
import { useAuthStore } from '../store/authStore.js';
import { useCurrencyStore } from '../store/currencyStore.js';
import { useMarketStore } from '../store/marketStore.js';
import PortfolioCard from '../components/PortfolioCard.jsx';
import MarketCard from '../components/MarketCard.jsx';
import ThreeDashboard from '../three/ThreeDashboard.jsx';
import { Coins, AlertTriangle, ArrowRight, ClipboardList, Wallet2, XCircle, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { portfolio, orders, fetchPortfolio, fetchOrders, cancelOrder } = useTradeStore();
  const { markets, fetchMarkets } = useMarketStore();
  const { format } = useCurrencyStore();

  useEffect(() => {
    fetchPortfolio();
    fetchOrders();
    fetchMarkets({ limit: 4 });
  }, [fetchPortfolio, fetchOrders, fetchMarkets]);

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this pending order? Locked funds will be returned.')) {
      try {
        await cancelOrder(orderId);
      } catch (err) {
        alert(err.message || 'Error cancelling order');
      }
    }
  };

  const openPositions = portfolio?.positions || [];
  const openOrders = orders.filter((o) => o.status === 'open');

  const nav = portfolio?.netAssetValue || user?.demoBalance || 0;
  const balance = portfolio?.demoBalance || user?.demoBalance || 0;
  const profitLoss = portfolio?.totalProfitLoss || 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Greeting */}
      <div className="border-b border-[#EBE7DF] pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2D2A26]">
            Welcome back, <span className="text-[#0072F5]">{user?.name}</span>
          </h1>
          <p className="text-sm text-[#726D64] font-semibold">Manage your demo balance, positions, and active orders</p>
        </div>
 
        {/* Balance Summaries Cards */}
        <div className="flex flex-wrap gap-4">
          {/* NAV Card */}
          <div className="rounded-xl border border-[#EBE7DF] bg-white p-4 min-w-[140px] text-xs font-semibold shadow-sm">
            <span className="text-[#726D64]">Net Asset Value (NAV)</span>
            <span className="block text-lg font-black text-[#2D2A26] mt-1">
              {format(nav)}
            </span>
          </div>
 
          {/* Cash Balance Card */}
          <div className="rounded-xl border border-[#EBE7DF] bg-white p-4 min-w-[140px] text-xs font-semibold shadow-sm">
            <span className="text-[#726D64]">Available Cash</span>
            <span className="block text-lg font-black text-[#137333] mt-1 flex items-center gap-1.5">
              <Coins size={16} className="text-yellow-600 animate-pulse" />
              {format(balance)}
            </span>
          </div>
 
          {/* Returns Card */}
          <div className="rounded-xl border border-[#EBE7DF] bg-white p-4 min-w-[140px] text-xs font-semibold shadow-sm">
            <span className="text-[#726D64]">Total Profit / Loss</span>
            <span className={`block text-lg font-black mt-1 ${
              profitLoss >= 0 ? 'text-[#137333]' : 'text-[#C5221F]'
            }`}>
              {profitLoss >= 0 ? '+' : ''}
              {format(profitLoss)}
            </span>
          </div>
        </div>
      </div>

      {/* 3D Visualizer Dashboard Panel */}
      <div className="mb-8">
        <ThreeDashboard />
      </div>
 
      {/* Grid: Positions and Active orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column (Markets + Positions) */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Hot / Trending Markets */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#EBE7DF] pb-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={16} className="text-[#0072F5]" />
                <h2 className="text-lg font-bold text-[#2D2A26]">Trending Prediction Markets</h2>
              </div>
              <Link to="/markets" className="text-xs font-bold text-[#0072F5] hover:text-[#0062D2] flex items-center gap-0.5">
                Explore All
                <ArrowRight size={12} />
              </Link>
            </div>
 
            {markets.length === 0 ? (
              <div className="glass-panel p-12 text-center text-[#726D64] border-[#EBE7DF] bg-white rounded-2xl text-sm italic shadow-sm">
                No active markets available at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {markets.slice(0, 4).map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            )}
          </div>

          {/* Active Positions holdings */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-1.5">
                <Wallet2 size={16} className="text-[#0072F5]" />
                <h2 className="text-lg font-bold text-slate-800">Active Positions</h2>
              </div>
              <Link to="/portfolio" className="text-xs font-bold text-[#0072F5] hover:text-[#0062D2] flex items-center gap-0.5">
                View All
                <ArrowRight size={12} />
              </Link>
            </div>

            {openPositions.length === 0 ? (
              <div className="glass-panel p-12 text-center text-slate-500 border-slate-200 bg-white rounded-2xl text-sm italic shadow-sm">
                You do not own any shares yet. Make your first prediction to get started!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {openPositions.slice(0, 4).map((pos) => (
                  <PortfolioCard key={pos.id} position={pos} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Open Orders Slip */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-1.5">
              <ClipboardList size={16} className="text-[#0072F5]" />
              <h2 className="text-lg font-bold text-slate-800">Open Orders</h2>
            </div>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600 font-bold">
              {openOrders.length}
            </span>
          </div>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {openOrders.length === 0 ? (
              <div className="glass-panel p-8 text-center text-slate-400 border-slate-200 bg-white rounded-2xl text-xs italic shadow-sm">
                No active pending orders.
              </div>
            ) : (
              openOrders.map((order) => (
                <div
                  key={order.id}
                  className="glass-panel p-4 border-slate-200 bg-white shadow-sm relative overflow-hidden group flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        order.outcome.name === 'YES' || order.outcome.name === 'Up' ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#FCE8E6] text-[#C5221F]'
                      }`}>
                        {order.side} {order.outcome.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Limit</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mb-3">
                      {order.market.title}
                    </h4>
                  </div>

                  {/* Order Details */}
                  <div className="flex items-center justify-between text-xs font-semibold border-t border-[#EBE7DF]/60 pt-3 mt-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#726D64]">Price / Share</span>
                      <span className="font-bold text-[#2D2A26] mt-0.5">
                        {Math.round(order.price * 100)}¢ ({Math.round(order.price * 100)}%)
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#726D64]">Filled / Total</span>
                      <span className="font-bold text-[#2D2A26] mt-0.5">
                        {order.filledQuantity} / {order.quantity}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 p-2 transition-all hover:scale-[1.02] cursor-pointer"
                      title="Cancel Order"
                    >
                      <XCircle size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
