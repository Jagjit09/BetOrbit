import React, { useEffect, useState } from 'react';
import { useMarketStore } from '../../store/marketStore.js';
import { PlusCircle, CheckCircle2, AlertOctagon, HelpCircle, FilePlus, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const { markets, fetchMarkets, createMarket, resolveMarket, loading } = useMarketStore();

  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create'
  
  // Create Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Crypto');
  const [resolutionSource, setResolutionSource] = useState('');
  const [endTime, setEndTime] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [createErr, setCreateErr] = useState('');

  // Resolve Modal/Section State
  const [resolvingMarket, setResolvingMarket] = useState(null); // market object
  const [winningOutcomeId, setWinningOutcomeId] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [resolveSuccess, setResolveSuccess] = useState('');
  const [resolveErr, setResolveErr] = useState('');

  useEffect(() => {
    fetchMarkets({ status: '' }); // Fetch both open and resolved markets
  }, [fetchMarkets]);

  const handleCreateMarket = async (e) => {
    e.preventDefault();
    setCreateSuccess('');
    setCreateErr('');

    if (!title || !description || !resolutionSource || !endTime) {
      setCreateErr('Please fill in all required fields.');
      return;
    }

    try {
      await createMarket({
        title,
        description,
        category,
        resolutionSource,
        endTime: new Date(endTime).toISOString(),
      });
      setCreateSuccess('Prediction market created successfully!');
      setTitle('');
      setDescription('');
      setResolutionSource('');
      setEndTime('');
      // Refresh list
      fetchMarkets({ status: '' });
      setTimeout(() => setActiveTab('list'), 1500);
    } catch (err) {
      setCreateErr(err.message || 'Error creating market.');
    }
  };

  const handleResolveMarket = async (e) => {
    e.preventDefault();
    setResolveSuccess('');
    setResolveErr('');

    if (!winningOutcomeId) {
      setResolveErr('Please select a winning outcome.');
      return;
    }

    try {
      await resolveMarket(resolvingMarket.id, {
        winningOutcomeId,
        proofUrl,
        notes,
      });
      setResolveSuccess('Market resolved successfully! Payouts distributed.');
      setResolvingMarket(null);
      setWinningOutcomeId('');
      setProofUrl('');
      setNotes('');
      // Refresh list
      fetchMarkets({ status: '' });
    } catch (err) {
      setResolveErr(err.message || 'Error resolving market.');
    }
  };

  const openMarkets = markets.filter((m) => m.status === 'open' && !m.isRapid);
  const resolvedMarkets = markets.filter((m) => m.status === 'resolved');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Admin Portal</h1>
          <p className="text-sm text-slate-500 font-medium">Create prediction topics and resolve expired rounds</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 shrink-0">
          <button
            onClick={() => {
              setActiveTab('list');
              setResolvingMarket(null);
            }}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'list' ? 'bg-[#0072F5] text-white shadow' : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            Manage Markets
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'create' ? 'bg-[#0072F5] text-white shadow' : 'text-slate-500 hover:text-slate-855'
            }`}
          >
            <FilePlus size={14} />
            Create Market
          </button>
        </div>
      </div>

      {/* Main Sections */}
      {activeTab === 'create' ? (
        /* CREATE MARKET FORM */
        <div className="glass-panel p-6 max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <PlusCircle size={18} className="text-[#0072F5]" />
            Create Prediction Market
          </h2>

          <form onSubmit={handleCreateMarket} className="space-y-4 text-xs font-semibold">
            {/* Title */}
            <div>
              <label className="text-slate-600 block mb-1.5">Market Question / Title</label>
              <input
                type="text"
                placeholder="e.g. Will India win the cricket match tomorrow?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-slate-400 focus:outline-none rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-700 shadow-sm"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-slate-600 block mb-1.5">Detailed Description / Rules</label>
              <textarea
                placeholder="Outline exact resolution specifications..."
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-slate-400 focus:outline-none rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-700 shadow-sm"
                required
              ></textarea>
            </div>

            {/* Category and EndTime */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-600 block mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-slate-400 focus:outline-none rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-700 shadow-sm"
                >
                  <option value="Crypto" className="text-slate-800">Crypto</option>
                  <option value="Technology" className="text-slate-800">Technology</option>
                  <option value="Sports" className="text-slate-800">Sports</option>
                  <option value="Weather" className="text-slate-800">Weather</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1.5">End Time / Expiration</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-slate-400 focus:outline-none rounded-xl py-2 px-3 text-xs font-semibold text-slate-700 shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Resolution source */}
            <div>
              <label className="text-slate-600 block mb-1.5">Official Resolution Source</label>
              <input
                type="text"
                placeholder="e.g. ESPN official scoreboard scoreboard.espn.com"
                value={resolutionSource}
                onChange={(e) => setResolutionSource(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-slate-400 focus:outline-none rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-700 shadow-sm"
                required
              />
            </div>

            {/* Logs */}
            {createSuccess && (
              <div className="text-emerald-700 font-bold text-xs p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                {createSuccess}
              </div>
            )}
            {createErr && (
              <div className="text-rose-700 font-bold text-xs p-3 bg-rose-50 rounded-lg border border-rose-200">
                {createErr}
              </div>
            )}

            <button type="submit" className="w-full btn-primary py-3 text-xs font-bold uppercase tracking-wider cursor-pointer">
              Launch Prediction Market
            </button>
          </form>
        </div>
      ) : (
        /* MANAGE MARKETS */
        <div className="space-y-10">
          {/* Active Resolution slip */}
          {resolvingMarket && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 max-w-xl mx-auto text-xs font-semibold shadow-sm">
              <h3 className="text-base font-black text-slate-800 mb-2">Resolve Prediction</h3>
              <p className="text-slate-600 font-medium mb-4">{resolvingMarket.title}</p>

              <form onSubmit={handleResolveMarket} className="space-y-4">
                {/* Outcome Select */}
                <div>
                  <label className="text-slate-600 block mb-1.5">Select Winning Outcome</label>
                  <div className="grid grid-cols-2 gap-3">
                    {resolvingMarket.outcomes.map((out) => (
                      <button
                        key={out.id}
                        type="button"
                        onClick={() => setWinningOutcomeId(out.id)}
                        className={`rounded-xl py-3.5 border font-bold text-sm transition-all cursor-pointer ${
                          winningOutcomeId === out.id
                            ? out.name === 'YES' || out.name === 'Up'
                              ? 'border-[#10B981] bg-[#E6F4EA] text-[#137333]'
                              : 'border-[#F43F5E] bg-[#FCE8E6] text-[#C5221F]'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-55'
                        }`}
                      >
                        {out.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Proof Link */}
                <div>
                  <label className="text-slate-600 block mb-1.5">Resolution Proof URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/proof-source"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-slate-400 focus:outline-none rounded-xl py-2 px-3 text-xs font-semibold text-slate-700 shadow-sm"
                    required
                  />
                </div>

                {/* Settlement Notes */}
                <div>
                  <label className="text-slate-600 block mb-1.5">Resolution Notes / Reason</label>
                  <textarea
                    placeholder="Provide details on how the winner was determined..."
                    rows="3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-slate-400 focus:outline-none rounded-xl py-2 px-3 text-xs font-semibold text-slate-700 shadow-sm"
                  ></textarea>
                </div>

                {/* Logs */}
                {resolveErr && (
                  <div className="text-rose-700 font-bold p-3 bg-rose-50 rounded-lg border border-rose-200">
                    {resolveErr}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setResolvingMarket(null);
                      setWinningOutcomeId('');
                    }}
                    className="flex-1 btn-secondary cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 rounded-lg bg-amber-550 hover:bg-amber-600 text-white font-bold px-5 py-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer bg-yellow-500">
                    Distribute Payouts
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Open Markets Table */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2.5 flex items-center gap-1">
              <AlertOctagon size={16} className="text-yellow-500 animate-pulse" />
              Open Markets ({openMarkets.length})
            </h2>

            <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="p-4">Market Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Expiration Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {openMarkets.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-slate-500 italic">
                        No open markets to manage. (Automated 5-min rapid markets resolve automatically).
                      </td>
                    </tr>
                  ) : (
                    openMarkets.map((market) => (
                      <tr key={market.id} className="hover:bg-slate-50 transition-all text-slate-700">
                        <td className="p-4 font-bold text-slate-800">{market.title}</td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider border border-slate-200 bg-slate-50 text-slate-600 px-2 py-0.5 rounded">
                            {market.category}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">
                          {new Date(market.endTime).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setResolvingMarket(market);
                              setWinningOutcomeId('');
                              setProofUrl('');
                              setNotes('');
                            }}
                            className="rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-600 px-3.5 py-1.5 font-bold transition-all text-xs cursor-pointer"
                          >
                            Resolve Outcome
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resolved Markets Table */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2.5 flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-[#10B981]" />
              Resolved Archive History
            </h2>

            <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="p-4">Market Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date Resolved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {resolvedMarkets.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-slate-500 italic">
                        No resolved archive entries
                      </td>
                    </tr>
                  ) : (
                    resolvedMarkets.map((market) => (
                      <tr key={market.id} className="hover:bg-slate-50 transition-all border-b border-slate-100">
                        <td className="p-4 font-semibold text-slate-800">{market.title}</td>
                        <td className="p-4">
                          <span className="text-[9px] font-bold uppercase tracking-wider border border-slate-200 bg-slate-50 text-slate-600 px-2 py-0.5 rounded">
                            {market.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                            Resolved
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">
                          {new Date(market.endTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
