import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, TrendingUp, Cpu, Award } from 'lucide-react';

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F3F5F9] overflow-hidden">
      



      {/* Hero Content Overlay */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Tagline */}
          <motion.div 
            variants={itemVariants} 
            className="inline-flex items-center gap-2 rounded-full border border-[#0072F5]/20 bg-[#0072F5]/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-700 shadow-[0_0_15px_rgba(0,114,245,0.08)]"
          >
            <span className="flex h-2 w-2 rounded-full bg-[#0072F5] animate-ping"></span>
            Prediction Markets Redefined
          </motion.div>

          {/* Branded Logo and Heading */}
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-6">
            {/* Massive Branded Logo */}
            <div className="relative group select-none">
              <div className="absolute inset-0 bg-[#0072F5]/10 rounded-full blur-xl group-hover:bg-[#0072F5]/20 transition-all"></div>
              <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 animate-pulse-slow">
                <defs>
                  <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0072F5" />
                    <stop offset="100%" stopColor="#8c6ef0" />
                  </linearGradient>
                  <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                {/* Orbital path */}
                <ellipse cx="50" cy="50" rx="38" ry="14" stroke="url(#logoGrad)" strokeWidth="3" strokeDasharray="3 3" fill="none" transform="rotate(-28 50 50)" opacity="0.6" />
                <ellipse cx="50" cy="50" rx="38" ry="14" stroke="url(#logoGrad)" strokeWidth="3" fill="none" transform="rotate(-28 50 50)" filter="url(#neonGlow)" />
                {/* Orbiting planet */}
                <circle cx="82" cy="35" r="5" fill="#10b981" filter="url(#neonGlow)" />
                {/* Central Letter B */}
                <circle cx="50" cy="50" r="22" fill="#FFFFFF" stroke="url(#logoGrad)" strokeWidth="3" filter="url(#neonGlow)" />
                <path d="M44 38H50C54 38 56 40 56 43C56 45 54 47 51 47.5C54.5 48 57 50.5 57 54C57 57.5 54 59.5 50 59.5H44V38ZM48 45.5V47.5H50.5C52 47.5 52.5 47 52.5 46.2C52.5 45.5 52 45.5 50.5 45.5H48ZM48 51.5V56.5H51C52.5 56.5 53 56 53 55C53 54 52.5 53.5 51 53.5H48Z" fill="#1E293B" />
              </svg>
            </div>

            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none text-slate-900 select-none">
              BetOrbit
            </h1>
          </motion.div>

          {/* Subtext */}
          <motion.p 
            variants={itemVariants} 
            className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 font-bold leading-relaxed"
          >
            Trade YES/NO shares on cryptocurrency trends, sports tournaments, global politics, and short-term rapid intervals. 100% demo coins, 100% fun, 0% financial risk.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            variants={itemVariants} 
            className="flex flex-wrap justify-center gap-4 pt-4"
          >
            <Link 
              to="/markets" 
              className="bg-[#0072F5] hover:bg-[#0062D2] text-white font-extrabold px-8 py-3 rounded-full text-sm tracking-wider flex items-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-[#0072F5]/25"
            >
              <Compass size={16} />
              Explore Markets
            </Link>
            <Link 
              to="/register" 
              className="bg-slate-200 border border-slate-300 text-slate-700 hover:bg-slate-300 hover:text-slate-900 font-extrabold px-8 py-3 rounded-full text-sm tracking-wider transition-all hover:scale-[1.03] active:scale-[0.97]"
            >
              Create Free Account
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.9 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-20 text-left z-10"
        >
          {/* Card 1 */}
          <div className="glass-panel p-6 border-slate-200/60 bg-white/60 relative overflow-hidden group hover:border-[#10b981]/50 hover:bg-white hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-md">
            <span className="absolute -left-10 -top-10 h-20 w-20 rounded-full bg-[#10b981] opacity-5 blur-2xl group-hover:opacity-10 transition-all"></span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#059669] mb-4 border border-emerald-100">
              <TrendingUp size={18} />
            </div>
            <h3 className="text-sm font-black text-slate-800 mb-2">Limit & Market Orders</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Buy and sell YES/NO outcome shares utilizing standard order matching. Exit positions before resolutions occur to secure profits.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-6 border-slate-200/60 bg-white/60 relative overflow-hidden group hover:border-[#0072F5]/50 hover:bg-white hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-md">
            <span className="absolute -left-10 -top-10 h-20 w-20 rounded-full bg-[#0072F5] opacity-5 blur-2xl group-hover:opacity-10 transition-all"></span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0072F5] mb-4 border border-blue-100">
              <Cpu size={18} />
            </div>
            <h3 className="text-sm font-black text-slate-800 mb-2">AMM Liquidity Bot</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Never wait for a counterparty. Our automated liquidity bot maintains open bid-ask books on all prediction topics, guaranteeing instant execution.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-6 border-slate-200/60 bg-white/60 relative overflow-hidden group hover:border-purple-500/50 hover:bg-white hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-md">
            <span className="absolute -left-10 -top-10 h-20 w-20 rounded-full bg-purple-500 opacity-5 blur-2xl group-hover:opacity-10 transition-all"></span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-4 border border-purple-100">
              <Award size={18} />
            </div>
            <h3 className="text-sm font-black text-slate-800 mb-2">5-Min Rapid Bets</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Trade in the fast lane. Take positions on 5-minute automated Bitcoin trend ticks resolved directly from live Binance exchange indices.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
