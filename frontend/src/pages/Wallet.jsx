import React, { useEffect, useState, useRef } from 'react';
import { useWalletStore } from '../store/walletStore.js';
import { useAuthStore } from '../store/authStore.js';
import { useCurrencyStore } from '../store/currencyStore.js';
import { Coins, HelpCircle, ArrowUpRight, ArrowDownLeft, CreditCard } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function Wallet() {
  const { user } = useAuthStore();
  const { 
    transactions, 
    fetchTransactions, 
    claimFaucet, 
    createCheckoutSession, 
    verifyCheckoutSession, 
    linkedAccounts,
    fetchLinkedAccounts,
    updateLinkedAccounts,
    loading 
  } = useWalletStore();
  const { format, currency } = useCurrencyStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [successMsg, setSuccessMsg] = useState('');
  const [claimErr, setClaimErr] = useState('');
  const [depositAmount, setDepositAmount] = useState(10);
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankRouting, setBankRouting] = useState('');
  const [cryptoBtc, setCryptoBtc] = useState('');
  const [cryptoEth, setCryptoEth] = useState('');
  const [cryptoUsdt, setCryptoUsdt] = useState('');
  const [accountsMsg, setAccountsMsg] = useState('');
  const [accountsErr, setAccountsErr] = useState('');
  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    fetchTransactions();
    fetchLinkedAccounts();
  }, [fetchTransactions, fetchLinkedAccounts]);

  // Sync linked account details when fetched from store
  useEffect(() => {
    if (linkedAccounts) {
      setBankName(linkedAccounts.bankName || '');
      setBankAccount(linkedAccounts.bankAccount || '');
      setBankRouting(linkedAccounts.bankRouting || '');
      setCryptoBtc(linkedAccounts.cryptoBtc || '');
      setCryptoEth(linkedAccounts.cryptoEth || '');
      setCryptoUsdt(linkedAccounts.cryptoUsdt || '');
    }
  }, [linkedAccounts]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const depositStatus = searchParams.get('deposit');
    const mockAmount = searchParams.get('mock_amount');

    if (sessionId && depositStatus === 'success' && !hasVerifiedRef.current) {
      hasVerifiedRef.current = true;
      const verify = async () => {
        try {
          const res = await verifyCheckoutSession(sessionId, mockAmount);
          setSuccessMsg(res.message || 'Deposit processed successfully!');
          fetchTransactions();
          setSearchParams({});
        } catch (err) {
          setClaimErr(err.message || 'Failed to verify checkout session.');
          hasVerifiedRef.current = false; // allow retry on failure
        }
      };
      verify();
    } else if (depositStatus === 'cancel' && !hasVerifiedRef.current) {
      hasVerifiedRef.current = true;
      setClaimErr('Deposit payment was cancelled.');
      setSearchParams({});
    }
  }, [searchParams, verifyCheckoutSession, fetchTransactions, setSearchParams]);

  const handleClaimCoins = async () => {
    setSuccessMsg('');
    setClaimErr('');
    try {
      const res = await claimFaucet();
      setSuccessMsg('Grant claimed successfully!');
      fetchTransactions();
    } catch (err) {
      setClaimErr(err.message || 'Failed to claim grant.');
    }
  };

  const handleStripeDeposit = async () => {
    setSuccessMsg('');
    setClaimErr('');
    try {
      const res = await createCheckoutSession(depositAmount);
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      setClaimErr(err.message || 'Failed to initiate deposit.');
    }
  };

  const handleUpdateAccounts = async (e) => {
    e.preventDefault();
    setAccountsMsg('');
    setAccountsErr('');
    try {
      const res = await updateLinkedAccounts({
        bankName,
        bankAccount,
        bankRouting,
        cryptoBtc,
        cryptoEth,
        cryptoUsdt,
      });
      setAccountsMsg(res.message || 'Linked accounts updated successfully!');
      setTimeout(() => setAccountsMsg(''), 4000);
    } catch (err) {
      setAccountsErr(err.message || 'Failed to update linked accounts.');
      setTimeout(() => setAccountsErr(''), 4000);
    }
  };

  const balance = user?.demoBalance || 0;
  const isClaimable = balance < 500;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Wallet</h1>
          <p className="text-sm text-slate-500 font-semibold">Manage cash funds, transaction logs, and deposit funds</p>
        </div>
      </div>

      {/* Info messages */}
      {(successMsg || claimErr) && (
        <div className="mb-6 p-4 rounded-xl border text-xs font-semibold transition-all">
          {successMsg && (
            <span className="text-emerald-600 font-bold block">{successMsg}</span>
          )}
          {claimErr && (
            <span className="text-rose-600 font-bold block">{claimErr}</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 text-xs font-semibold">
        {/* Balance Card */}
        <div className="glass-panel p-6 border-slate-200 bg-white flex flex-col justify-between h-48 relative overflow-hidden group shadow-sm">
          <span className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-yellow-500 opacity-5 blur-2xl group-hover:opacity-10 transition-all"></span>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Balance</span>
            <div className="text-3xl font-black text-slate-800 flex items-center gap-2 mt-2 font-mono">
              <Coins size={30} className="text-yellow-500 animate-bounce-slow" />
              <span>{format(balance)}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-1.5 block">
              USD Cash Balance
            </span>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
            Use these funds to place predictions on any live markets.
          </div>
        </div>

        {/* Stripe Deposit Card */}
        <div className="glass-panel p-6 border-slate-200 bg-white flex flex-col justify-between h-48 relative overflow-hidden lg:col-span-2 group shadow-sm">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deposit Funds</span>
            <div className="mt-2.5 flex gap-2">
              <input
                type="number"
                placeholder="Amount ($)"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#0072F5]/50 focus:bg-white focus:outline-none rounded-lg py-1.5 px-3 text-xs font-semibold text-slate-800 shadow-inner"
              />
              <button
                onClick={handleStripeDeposit}
                disabled={loading || !depositAmount}
                className="bg-[#0072F5] hover:bg-[#005ecf] text-white text-[10px] font-bold uppercase tracking-wider py-1.5 px-4 rounded-lg shadow-md cursor-pointer transition-all shrink-0 flex items-center gap-1"
              >
                <CreditCard size={12} />
                {loading ? '...' : 'Deposit'}
              </button>
            </div>
            <div className="flex gap-1.5 mt-2.5">
              {[10, 25, 50, 100].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setDepositAmount(amt)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded px-2.5 py-1 text-[9px] font-bold cursor-pointer transition-all"
                >
                  +${amt}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            Add funds instantly using Stripe secure checkout test cards.
          </div>
        </div>
      </div>

      {/* Linked Bank & Crypto Accounts */}
      <div className="space-y-6 mb-10 text-xs font-semibold">
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3">
          <CreditCard size={16} className="text-[#0072F5]" />
          <h2 className="text-lg font-bold text-slate-800">Linked Accounts & Wallets</h2>
        </div>

        <form onSubmit={handleUpdateAccounts} className="glass-panel p-6 border-slate-200 bg-white rounded-2xl shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bank Accounts Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
                Bank Account Details
              </h3>
              
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chase, Bank of America"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0072F5]/50 focus:bg-white focus:outline-none rounded-lg py-2 px-3 text-xs font-semibold text-slate-850 shadow-inner"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1234567890"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0072F5]/50 focus:bg-white focus:outline-none rounded-lg py-2 px-3 text-xs font-semibold text-slate-850 shadow-inner"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                  Routing / SWIFT / IBAN Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 021000021"
                  value={bankRouting}
                  onChange={(e) => setBankRouting(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0072F5]/50 focus:bg-white focus:outline-none rounded-lg py-2 px-3 text-xs font-semibold text-slate-850 shadow-inner"
                />
              </div>
            </div>

            {/* Crypto Wallets Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
                Crypto Wallet Addresses
              </h3>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                  Bitcoin Address (BTC)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                  value={cryptoBtc}
                  onChange={(e) => setCryptoBtc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0072F5]/50 focus:bg-white focus:outline-none rounded-lg py-2 px-3 text-xs font-semibold text-slate-850 shadow-inner"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                  Ethereum Address (ETH)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
                  value={cryptoEth}
                  onChange={(e) => setCryptoEth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0072F5]/50 focus:bg-white focus:outline-none rounded-lg py-2 px-3 text-xs font-semibold text-slate-850 shadow-inner"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                  Tether Address (USDT - ERC20/TRC20)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tx8976F56EC7ab88b098defB751B7401B..."
                  value={cryptoUsdt}
                  onChange={(e) => setCryptoUsdt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0072F5]/50 focus:bg-white focus:outline-none rounded-lg py-2 px-3 text-xs font-semibold text-slate-850 shadow-inner"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
            <div>
              {accountsMsg && (
                <span className="text-xs font-bold text-emerald-600 animate-pulse">{accountsMsg}</span>
              )}
              {accountsErr && (
                <span className="text-xs font-bold text-rose-600 animate-pulse">{accountsErr}</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleUpdateAccounts}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl shadow cursor-pointer transition-all active:scale-[0.98] shrink-0"
            >
              {loading ? 'Saving...' : 'Save Linked Accounts'}
            </button>
          </div>
        </form>
      </div>

      {/* Transaction Logs */}
      <div className="space-y-6">
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3">
          <HelpCircle size={16} className="text-[#0072F5]" />
          <h2 className="text-lg font-bold text-slate-800">Transaction History</h2>
        </div>

        <div className="glass-panel border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4 text-right">Balance After</th>
                  <th className="p-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                      No transaction history found
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-all text-slate-600">
                      <td className="p-4 font-bold text-[10px] text-slate-500 font-mono">
                        {tx.id.substring(0, 13)}...
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 font-bold uppercase text-[9px] px-2 py-0.5 rounded ${
                          tx.type === 'credit' ? 'bg-[#E6F4EA] text-[#137333] border border-[#10B981]/20' : 'bg-[#FCE8E6] text-[#C5221F] border border-[#F43F5E]/20'
                        }`}>
                          {tx.type === 'credit' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                          {tx.type}
                        </span>
                      </td>
                      <td className={`p-4 text-right font-bold ${tx.type === 'credit' ? 'text-[#137333]' : 'text-[#C5221F]'}`}>
                        {tx.type === 'credit' ? '+' : '-'}
                        {format(tx.amount)}
                      </td>
                      <td className="p-4 font-semibold text-slate-800">{tx.reason}</td>
                      <td className="p-4 text-right font-medium text-slate-700">{format(tx.balanceAfter)}</td>
                      <td className="p-4 text-right text-slate-500">
                        {new Date(tx.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
