import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { useTradeStore } from '../store/tradeStore.js';
import { useMarketStore } from '../store/marketStore.js';
import { useCurrencyStore } from '../store/currencyStore.js';
import { Coins, ShieldCheck, AlertCircle, Info, Settings, Activity, Cpu } from 'lucide-react';

export default function TradePanel({ market, initialSide = 'buy', initialOutcome = 'YES' }) {
  const { user, token } = useAuthStore();
  const { placeOrder, portfolio } = useTradeStore();
  const { fetchOrderBook, fetchTrades, fetchChartData } = useMarketStore();
  const { format, currency, convert, getSymbol } = useCurrencyStore();

  const isRapid = market.isRapid;
  const yesName = isRapid ? 'Up' : 'YES';
  const noName = isRapid ? 'Down' : 'NO';

  // State hooks
  const [outcome, setOutcome] = useState(initialOutcome === 'YES' || initialOutcome === 'Up' ? yesName : noName);
  const [side, setSide] = useState(initialSide); // 'buy' or 'sell'
  const [orderType, setOrderType] = useState('market'); // default to market to match Polymarket screenshot
  const [limitPrice, setLimitPrice] = useState(0.50); // base price unit
  const [cashAmount, setCashAmount] = useState(10); // user cash input (multiplied by currency)
  const [sellSharesCount, setSellSharesCount] = useState(10); // number of shares to sell
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [slippage, setSlippage] = useState('1.0%');
  const [expiry, setExpiry] = useState('GTC');

  // Sync state if clicked from dashboard rows
  useEffect(() => {
    setOutcome(initialOutcome === 'YES' || initialOutcome === 'Up' ? yesName : noName);
    setSide(initialSide);
  }, [initialOutcome, initialSide, yesName, noName]);

  const yesOutcomeObj = market.outcomes?.find((o) => o.name === 'YES' || o.name === 'Up');
  const noOutcomeObj = market.outcomes?.find((o) => o.name === 'NO' || o.name === 'Down');

  const yesPrice = yesOutcomeObj?.currentPrice || 0.50;
  const yesPercent = Math.round(yesPrice * 100);

  const selectedOutcomeObj = outcome === yesName ? yesOutcomeObj : noOutcomeObj;
  const baseOutcomePrice = selectedOutcomeObj?.currentPrice || 0.50;

  // Active limit/market price per share
  const activeSharePriceBase = orderType === 'limit' ? limitPrice : baseOutcomePrice;
  const activeSharePriceConverted = convert(activeSharePriceBase);

  // Derive quantity from inputs:
  const baseCashAmount = currency === 'INR' ? cashAmount / 83 : cashAmount;
  const quantity = side === 'buy'
    ? (activeSharePriceBase > 0 ? Math.floor(baseCashAmount / activeSharePriceBase) : 0)
    : sellSharesCount;

  // Sync limit price input
  useEffect(() => {
    if (orderType === 'limit') {
      setLimitPrice(parseFloat(baseOutcomePrice.toFixed(2)));
    }
  }, [outcome, baseOutcomePrice, orderType]);

  // Load user positions
  const userPosition = portfolio?.positions?.find(
    (pos) => pos.outcomeId === selectedOutcomeObj?.id
  );
  const ownedShares = userPosition?.quantity || 0;

  // Quick increment buttons based on currency
  const quickIncrements = currency === 'INR'
    ? [{ label: '+₹100', value: 100 }, { label: '+₹500', value: 500 }, { label: '+₹1000', value: 1000 }, { label: '+₹5000', value: 5000 }]
    : [{ label: '+$1', value: 1 }, { label: '+$5', value: 5 }, { label: '+$10', value: 10 }, { label: '+$100', value: 100 }];

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!token) {
      setErrorMessage('Please login to trade.');
      return;
    }

    if (quantity <= 0) {
      setErrorMessage('Please enter a valid amount.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const orderPayload = {
        marketId: market.id,
        outcomeId: selectedOutcomeObj.id,
        side,
        type: orderType,
        quantity,
      };

      if (orderType === 'limit') {
        orderPayload.price = limitPrice;
      }

      const res = await placeOrder(orderPayload);
      const probability = Math.round(activeSharePriceBase * 100);
      setSuccessMessage(res.message || `Order executed successfully at ${probability}¢ (${probability}% probability)!`);

      // Trigger global action toast notification
      const actionName = side === 'buy' ? 'bought' : 'sold';
      useTradeStore.getState().setToast(
        `Successfully ${actionName} ${quantity.toLocaleString()} shares of "${outcome}" at ${probability}¢ (${probability}% probability)!`
      );

      // Reload data
      fetchOrderBook(market.id);
      fetchTrades(market.id);
      fetchChartData(market.id);
      
      setCashAmount(10); // reset to a default cash amount instead of 0 for easier sequential trading
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-5 relative overflow-hidden flex flex-col h-full justify-between border-slate-200 bg-white shadow-sm">
      <span className={`absolute -right-20 -top-20 h-40 w-40 rounded-full blur-[80px] opacity-20 ${
        outcome === yesName ? 'bg-yes' : 'bg-no'
      }`}></span>

      <form onSubmit={handlePlaceOrder} className="space-y-4 relative z-10 text-xs font-semibold">
        {/* Market details name header */}
        <div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{market.title}</span>
          <h3 className={`text-base font-black uppercase tracking-wider mt-1 ${outcome === yesName ? 'text-[#137333]' : 'text-[#C5221F]'}`}>
            {outcome}
          </h3>
        </div>

        {/* Buy / Sell Tabs */}
        <div className="grid grid-cols-2 rounded-xl bg-slate-100 border border-slate-200/60 p-1">
          <button
            type="button"
            onClick={() => {
              setSide('buy');
              setSuccessMessage('');
              setErrorMessage('');
            }}
            className={`rounded-lg py-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              side === 'buy'
                ? 'bg-white text-slate-900 shadow font-black'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => {
              setSide('sell');
              setSuccessMessage('');
              setErrorMessage('');
            }}
            className={`rounded-lg py-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              side === 'sell'
                ? 'bg-white text-slate-900 shadow border border-slate-100'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sell
          </button>
        </div>

        {/* YES / NO / UP / DOWN Switchers */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOutcome(yesName)}
            className={`rounded-xl py-3 border flex flex-col items-center justify-center transition-all cursor-pointer ${
              outcome === yesName
                ? 'border-yes bg-yes/10 text-[#137333] shadow-sm font-black'
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="text-xs uppercase font-extrabold tracking-wider">{yesName}</span>
            <span className="text-[10px] font-medium opacity-80 mt-0.5">{isRapid ? `${yesPercent}¢` : format(yesOutcomeObj?.currentPrice)}</span>
          </button>
          <button
            type="button"
            onClick={() => setOutcome(noName)}
            className={`rounded-xl py-3 border flex flex-col items-center justify-center transition-all cursor-pointer ${
              outcome === noName
                ? 'border-no bg-no/10 text-[#C5221F] shadow-sm font-black'
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="text-xs uppercase font-extrabold tracking-wider">{noName}</span>
            <span className="text-[10px] font-medium opacity-80 mt-0.5">{isRapid ? `${100 - yesPercent}¢` : format(noOutcomeObj?.currentPrice)}</span>
          </button>
        </div>

        {/* Order Type Toggle (Limit / Market) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            Order Type <Info size={11} className="text-slate-400 cursor-help" title="Limit orders specify a price, Market orders fill instantly." />
          </span>
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setOrderType('limit')}
              className={`rounded px-2.5 py-1 text-[9px] font-black uppercase transition-all cursor-pointer ${
                orderType === 'limit' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-750'
              }`}
            >
              Limit
            </button>
            <button
              type="button"
              onClick={() => setOrderType('market')}
              className={`rounded px-2.5 py-1 text-[9px] font-black uppercase transition-all cursor-pointer ${
                orderType === 'market' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-750'
              }`}
            >
              Market
            </button>
          </div>
        </div>

        {/* Slippage Settings (Premium Detail) */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            Slippage <Info size={11} className="text-slate-400 cursor-help" title="Max acceptable price change before order reverts." />
          </span>
          <div className="flex gap-1.5">
            {['0.5%', '1.0%', '3.0%'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setSlippage(val)}
                className={`rounded px-2 py-0.5 text-[9px] font-extrabold border transition-all cursor-pointer ${
                  slippage === val
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-black'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Order Expiry (Premium Detail) */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            Expiration <Info size={11} className="text-slate-400 cursor-help" title="Time after which pending order cancels automatically." />
          </span>
          <div className="flex gap-1.5">
            {['GTC', '1 Day', '7 Days'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setExpiry(val)}
                className={`rounded px-2 py-0.5 text-[9px] font-extrabold border transition-all cursor-pointer ${
                  expiry === val
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-black'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          {/* Limit Price Input (Only for Limit Orders) */}
          {orderType === 'limit' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Limit Price</label>
                <span className="text-[9px] text-slate-400 font-bold">
                  Range: {format(0.01)} - {format(0.99)}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.99"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0.01)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0072F5]/50 focus:bg-white focus:outline-none rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 shadow-inner"
                  required
                />
                <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-500">{getSymbol()}</span>
              </div>
            </div>
          )}

          {/* Amount input box (Polymarket checkout slip) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                {side === 'buy' ? 'Bet Amount' : 'Shares to Sell'}
              </label>
              {side === 'buy' ? (
                <span className="text-[10px] text-slate-400 flex items-center gap-0.5 font-bold uppercase">
                  Cash: {format(user?.demoBalance || 0)}
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    Owned: {ownedShares} shares
                  </span>
                  <button
                    type="button"
                    onClick={() => setSellSharesCount(ownedShares)}
                    className="rounded bg-blue-100 hover:bg-blue-200 text-blue-700 text-[9px] font-black px-1.5 py-0.5 cursor-pointer uppercase transition-all"
                  >
                    Max
                  </button>
                </div>
              )}
            </div>
            
            <div className="relative">
              {side === 'buy' ? (
                <>
                  <input
                    type="number"
                    min="1"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0072F5]/50 focus:bg-white focus:outline-none rounded-xl py-2.5 px-3 text-sm font-black text-slate-800 shadow-inner"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">{currency}</span>
                </>
              ) : (
                <>
                  <input
                    type="number"
                    min="1"
                    max={ownedShares}
                    value={sellSharesCount}
                    onChange={(e) => setSellSharesCount(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0072F5]/50 focus:bg-white focus:outline-none rounded-xl py-2.5 px-3 text-sm font-black text-slate-800 shadow-inner"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">Shares</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Increments button group (Only for Buy side) */}
          {side === 'buy' && (
            <div className="grid grid-cols-4 gap-1.5">
              {quickIncrements.map((inc) => (
                <button
                  key={inc.label}
                  type="button"
                  onClick={() => setCashAmount((prev) => prev + inc.value)}
                  className="rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-800 py-1.5 text-[9px] font-extrabold transition-all cursor-pointer"
                >
                  {inc.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Order Routing Map (Premium Detail) */}
        <div className="bg-[#FAF8F6] border border-[#EBE7DF] rounded-xl p-2.5 space-y-1.5">
          <div className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-500 tracking-wider">
            <Cpu size={10} className="text-blue-500 animate-pulse" /> Smart Routing Protocol (BDS v3)
          </div>
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-600 bg-white p-1.5 rounded-lg border border-slate-200/50">
            <span className="flex items-center gap-0.5 text-slate-800 font-extrabold">Wallet</span>
            <span className="text-slate-300">⟶</span>
            <span className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[8px] uppercase font-black tracking-wide">BetOrbit Node</span>
            <span className="text-slate-300">⟶</span>
            <span className="text-[#137333] bg-[#E6F4EA] px-1 py-0.5 rounded text-[8px] uppercase font-black tracking-wide">Liquidity Pool</span>
          </div>
        </div>

        {/* Cost / Share estimate summary box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 font-bold text-[10px]">
          <div className="flex justify-between">
            <span className="text-slate-500 flex items-center gap-1">Average Share Price</span>
            <span className="text-slate-800">
              {isRapid ? `${Math.round(activeSharePriceBase * 100)}¢` : format(activeSharePriceBase)}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5 text-xs font-black">
            <span className="text-slate-600">Est. Shares Payout</span>
            <span className="text-[#137333]">
              {quantity.toLocaleString()} Shares
            </span>
          </div>
          <div className="flex justify-between text-[9px] text-slate-500 font-bold">
            <span>Potential Return</span>
            <span className="text-slate-700">{format(quantity)}</span>
          </div>
        </div>

        {/* Protocol Statistics / Metrics Panel (Premium Detail) */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1 text-[9px] font-bold text-slate-500">
          <div className="flex justify-between">
            <span>Estimated Price Impact:</span>
            <span className="text-[#137333] font-extrabold">&lt; 0.04%</span>
          </div>
          <div className="flex justify-between">
            <span>Liquidity Provider Fee:</span>
            <span className="text-slate-700">0.00% (Gasless Trial)</span>
          </div>
          <div className="flex justify-between">
            <span>Protocol Match Priority:</span>
            <span className="text-blue-600 font-black uppercase">Max High</span>
          </div>
          <div className="flex justify-between">
            <span>Network Execution Speed:</span>
            <span className="text-slate-700">Instant (&lt;1.8s)</span>
          </div>
        </div>

        {/* Error / Success logs */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-[10px] font-bold text-rose-600 animate-pulse">
            <AlertCircle size={13} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-[10px] font-bold text-emerald-700">
            <ShieldCheck size={13} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Submit Execution Button */}
        <button
          type="submit"
          disabled={loading || market.status !== 'open'}
          className={`w-full font-black uppercase tracking-wider py-3 rounded-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer ${
            market.status !== 'open'
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : side === 'buy'
              ? outcome === yesName
                ? 'bg-[#10B981] hover:bg-[#059669] shadow text-white font-black'
                : 'bg-[#F43F5E] hover:bg-[#E11D48] shadow text-white font-black'
              : 'bg-slate-800 hover:bg-slate-900 text-white font-black'
          }`}
        >
          {loading ? (
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : market.status !== 'open' ? (
            'Market Suspended'
          ) : side === 'buy' ? (
            `Buy ${outcome}`
          ) : (
            `Sell ${outcome}`
          )}
        </button>
      </form>
    </div>
  );
}
