import { create } from 'zustand';
import axiosClient from '../api/axiosClient.js';
import { useAuthStore } from './authStore.js';

export const useTradeStore = create((set, get) => ({
  portfolio: {
    positions: [],
    demoBalance: 0,
    totalPositionsValue: 0,
    netAssetValue: 0,
    totalProfitLoss: 0,
  },
  orders: [],
  loading: false,
  error: null,
  toastMessage: '',
  setToast: (msg) => {
    set({ toastMessage: msg });
  },

  fetchPortfolio: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axiosClient.get('/portfolio');
      set({ portfolio: res.data.portfolio, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axiosClient.get('/orders/my');
      set({ orders: res.data.orders, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  placeOrder: async (orderData) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosClient.post('/orders', orderData);
      
      // Update local portfolio details and active order logs
      await get().fetchPortfolio();
      await get().fetchOrders();
      
      // Update demoBalance inside authStore
      const updatedBalance = get().portfolio.demoBalance;
      useAuthStore.getState().updateBalance(updatedBalance);
      
      set({ loading: false });
      return res.data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  cancelOrder: async (orderId) => {
    set({ loading: true, error: null });
    try {
      await axiosClient.delete(`/orders/${orderId}`);
      
      // Refresh local portfolio and active orders
      await get().fetchPortfolio();
      await get().fetchOrders();

      // Update demoBalance inside authStore
      const updatedBalance = get().portfolio.demoBalance;
      useAuthStore.getState().updateBalance(updatedBalance);

      set({ loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  }
}));
