import { create } from 'zustand';
import axiosClient from '../api/axiosClient.js';
import { useAuthStore } from './authStore.js';
import { useTradeStore } from './tradeStore.js';

export const useWalletStore = create((set) => ({
  transactions: [],
  loading: false,
  error: null,

  fetchTransactions: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axiosClient.get('/wallet/transactions');
      set({ transactions: res.data.transactions, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  claimFaucet: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axiosClient.post('/wallet/faucet');
      const { demoBalance, transaction } = res.data;
      
      // Update global user balance in authStore
      useAuthStore.getState().updateBalance(demoBalance);
      
      // Sync portfolio store
      useTradeStore.getState().fetchPortfolio();
      
      set((state) => ({
        transactions: [transaction, ...state.transactions],
        loading: false,
      }));
      return res.data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  createCheckoutSession: async (amount) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosClient.post('/payment/create-checkout-session', { amount });
      set({ loading: false });
      return res.data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  verifyCheckoutSession: async (sessionId, mockAmount) => {
    set({ loading: true, error: null });
    try {
      const url = mockAmount 
        ? `/payment/verify-session/${sessionId}?mock_amount=${mockAmount}` 
        : `/payment/verify-session/${sessionId}`;
      const res = await axiosClient.get(url);
      const { demoBalance } = res.data;
      
      // Update global user balance in authStore
      useAuthStore.getState().updateBalance(demoBalance);
      
      // Sync portfolio store
      useTradeStore.getState().fetchPortfolio();
      
      set({ loading: false });
      return res.data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  linkedAccounts: null,

  fetchLinkedAccounts: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axiosClient.get('/wallet/accounts');
      set({ linkedAccounts: res.data.accounts, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  updateLinkedAccounts: async (accountsData) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosClient.put('/wallet/accounts', accountsData);
      set({ linkedAccounts: res.data.accounts, loading: false });
      return res.data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  }
}));
