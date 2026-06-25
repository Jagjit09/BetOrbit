import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient.js';
import { useAuthStore } from '../store/authStore.js';
import { useCurrencyStore } from '../store/currencyStore.js';
import { Trophy } from 'lucide-react';

export default function Leaderboard() {
  const { user } = useAuthStore();
  const { format } = useCurrencyStore();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/leaderboard');
      setLeaderboard(res.data.leaderboard || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 text-slate-950 font-extrabold text-xs shadow-md shadow-yellow-500/20">
            1
          </div>
        );
      case 2:
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 text-slate-950 font-extrabold text-xs shadow-md shadow-slate-300/20">
            2
          </div>
        );
      case 3:
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-600/20">
            3
          </div>
        );
      default:
        return <span className="text-slate-400 font-bold px-1.5">{rank}</span>;
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            Global Leaderboard
          </h1>
          <p className="text-sm text-slate-500 font-semibold">Rankings calculated by Net Asset Value (Cash + share value)</p>
        </div>
      </div>

      {/* Trophies Top 3 Showcase */}
      {!loading && leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-10 items-end max-w-2xl mx-auto pt-6 text-center">
          {/* #2 Rank */}
          <div className="glass-panel p-4 border-slate-200 bg-white h-40 flex flex-col justify-between items-center relative overflow-hidden group shadow-sm">
            <span className="absolute -inset-0 border border-slate-200 rounded-xl"></span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 border border-slate-200">
              <Trophy size={18} />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-400 mt-1">#2 Rank</span>
              <span className="block text-sm font-black text-slate-800 truncate max-w-[90px]">{leaderboard[1].name}</span>
            </div>
            <span className="text-xs font-extrabold text-slate-600">
              {format(leaderboard[1].netAssetValue, 0)}
            </span>
          </div>

          {/* #1 Rank */}
          <div className="glass-panel p-5 border-yellow-400 bg-yellow-50/40 h-48 flex flex-col justify-between items-center relative overflow-hidden group shadow-md">
            <span className="absolute -inset-0.5 border border-yellow-300 rounded-xl animate-pulse"></span>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 border border-yellow-200">
              <Trophy size={22} className="animate-bounce-slow" />
            </div>
            <div>
              <span className="block text-xs font-bold text-yellow-600 mt-1">Champion</span>
              <span className="block text-base font-black text-slate-900 truncate max-w-[100px]">{leaderboard[0].name}</span>
            </div>
            <span className="text-sm font-extrabold text-yellow-600">
              {format(leaderboard[0].netAssetValue, 0)}
            </span>
          </div>

          {/* #3 Rank */}
          <div className="glass-panel p-4 border-slate-200 bg-white h-36 flex flex-col justify-between items-center relative overflow-hidden group shadow-sm">
            <span className="absolute -inset-0 border border-slate-200 rounded-xl"></span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-100">
              <Trophy size={18} />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-400 mt-1">#3 Rank</span>
              <span className="block text-sm font-black text-slate-800 truncate max-w-[90px]">{leaderboard[2].name}</span>
            </div>
            <span className="text-xs font-extrabold text-amber-600">
              {format(leaderboard[2].netAssetValue, 0)}
            </span>
          </div>
        </div>
      )}

      {/* Leaderboard Table Grid */}
      <div className="glass-panel border-slate-200 bg-white rounded-2xl overflow-hidden text-xs shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#0072F5] mb-4"></div>
            <p className="text-xs text-slate-500 font-semibold animate-pulse">Calculating rankings...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-16 text-center text-slate-400 italic">No users ranked yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-4 w-20">Rank</th>
                  <th className="p-4">User Name</th>
                  <th className="p-4 text-right">Cash Balance</th>
                  <th className="p-4 text-right">Positions Value</th>
                  <th className="p-4 text-right">Net Asset Value (NAV)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.map((item, index) => {
                  const rank = index + 1;
                  const isCurrentUser = user && item.id === user.id;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition-all text-slate-600 ${
                        isCurrentUser ? 'bg-blue-50 font-bold border-y border-blue-100' : ''
                      }`}
                    >
                      <td className="p-4 font-bold">{getRankBadge(rank)}</td>
                      <td className="p-4 flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{item.name}</span>
                        {isCurrentUser && (
                          <span className="rounded bg-blue-100 border border-blue-200 text-[9px] font-bold text-blue-600 px-1.5 py-0.5">
                            You
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right text-slate-700">{format(item.demoBalance, 0)}</td>
                      <td className="p-4 text-right text-slate-700">{format(item.positionsValue, 0)}</td>
                      <td className="p-4 text-right font-black text-slate-800">
                        {format(item.netAssetValue, 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
