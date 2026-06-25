import React, { useState } from 'react';

export default function OrderBook({ orderBook, currentPrice }) {
  const [selectedOutcome, setSelectedOutcome] = useState('YES');

  const bookData = orderBook?.[selectedOutcome] || { bids: [], asks: [] };
  const bids = bookData.bids || [];
  const asks = bookData.asks || [];

  // Calculate cumulative depth
  let bidCumulative = 0;
  const bidsWithDepth = bids.map((b) => {
    bidCumulative += b.quantity;
    return { ...b, cumulative: bidCumulative };
  });

  let askCumulative = 0;
  const asksWithDepth = [...asks].map((a) => {
    askCumulative += a.quantity;
    return { ...a, cumulative: askCumulative };
  });

  // Calculate total depth for bar percentages
  const maxCumulative = Math.max(
    bidCumulative,
    askCumulative,
    1.0
  );

  return (
    <div className="glass-panel p-4 flex flex-col h-[400px]">
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Order Book</h3>
        <div className="flex rounded-lg bg-slate-800 p-0.5">
          <button
            onClick={() => setSelectedOutcome('YES')}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
              selectedOutcome === 'YES'
                ? 'bg-yes text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            YES
          </button>
          <button
            onClick={() => setSelectedOutcome('NO')}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
              selectedOutcome === 'NO'
                ? 'bg-no text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            NO
          </button>
        </div>
      </div>

      {/* Book Columns Header */}
      <div className="grid grid-cols-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Depth</span>
      </div>

      {/* Asks (Sells) - Rendered from highest to lowest (so cheapest is at the bottom, closest to spread) */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-end space-y-0.5 text-xs select-none min-h-[120px]">
        {asksWithDepth.length === 0 ? (
          <div className="text-center text-slate-500 py-4 text-xs italic">No asks open</div>
        ) : (
          [...asksWithDepth].reverse().slice(-6).map((ask, idx) => {
            const pct = (ask.cumulative / maxCumulative) * 100;
            return (
              <div
                key={`ask-${idx}`}
                className="grid grid-cols-3 px-2 py-1 hover:bg-white/5 transition-all relative overflow-hidden rounded"
              >
                {/* Visual bar depth indicator */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-no-bg opacity-30 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                ></div>
                <span className="text-no font-bold relative z-10">{ask.price.toFixed(2)}</span>
                <span className="text-right font-medium relative z-10 text-slate-300">{ask.quantity}</span>
                <span className="text-right font-medium relative z-10 text-slate-400">{ask.cumulative}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Mid Market Spot Spread price */}
      <div className="my-2 border-y border-white/5 py-2 px-2 flex justify-between items-center bg-slate-900/40 rounded">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Spot Price</span>
        <span className="text-sm font-black text-slate-100 animate-pulse">
          {currentPrice?.toFixed(2)} Coins
        </span>
      </div>

      {/* Bids (Buys) - Rendered from highest to lowest (so highest bid is at the top, closest to spread) */}
      <div className="flex-1 overflow-y-auto space-y-0.5 text-xs select-none min-h-[120px]">
        {bidsWithDepth.length === 0 ? (
          <div className="text-center text-slate-500 py-4 text-xs italic">No bids open</div>
        ) : (
          bidsWithDepth.slice(0, 6).map((bid, idx) => {
            const pct = (bid.cumulative / maxCumulative) * 100;
            return (
              <div
                key={`bid-${idx}`}
                className="grid grid-cols-3 px-2 py-1 hover:bg-white/5 transition-all relative overflow-hidden rounded"
              >
                {/* Visual bar depth indicator */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-yes-bg opacity-30 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                ></div>
                <span className="text-yes font-bold relative z-10">{bid.price.toFixed(2)}</span>
                <span className="text-right font-medium relative z-10 text-slate-300">{bid.quantity}</span>
                <span className="text-right font-medium relative z-10 text-slate-400">{bid.cumulative}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
