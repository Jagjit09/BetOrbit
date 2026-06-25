import { create } from 'zustand';

export const useCurrencyStore = create((set, get) => ({
  currency: localStorage.getItem('betorbit_currency') || 'USD', // 'USD' or 'INR'

  setCurrency: (currency) => {
    localStorage.setItem('betorbit_currency', currency);
    set({ currency });
  },

  getSymbol: () => {
    return get().currency === 'INR' ? '₹' : '$';
  },

  convert: (amount) => {
    if (amount === undefined || amount === null) return 0;
    return get().currency === 'INR' ? amount * 83 : amount;
  },

  // Formats any base USD amount into the target currency symbol and converted size
  format: (amount, fractionDigits = 2) => {
    if (amount === undefined || amount === null) return '';
    const converted = get().convert(amount);
    const symbol = get().getSymbol();
    return `${symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`;
  }
}));
