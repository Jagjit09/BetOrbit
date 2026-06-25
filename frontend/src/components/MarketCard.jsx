import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrencyStore } from '../store/currencyStore.js';
import { Bookmark, Gift } from 'lucide-react';

export default function MarketCard({ market }) {
  const navigate = useNavigate();
  const { format } = useCurrencyStore();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!market.endTime || market.status !== 'open') return;

    const updateTimer = () => {
      const difference = new Date(market.endTime) - new Date();
      if (difference <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);

      if (days > 0) {
        setTimeLeft(`${days}d left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h left`);
      } else {
        setTimeLeft(`${minutes}m left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [market.endTime, market.status]);

  // Volume format helper
  const getVolumeDisplay = () => {
    const mockVolume = market.isRapid ? 25000000 : (market.title.toLowerCase().includes('150k') ? 27000000 : 8200000);
    if (mockVolume >= 1000000) {
      return `$${(mockVolume / 1000000).toFixed(0)}M`;
    }
    return format(mockVolume, 0);
  };

  const getOutcomeStats = (outcomes) => {
    const yesOut = outcomes?.find((o) => o.name === 'YES' || o.name === 'Up');
    const noOut = outcomes?.find((o) => o.name === 'NO' || o.name === 'Down');
    const yesPrice = yesOut?.currentPrice || 0.50;
    const noPrice = noOut?.currentPrice || 0.50;
    const yesPercent = Math.round(yesPrice * 100);
    const noPercent = Math.round(noPrice * 100);

    return { yesPrice, noPrice, yesPercent, noPercent, yesId: yesOut?.id, noId: noOut?.id };
  };

  // Custom Logo Renderer
  const renderCoinLogo = (title, category) => {
    const t = title.toLowerCase();
    const c = category.toLowerCase();

    if (t.includes('bitcoin') || t.includes('btc')) {
      return (
        <div className="h-6 w-6 rounded-md bg-[#F7931A] flex items-center justify-center shrink-0 shadow-sm text-white text-xs font-black select-none">
          ₿
        </div>
      );
    }
    if (t.includes('ethereum') || t.includes('eth')) {
      return (
        <div className="h-6 w-6 rounded-md bg-[#4E77F7] flex items-center justify-center shrink-0 shadow-sm select-none">
          <svg viewBox="0 0 784 1277" className="h-3.5 w-3.5 text-white fill-current">
            <path d="M392 0L383.5 29v822.4l8.5 8.6 392-231.7L392 0z" fillOpacity=".95"/>
            <path d="M392 0L0 628.3l392 231.7V0z" fillOpacity=".75"/>
            <path d="M392 860L387 865v407l5 5 392-552-397 135z" fillOpacity=".95"/>
            <path d="M392 1277v-417L0 720l392 557z" fillOpacity=".75"/>
          </svg>
        </div>
      );
    }
    if (t.includes('solana') || t.includes('sol')) {
      return (
        <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-[#9945FF] to-[#14F195] flex items-center justify-center shrink-0 shadow-sm select-none">
          <svg viewBox="0 0 32 32" className="h-3.5 w-3.5 text-white fill-current">
            <path d="M25.7 8.3L27.6 10H6.3l-1.9-1.7h21.3zM6.3 22h21.3l1.9 1.7H6.3l-1.9-1.7zm19.4-6.8l1.9 1.7H6.3l-1.9-1.7h21.3z"/>
          </svg>
        </div>
      );
    }
    if (t.includes('xrp')) {
      return (
        <div className="h-6 w-6 rounded-md bg-[#00aae4] flex items-center justify-center shrink-0 shadow-sm select-none">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white fill-current">
            <path d="M1.3 2L12 12.7 22.7 2h-3.3L12 9.4 4.6 2H1.3zm0 20L12 11.3 22.7 22h-3.3L12 14.6 4.6 22H1.3z"/>
          </svg>
        </div>
      );
    }

    // Category mappings
    switch (c) {
      case 'iran':
        return (
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-emerald-600 via-stone-300 to-red-600 flex items-center justify-center shrink-0 border border-slate-300 shadow-sm text-white text-[8px] font-black select-none">
            🇮🇷
          </div>
        );
      case 'sports':
        return (
          <div className="h-6 w-6 rounded-md bg-[#E2F2E9] flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm text-emerald-800 text-xs select-none">
            ⚽
          </div>
        );
      case 'politics':
        return (
          <div className="h-6 w-6 rounded-md bg-[#EDEBFC] flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm text-indigo-850 text-xs select-none">
            🏛️
          </div>
        );
      default:
        return (
          <div className="h-6 w-6 rounded-md bg-[#EFECE6] flex items-center justify-center shrink-0 border border-[#D8D3C9] shadow-sm text-slate-700 text-xs select-none">
            🔮
          </div>
        );
    }
  };

  // Get display name for the footer label
  const getFooterLabel = (title, category) => {
    const t = title.toLowerCase();
    if (t.includes('bitcoin') || t.includes('btc')) return 'Bitcoin';
    if (t.includes('ethereum') || t.includes('eth')) return 'Ethereum';
    if (t.includes('solana') || t.includes('sol')) return 'Solana';
    if (t.includes('xrp')) return 'XRP';
    return category;
  };

  // Render SVG circular chance ring
  const renderChanceCircle = (percent, isUpdown) => {
    const radius = 14;
    const strokeWidth = 2.5;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    // Soft elegant colors for light mode
    const arcColor = isUpdown ? 'text-[#0072F5]' : 'text-[#137333]';

    return (
      <div className="flex items-center justify-center shrink-0 ml-3 bg-[#FAF8F5] p-0.5 rounded-lg border border-[#EBE7DF]">
        <div className="relative w-10 h-10 flex items-center justify-center">
          <svg className="w-10 h-10 transform -rotate-90">
            <circle
              cx="20"
              cy="20"
              r={radius}
              className="text-[#EFECE6]"
              strokeWidth={strokeWidth}
              fill="transparent"
              stroke="currentColor"
            />
            <circle
              cx="20"
              cy="20"
              r={radius}
              className={arcColor}
              strokeWidth={strokeWidth}
              fill="transparent"
              stroke="currentColor"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-[9.5px] font-black text-[#2D2A26]">{percent === 0 ? '<1%' : `${percent}%`}</span>
            <span className="text-[6px] font-black text-[#726D64] mt-0.2 uppercase tracking-wide">
              {isUpdown ? 'Up' : 'Yes'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // LAYOUT 1: MULTI-OUTCOME ROW CARD
  // ----------------------------------------------------
  if (market.isGroup) {
    const footerLabel = getFooterLabel(market.title, market.category);
    const hasVolume = market.isRapid || market.title.toLowerCase().includes('150k') || market.title.toLowerCase().includes('traffic');
    
    return (
      <div className="rounded-xl border border-[#EBE7DF] bg-[#FFFFFF] p-4 flex flex-col justify-between h-[235px] relative hover:border-[#D8D3C9] hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:scale-[0.995] transition-all duration-300 ease-out select-none">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              {renderCoinLogo(market.title, market.category)}
              <span className="text-[10.5px] font-bold text-[#726D64] capitalize">{market.category}</span>
            </div>
          </div>

          {/* Title */}
          <Link to={`/markets/${market.id}`} className="block">
            <h3 className="text-sm sm:text-[14.5px] font-bold text-[#2D2A26] leading-snug hover:text-blue-600 transition-colors h-11 overflow-hidden line-clamp-2 mb-2">
              {market.title}
            </h3>
          </Link>

          {/* Rows of sub-markets */}
          <div className="space-y-1 overflow-hidden h-[96px]">
            {market.rows.slice(0, 2).map((row) => {
              const rowStats = getOutcomeStats(row.outcomes);
              return (
                <div
                  key={row.id}
                  className="flex items-center justify-between bg-[#FAF8F5] border border-[#EBE7DF]/80 rounded-lg px-2.5 py-1.5 hover:bg-[#F3F1EC] transition-all"
                >
                  <span className="text-[13px] font-semibold text-[#514D46] truncate max-w-[120px]">{row.subTitle}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black text-[#2D2A26] min-w-[28px] text-right">
                      {rowStats.yesPercent === 0 ? '<1%' : `${rowStats.yesPercent}%`}
                    </span>
                    
                    {/* Action buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(`/markets/${row.id}?side=buy&outcome=YES`)}
                        className="rounded-md bg-[#E2F2E9] hover:bg-[#10B981] text-[#137333] hover:text-white font-extrabold text-xs px-4 py-1.5 transition-all cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => navigate(`/markets/${row.id}?side=buy&outcome=NO`)}
                        className="rounded-md bg-[#FCE8E6] hover:bg-[#EF4444] text-[#C5221F] hover:text-white font-extrabold text-xs px-4 py-1.5 transition-all cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[9.5px] text-[#726D64] pt-2 border-t border-[#EBE7DF] font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
              LIVE
            </span>
            {hasVolume && (
              <>
                <span>•</span>
                <span>{getVolumeDisplay()} Vol.</span>
              </>
            )}
            <span>•</span>
            <span className="capitalize">{footerLabel}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {(market.title.toLowerCase().includes('hit') || market.title.toLowerCase().includes('above')) && (
              <button className="text-[#8C867A] hover:text-[#2D2A26] transition-colors cursor-pointer">
                <Gift size={12} />
              </button>
            )}
            <button className="text-[#8C867A] hover:text-[#2D2A26] transition-colors cursor-pointer">
              <Bookmark size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // LAYOUT 2: STANDARD YES/NO BINARY CARD
  // ----------------------------------------------------
  const stats = getOutcomeStats(market.outcomes);
  const isUpdown = market.isRapid || market.title.toLowerCase().includes('up or down') || market.outcomes?.some(o => o.name === 'Up' || o.name === 'Down');
  const footerLabel = getFooterLabel(market.title, market.category);
  const hasVolume = market.isRapid || market.title.toLowerCase().includes('150k') || market.title.toLowerCase().includes('traffic');

  return (
    <div className="rounded-xl border border-[#EBE7DF] bg-[#FFFFFF] p-4 flex flex-col justify-between h-[235px] relative hover:border-[#D8D3C9] hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:scale-[0.995] transition-all duration-300 ease-out select-none">
      <div>
        {/* Top Header Card */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            {renderCoinLogo(market.title, market.category)}
            <span className="text-[10.5px] font-bold text-[#726D64] capitalize">{market.category}</span>
          </div>
          
          {/* Circular Percentage chance on Right */}
          {renderChanceCircle(stats.yesPercent, isUpdown)}
        </div>

        {/* Title */}
        <Link to={`/markets/${market.id}`} className="block">
          <h3 className="text-sm sm:text-[14.5px] font-bold text-[#2D2A26] leading-snug hover:text-blue-600 transition-colors h-[54px] overflow-hidden line-clamp-3">
            {market.title}
          </h3>
        </Link>
      </div>

      <div className="space-y-3">
        {/* Big wide action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate(`/markets/${market.id}?side=buy&outcome=${isUpdown ? 'Up' : 'YES'}`)}
            className="w-full rounded-lg bg-[#E2F2E9] hover:bg-[#10B981] text-[#137333] hover:text-white py-2.5 text-sm font-black transition-all cursor-pointer text-center"
          >
            {isUpdown ? 'Up' : 'Yes'}
          </button>
          <button
            onClick={() => navigate(`/markets/${market.id}?side=buy&outcome=${isUpdown ? 'Down' : 'NO'}`)}
            className="w-full rounded-lg bg-[#FCE8E6] hover:bg-[#EF4444] text-[#C5221F] hover:text-white py-2.5 text-sm font-black transition-all cursor-pointer text-center"
          >
            {isUpdown ? 'Down' : 'No'}
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[9.5px] text-[#726D64] pt-2 border-t border-[#EBE7DF] font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse inline-block"></span>
              LIVE
            </span>
            {hasVolume && (
              <>
                <span>•</span>
                <span>{getVolumeDisplay()} Vol.</span>
              </>
            )}
            {footerLabel && (
              <>
                <span>•</span>
                <span className="capitalize">{footerLabel}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(market.title.toLowerCase().includes('hit') || market.title.toLowerCase().includes('daily') || market.title.toLowerCase().includes('above')) && (
              <button className="text-[#8C867A] hover:text-[#2D2A26] transition-colors cursor-pointer">
                <Gift size={12} />
              </button>
            )}
            <button className="text-[#8C867A] hover:text-[#2D2A26] transition-colors cursor-pointer">
              <Bookmark size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
