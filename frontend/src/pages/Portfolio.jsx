import React, { useEffect } from 'react';
import { useTradeStore } from '../store/tradeStore.js';
import { useCurrencyStore } from '../store/currencyStore.js';
import PortfolioCard from '../components/PortfolioCard.jsx';
import { Wallet, History } from 'lucide-react';

export default function Portfolio() {
  const { portfolio, orders, fetchPortfolio, fetchOrders } = useTradeStore();
  const { format } = useCurrencyStore();

  useEffect(() => {
    fetchPortfolio();
    fetchOrders();
  }, [fetchPortfolio, fetchOrders]);

  const positions = portfolio?.positions || [];
  const historyOrders = orders.filter((o) => o.status !== 'open');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl font-black text-slate-900">
          My Portfolio holdings
        </h1>
        <p className="text-sm text-slate-500 font-semibold">Track your prediction assets, performance, and trading archives</p>
      </div>

      {/* Grid: Held Positions */}
      <div className="space-y-6 mb-12">
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3">
          <Wallet size={16} className="text-[#0072F5]" />
          <h2 className="text-lg font-bold text-slate-800">Asset Holdings</h2>
        </div>

        {positions.length === 0 ? (
          <div className="glass-panel p-16 text-center text-slate-500 border-slate-200 bg-white rounded-2xl text-sm italic shadow-sm">
            No active share holdings owned. Start trading on active markets to build your portfolio.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {positions.map((pos) => (
              <PortfolioCard key={pos.id} position={pos} />
            ))}
          </div>
        )}
      </div>

      {/* Order Logs History */}
      <div className="space-y-6">
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3">
          <History size={16} className="text-[#0072F5]" />
          <h2 className="text-lg font-bold text-slate-800">Trading Logs Archive</h2>
        </div>

        <div className="glass-panel border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-4">Market Title</th>
                  <th className="p-4">Side / Outcome</th>
                  <th className="p-4 text-right">Limit Price</th>
                  <th className="p-4 text-right">Quantity</th>
                  <th className="p-4 text-right">Status</th>
                  <th className="p-4 text-right">Execution Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                      No archive logs found
                    </td>
                  </tr>
                ) : (
                  historyOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-all text-slate-600">
                      <td className="p-4 font-bold text-slate-800 max-w-[280px] truncate" title={order.market.title}>
                        {order.market.title}
                      </td>
                      <td className="p-4">
                        <span className={`font-bold uppercase px-2 py-0.5 rounded text-[10px] ${
                          order.outcome.name === 'YES' || order.outcome.name === 'Up' ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#FCE8E6] text-[#C5221F]'
                        }`}>
                          {order.side} {order.outcome.name}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold text-slate-700">{format(order.price)}</td>
                      <td className="p-4 text-right text-slate-700">
                        {order.filledQuantity} / {order.quantity}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                          order.status === 'filled'
                            ? 'bg-emerald-500/10 text-[#137333] border border-emerald-500/20'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-right text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
