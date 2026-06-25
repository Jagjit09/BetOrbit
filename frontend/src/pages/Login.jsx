import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, error: storeError, loading } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    if (!email || !password) {
      setErr('Please fill in all fields.');
      return;
    }

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setErr(error.message || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F3F5F9] px-4">
      <div className="glass-panel p-8 w-full max-w-md relative z-10 bg-white border-slate-200/80 shadow-xl text-slate-800">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">Log in to manage your prediction assets</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-xs font-black text-slate-600 block mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail size={15} />
              </span>
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#0072F5]/50 focus:bg-white focus:outline-none rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-800 shadow-inner"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-black text-slate-600 block mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={15} />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#0072F5]/50 focus:bg-white focus:outline-none rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-800 shadow-inner"
                required
              />
            </div>
          </div>

          {/* Error notifications */}
          {(err || storeError) && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-600">
              <AlertCircle size={14} className="shrink-0" />
              <span>{err || storeError}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <LogIn size={15} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-xs font-bold text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#0072F5] hover:text-[#0062D2] underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
