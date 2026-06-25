import { create } from 'zustand';
import axiosClient from '../api/axiosClient.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('betorbit_token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosClient.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('betorbit_token', token);
      set({ token, user, loading: false });
      return user;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosClient.post('/auth/register', { name, email, password });
      const { token, user } = res.data;
      localStorage.setItem('betorbit_token', token);
      set({ token, user, loading: false });
      return user;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('betorbit_token');
    set({ user: null, token: null, error: null });
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) return null;

    set({ loading: true, error: null });
    try {
      const res = await axiosClient.get('/auth/me');
      set({ user: res.data.user, loading: false });
      return res.data.user;
    } catch (err) {
      // Token is invalid/expired
      localStorage.removeItem('betorbit_token');
      set({ token: null, user: null, loading: false });
      return null;
    }
  },

  updateBalance: (newBalance) => {
    const user = get().user;
    if (user) {
      set({ user: { ...user, demoBalance: newBalance } });
    }
  }
}));
