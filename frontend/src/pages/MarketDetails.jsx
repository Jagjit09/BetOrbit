import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { io as ioClient } from 'socket.io-client';
import { useMarketStore } from '../store/marketStore.js';
import { useTradeStore } from '../store/tradeStore.js';
import { useAuthStore } from '../store/authStore.js';
import { useCurrencyStore } from '../store/currencyStore.js';
import PriceChart from '../components/PriceChart.jsx';
import BtcRunningChart from '../components/BtcRunningChart.jsx';
import OrderBook from '../components/OrderBook.jsx';
import TradePanel from '../components/TradePanel.jsx';
import axiosClient from '../api/axiosClient.js';
import { ArrowLeft, Clock, MessageSquare, Send, Globe, ChevronRight, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function MarketDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { format, currency } = useCurrencyStore();
  const {
    currentMarket,
    orderBook,
    recentTrades,
    chartData,
    comments,
    fetchMarketDetails,
    fetchOrderBook,
    fetchTrades,
    fetchChartData,
    fetchComments,
    postComment,
    updateRapidPrices,
  } = useMarketStore();
  const { fetchPortfolio } = useTradeStore();

  const [activeMarketId, setActiveMarketId] = useState(id);
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState('chart'); // 'chart', 'book', 'trades', 'comments'
  const [timeLeft, setTimeLeft] = useState('');
  const [pastRounds, setPastRounds] = useState([]);

  // Sync if URL param ID changes from external navigation (e.g. back/forward button)
  useEffect(() => {
    setActiveMarketId(id);
  }, [id]);

  const handleTransitionToMarket = (marketId) => {
    window.history.pushState(null, '', `/markets/${marketId}`);
    setActiveMarketId(marketId);
  };

  const currentMarketRef = useRef(currentMarket);
  useEffect(() => {
    currentMarketRef.current = currentMarket;
  }, [currentMarket]);

  // Parse URL queries for quick outcome clicks
  const searchParams = new URLSearchParams(location.search);
  const initialSide = searchParams.get('side') || 'buy';
  const initialOutcome = searchParams.get('outcome') || 'YES';

  const fetchRecentRapidRounds = async () => {
    try {
      const res = await axiosClient.get('/markets', {
        params: { isRapid: 'true', limit: 12 }
      });
      const mapped = res.data.markets.map(m => {
        const winningOutcome = m.marketResolution?.winningOutcome?.name || null;
        return {
          id: m.id,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          outcome: winningOutcome,
          status: m.status,
        };
      });
      setPastRounds(mapped);
    } catch (err) {
      console.error('Error fetching rapid rounds:', err);
    }
  };

  const handleGoToLive = async () => {
    try {
      const res = await axiosClient.get('/markets', {
        params: { isRapid: 'true', status: 'open', limit: 1 }
      });
      if (res.data.markets && res.data.markets.length > 0) {
        handleTransitionToMarket(res.data.markets[0].id);
      } else {
        alert("No active rapid market found at the moment.");
      }
    } catch (err) {
      console.error('Error going to live market:', err);
    }
  };

  // Socket connection instance
  useEffect(() => {
    const socket = ioClient('http://localhost:5000');

    socket.emit('joinMarket', activeMarketId);

    socket.on('orderBookUpdate', ({ marketId }) => {
      if (marketId === activeMarketId) fetchOrderBook(activeMarketId);
    });

    socket.on('tradesUpdate', ({ marketId }) => {
      if (marketId === activeMarketId) {
        fetchTrades(activeMarketId);
        fetchChartData(activeMarketId);
        fetchMarketDetails(activeMarketId);
        fetchPortfolio();
      }
    });

    socket.on('newComment', ({ comment }) => {
      if (comment.marketId === activeMarketId) fetchComments(activeMarketId);
    });

    socket.on('countdownTick', ({ marketId, remainingSeconds }) => {
      if (marketId === activeMarketId) {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        setTimeLeft(
          `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
        );
      }
    });

    socket.on('marketResolved', ({ marketId }) => {
      if (marketId === activeMarketId) {
        fetchMarketDetails(activeMarketId);
        fetchPortfolio();
        fetchRecentRapidRounds();
      }
    });

    socket.on('newRapidMarket', ({ marketId }) => {
      const current = currentMarketRef.current;
      if (current?.isRapid && current?.status === 'open' && marketId !== activeMarketId) {
        handleTransitionToMarket(marketId);
      } else {
        fetchRecentRapidRounds();
      }
    });

    socket.on('outcomePriceUpdate', ({ marketId, upPrice, downPrice }) => {
      if (marketId === activeMarketId) {
        updateRapidPrices(upPrice, downPrice);
      }
    });

    return () => {
      socket.emit('leaveMarket', activeMarketId);
      socket.disconnect();
    };
  }, [activeMarketId]);

  // Initial API loads
  useEffect(() => {
    fetchMarketDetails(activeMarketId);
    fetchOrderBook(activeMarketId);
    fetchTrades(activeMarketId);
    fetchChartData(activeMarketId);
    fetchComments(activeMarketId);
    if (token) {
      fetchPortfolio();
    }
    fetchRecentRapidRounds();
  }, [activeMarketId, token]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await postComment(activeMarketId, commentText);
      setCommentText('');
    } catch (err) {
      alert(err.message || 'Error posting comment');
    }
  };

  if (!currentMarket) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F3F5F9]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-[#0072F5]"></div>
      </div>
    );
  }

  const yesOutcome = currentMarket.outcomes?.find((o) => o.name === 'YES' || o.name === 'Up');
  const noOutcome = currentMarket.outcomes?.find((o) => o.name === 'NO' || o.name === 'Down');

  const yesPercent = Math.round((yesOutcome?.currentPrice || 0.50) * 100);

  // Rapid Market calculation parameters
  const basePrice = currentMarket.basePrice || 0;
  const isBtcBet = currentMarket.title.toLowerCase().includes('btc') || currentMarket.title.toLowerCase().includes('bitcoin');



  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center gap-2 mb-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <Link to="/markets" className="flex items-center gap-1 hover:text-[#0072F5] text-slate-500 transition-colors">
          <ArrowLeft size={14} />
          Markets
        </Link>
        <ChevronRight size={12} className="text-slate-400" />
        <span className="text-slate-700 truncate max-w-[200px] font-bold">{currentMarket.title}</span>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 1: STANDARD EVENT DETAILS HEADER */}
      {/* ---------------------------------------------------- */}
      {!currentMarket.isRapid && (
        <div className="glass-panel p-6 border-slate-200 bg-white mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider border border-blue-200 bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full">
                  {currentMarket.category}
                </span>
                {currentMarket.status !== 'open' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 px-2.5 py-0.5 rounded-full">
                    Resolved
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {currentMarket.title}
              </h1>
              <p className="text-xs text-slate-500 max-w-4xl leading-relaxed font-semibold">
                {currentMarket.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:w-80 shrink-0 border-t border-slate-200 lg:border-t-0 lg:border-l lg:pl-6 pt-4 lg:pt-0 text-xs font-semibold">
              <div>
                <span className="text-slate-505">Resolution Source</span>
                <div className="flex items-center gap-1 text-slate-850 mt-1 font-bold">
                  <Globe size={13} className="text-[#0072F5]" />
                  <span className="truncate max-w-[120px] text-slate-700" title={currentMarket.resolutionSource}>
                    {currentMarket.resolutionSource}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-slate-505">Expiration Date</span>
                <span className="block text-slate-800 mt-1 font-bold">
                  {new Date(currentMarket.endTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 2: MAIN TERMINAL GRID (CHARTS, SLIPS) */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side (Charts, Order books, Comments) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Chart container */}
          <div className="relative">
            {isBtcBet ? (
              <BtcRunningChart
                title={currentMarket.title}
                isResolved={currentMarket.status !== 'open'}
                winningOutcome={currentMarket.marketResolution?.winningOutcome?.name}
                marketCreatedAt={new Date(currentMarket.createdAt).getTime()}
                marketEndTime={new Date(currentMarket.endTime).getTime()}
                basePrice={basePrice || 62591.71}
                onGoToLive={handleGoToLive}
              />
            ) : (
              <PriceChart
                chartData={chartData}
                isRapid={currentMarket.isRapid}
                basePrice={basePrice}
                livePrice={0}
                isResolvedRapid={currentMarket.isRapid && currentMarket.status !== 'open'}
                onGoToLive={handleGoToLive}
              />
            )}
          </div>

          {/* 5-Min PAST ROUNDS CAROUSEL (Timeline navigation) */}
          {currentMarket.isRapid && (
            <div className="glass-panel p-4 border-slate-200 bg-white flex items-center justify-between gap-4 overflow-x-auto shadow-sm">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0">Past Rounds:</span>
              <div className="flex gap-2.5">
                {pastRounds.map((round) => (
                  <button
                    key={round.id}
                    onClick={() => handleTransitionToMarket(round.id)}
                    className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      round.id === activeMarketId
                        ? 'bg-blue-50 border-blue-300 text-blue-600 shadow-sm font-black'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {round.status === 'resolved' && (
                      <span className={`h-1.5 w-1.5 rounded-full ${round.outcome === 'Up' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    )}
                    {round.status === 'open' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    )}
                    {round.time} {round.status === 'open' && '(Active)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Order Books / Recent filled trades tabs grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OrderBook orderBook={orderBook} currentPrice={yesOutcome?.currentPrice} />

            {/* Trades History */}
            <div className="glass-panel p-4 h-[400px] flex flex-col border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 pb-3 mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Recent Trades</h3>
                <p className="text-[10px] text-slate-500 font-semibold">Past filled orders logs</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 text-xs pr-1">
                {recentTrades.length === 0 ? (
                  <div className="text-center text-slate-400 py-8 italic">No trades logged yet</div>
                ) : (
                  recentTrades.map((trade, idx) => (
                    <div
                      key={`trade-${idx}`}
                      className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-50 rounded transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase ${
                          trade.outcome.name === 'YES' || trade.outcome.name === 'Up' ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#FCE8E6] text-[#C5221F]'
                        }`}>
                          {trade.outcome.name}
                        </span>
                        <span className="text-slate-400">Qty: {trade.quantity}</span>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="font-bold text-slate-800">{format(trade.price)}</span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date(trade.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Comments and Discussions Board */}
          <div className="glass-panel p-5 space-y-4 border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-1.5">
                <MessageSquare size={16} className="text-[#0072F5]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Discussions</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-bold">{comments.length} Comments</span>
            </div>

            {token ? (
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Share your prediction outlook..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 focus:border-[#0072F5]/50 focus:bg-white focus:outline-none rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 shadow-inner"
                />
                <button
                  type="submit"
                  className="btn-primary rounded-xl p-2.5 shrink-0 flex items-center justify-center cursor-pointer"
                >
                  <Send size={15} />
                </button>
              </form>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-center text-xs text-slate-500 font-semibold shadow-inner">
                Please <Link to="/login" className="text-[#0072F5] underline font-bold">login</Link> to join the discussion.
              </div>
            )}

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <div className="text-center text-slate-400 py-6 text-xs italic">
                  Be the first to share your opinion!
                </div>
              ) : (
                comments.map((comm) => (
                  <div key={comm.id} className="border-b border-slate-100 pb-2.5 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800">{comm.user.name}</span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(comm.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed font-semibold">{comm.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side (Trading Slips Checkout) */}
        <div>
          <TradePanel market={currentMarket} initialSide={initialSide} initialOutcome={initialOutcome} />
        </div>
      </div>
    </div>
  );
}
