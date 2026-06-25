import React, { useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import GlobalBitcoinChart from './GlobalBitcoinChart.jsx';
import BtcRunningChart from './BtcRunningChart.jsx';
import { useCurrencyStore } from '../store/currencyStore.js';
import { useMarketStore } from '../store/marketStore.js';

export default function PriceChart({ chartData, isRapid = false, basePrice = 0, livePrice = 0, isResolvedRapid = false, onGoToLive = null }) {
  const { convert, getSymbol, currency } = useCurrencyStore();
  const { currentMarket } = useMarketStore();

  // Format dates for X-Axis ticks
  const formatXAxis = (tickItem) => {
    try {
      const date = new Date(tickItem);
      const isToday = new Date().toDateString() === date.toDateString();
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return tickItem;
    }
  };

  // Convert prices for standard markets, keep raw USD values for global BTC ticker
  const processedData = (chartData || []).map((d) => ({
    time: d.time,
    price: isRapid ? d.price : convert(d.price),
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const formattedPrice = isRapid
        ? `$${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        : `${getSymbol()}${payload[0].value.toFixed(2)}`;

      return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl">
          <p className="font-bold text-slate-500">
            {new Date(data.time).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
          <p className="mt-1 text-sm font-black text-yes">
            Price: {formattedPrice}
          </p>
        </div>
      );
    }
    return null;
  };

  // Y-axis details
  const yDomain = isRapid
    ? ['auto', 'auto'] // Auto-scale around BTC price index (e.g. 62590 to 62600)
    : [0, convert(1.0)]; // probability 0 to 1 USD or 0 to 83 INR

  const formatYAxis = (val) => {
    if (isRapid) {
      return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    return `${getSymbol()}${val.toFixed(2)}`;
  };

  const getChartDataPoints = () => {
    let points = [...processedData];

    if (points.length <= 1) {
      points = [];
      const start = currentMarket?.createdAt ? new Date(currentMarket.createdAt).getTime() : Date.now() - 5 * 60 * 1000;
      const end = Date.now();
      
      if (isRapid) {
        // Generate a point every 15 seconds for the 5-minute round (max 20 points)
        const interval = 15 * 1000;
        let tempPrice = basePrice;
        for (let t = start; t <= end; t += interval) {
          points.push({
            time: new Date(t).toISOString(),
            price: tempPrice,
          });
          tempPrice += (Math.random() - 0.5) * 12;
        }
      } else {
        // Standard markets: just two endpoints to draw a flat line
        points.push({
          time: new Date(start).toISOString(),
          price: convert(0.50),
        });
        points.push({
          time: new Date(end).toISOString(),
          price: convert(0.50),
        });
      }
    }
    
    // Always append the latest live price tick if rapid
    if (isRapid && livePrice) {
      points.push({
        time: new Date().toISOString(),
        price: livePrice,
      });
    }

    return points;
  };



  const finalData = getChartDataPoints();

  if (isRapid) {
    const isResolved = currentMarket?.status !== 'open';
    const winningOutcome = currentMarket?.marketResolution?.winningOutcome?.name || null;
    const marketCreatedAt = currentMarket?.createdAt ? new Date(currentMarket.createdAt).getTime() : null;
    const marketEndTime = currentMarket?.endTime ? new Date(currentMarket.endTime).getTime() : null;

    return (
      <BtcRunningChart
        isResolved={isResolved}
        winningOutcome={winningOutcome}
        marketCreatedAt={marketCreatedAt}
        marketEndTime={marketEndTime}
        basePrice={basePrice}
        onGoToLive={onGoToLive}
      />
    );
  }

  return (
    <div className="glass-panel p-4 h-[350px] flex flex-col justify-between border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            {isRapid ? 'Global Ticker Index' : 'Price History (YES)'}
          </h3>
          <p className="text-[10px] text-slate-500 font-semibold">
            {isRapid ? 'Real-time global spot price feed' : 'Probability trend line of event outcome'}
          </p>
        </div>

        {isResolvedRapid && onGoToLive && (
          <button
            onClick={onGoToLive}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-lg shadow-sm hover:shadow transition-all active:scale-[0.98] cursor-pointer"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
            Go To Live Market
          </button>
        )}
      </div>

      <div className="flex-grow w-full text-[10px] font-bold">
        {isRapid ? (
          <GlobalBitcoinChart height={270} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={finalData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isRapid ? '#f59e0b' : '#10b981'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isRapid ? '#f59e0b' : '#10b981'} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              
              <XAxis
                dataKey="time"
                tickFormatter={formatXAxis}
                stroke="rgba(0,0,0,0.08)"
                tick={{ fill: '#64748b', fontSize: 9 }}
                dy={10}
              />
              <YAxis
                domain={yDomain}
                tickFormatter={formatYAxis}
                stroke="rgba(0,0,0,0.08)"
                tick={{ fill: '#64748b', fontSize: 9 }}
                dx={-5}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Rapid market target threshold line (Price To Beat) */}
              {isRapid && (
                <ReferenceLine
                  y={basePrice}
                  stroke="#6344cc"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  label={{
                    value: 'Target',
                    position: 'right',
                    fill: '#6344cc',
                    fontSize: 9,
                    fontWeight: 'bold',
                  }}
                />
              )}

              <Area
                type="monotone"
                dataKey="price"
                stroke={isRapid ? '#f59e0b' : '#10b981'}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
                dot={false}
                activeDot={{ r: 4.5, stroke: '#ffffff', strokeWidth: 1.5, fill: isRapid ? '#f59e0b' : '#10b981' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
