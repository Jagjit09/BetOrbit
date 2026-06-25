import React from 'react';
import { Link } from 'react-router-dom';
import { useCurrencyStore } from '../store/currencyStore.js';
import { TrendingUp, TrendingDown, Eye } from 'lucide-react';

export default function PortfolioCard({ position }) {
  const { format } = useCurrencyStore();
  const isProfit = position.profitLoss >= 0;

  return (
    <div className="bg-white border border-[#EBE7DF] rounded-xl p-5 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-all duration-300 hover:border-[#D8D3C9]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
            position.outcomeName === 'YES' || position.outcomeName === 'Up'
              ? 'bg-[#E2F2E9] text-[#137333] border border-emerald-100'
              : 'bg-[#FCE8E6] text-[#C5221F] border border-rose-100'
          }`}>
            {position.outcomeName} Shares
          </span>
          <span className="text-[10px] text-[#726D64] font-bold uppercase">
            {position.marketStatus}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-[#2D2A26] mb-4 line-clamp-2">
          {position.marketTitle}
        </h4>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 border-y border-[#EBE7DF]/60 py-3 mb-4 text-xs font-semibold">
        <div className="flex flex-col">
          <span className="text-[#726D64]">Shares Owned</span>
          <span className="text-[#2D2A26] font-bold text-sm mt-0.5">{position.quantity}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[#726D64]">Current Value</span>
          <span className="text-[#2D2A26] font-bold text-sm mt-0.5">{format(position.currentValue)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[#726D64]">Avg Buy Price</span>
          <span className="text-[#2D2A26] font-bold mt-0.5">
            {Math.round(position.averagePrice * 100)}¢ ({Math.round(position.averagePrice * 100)}%)
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[#726D64]">Current Price</span>
          <span className="text-[#2D2A26] font-bold mt-0.5">
            {Math.round(position.currentPrice * 100)}¢ ({Math.round(position.currentPrice * 100)}%)
          </span>
        </div>
      </div>

      {/* P&L and Trade CTA */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#726D64] font-medium">Return (P&L)</span>
          <span className={`text-sm font-bold flex items-center gap-1 mt-0.5 ${
            isProfit ? 'text-[#137333]' : 'text-[#C5221F]'
          }`}>
            {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{isProfit ? '+' : ''}{format(position.profitLoss)} ({position.profitLossPercent.toFixed(1)}%)</span>
          </span>
        </div>

        <Link
          to={`/markets/${position.marketId}`}
          className="flex items-center gap-1 rounded-lg bg-[#FAF8F5] border border-[#EBE7DF] text-[#726D64] font-bold px-3 py-1.5 text-xs hover:bg-[#EFECE6] hover:text-[#2D2A26] transition-all hover:scale-[1.02]"
        >
          <Eye size={12} />
          View Trade
        </Link>
      </div>
    </div>
  );
}
