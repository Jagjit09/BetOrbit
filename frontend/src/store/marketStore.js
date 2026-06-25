import { create } from 'zustand';
import axiosClient from '../api/axiosClient.js';

export const useMarketStore = create((set, get) => ({
  markets: [],
  currentMarket: null,
  orderBook: null,
  recentTrades: [],
  chartData: [],
  comments: [],
  loading: false,
  error: null,

  fetchMarkets: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosClient.get('/markets', { params: filters });
      set({ markets: res.data.markets, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchMarketDetails: async (id) => {
    const current = get().currentMarket;
    if (!current || current.id !== id) {
      set({ currentMarket: null, chartData: [], orderBook: null, recentTrades: [], comments: [] });
    }
    set({ loading: true, error: null });
    try {
      const res = await axiosClient.get(`/markets/${id}`);
      set({ currentMarket: res.data.market, loading: false });
      return res.data.market;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  fetchOrderBook: async (id) => {
    try {
      const res = await axiosClient.get(`/markets/${id}/orderbook`);
      set({ orderBook: res.data.orderBook });
    } catch (err) {
      console.error('Error fetching orderbook:', err);
    }
  },

  fetchTrades: async (id) => {
    try {
      const res = await axiosClient.get(`/markets/${id}/trades`);
      set({ recentTrades: res.data.trades });
    } catch (err) {
      console.error('Error fetching trades:', err);
    }
  },

  fetchChartData: async (id) => {
    try {
      const res = await axiosClient.get(`/markets/${id}/chart`);
      set({ chartData: res.data.chartData });
    } catch (err) {
      console.error('Error fetching chart data:', err);
    }
  },

  fetchComments: async (id) => {
    try {
      const res = await axiosClient.get(`/markets/${id}/comments`);
      set({ comments: res.data.comments });
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  },

  postComment: async (marketId, content) => {
    try {
      const res = await axiosClient.post(`/markets/${marketId}/comments`, { content });
      const newComment = res.data.comment;
      set((state) => ({
        comments: [newComment, ...state.comments],
      }));
      return newComment;
    } catch (err) {
      console.error('Error posting comment:', err);
      throw err;
    }
  },

  createMarket: async (marketData) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosClient.post('/admin/markets', marketData);
      set((state) => ({
        markets: [res.data.market, ...state.markets],
        loading: false,
      }));
      return res.data.market;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  resolveMarket: async (marketId, resolutionData) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosClient.post(`/admin/markets/${marketId}/resolve`, resolutionData);
      // Refresh markets list
      await get().fetchMarkets();
      set({ loading: false });
      return res.data.market;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Updates specific outcome price locally when real-time trades occur
  updateOutcomePrice: (outcomeId, newPrice) => {
    const { currentMarket } = get();
    if (currentMarket && currentMarket.outcomes) {
      const updatedOutcomes = currentMarket.outcomes.map((o) =>
        o.id === outcomeId ? { ...o, currentPrice: newPrice } : o
      );
      set({ currentMarket: { ...currentMarket, outcomes: updatedOutcomes } });
    }
  },

  updateRapidPrices: (upPrice, downPrice) => {
    const { currentMarket } = get();
    if (currentMarket && currentMarket.outcomes) {
      const updatedOutcomes = currentMarket.outcomes.map((o) => {
        if (o.name === 'Up' || o.name === 'YES') {
          return { ...o, currentPrice: upPrice };
        }
        if (o.name === 'Down' || o.name === 'NO') {
          return { ...o, currentPrice: downPrice };
        }
        return o;
      });
      set({ currentMarket: { ...currentMarket, outcomes: updatedOutcomes } });
    }
  }
}));
