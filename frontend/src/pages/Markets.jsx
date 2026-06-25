import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMarketStore } from '../store/marketStore.js';
import MarketCard from '../components/MarketCard.jsx';
import { 
  Search, Flame, Trophy, Zap, Landmark, Coins, Gamepad2, Globe, 
  Cpu, CloudSun, Clock, Calendar, TrendingUp, Folder, Target, 
  BarChart2, ShieldAlert, BadgeInfo
} from 'lucide-react';

export default function Markets() {
  const { markets, fetchMarkets, loading } = useMarketStore();
  const location = useLocation();
  
  // Read search param from URL (for global header search sync)
  const queryParams = new URLSearchParams(location.search);
  const urlSearch = queryParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubTopic, setSelectedSubTopic] = useState('All');
  const [search, setSearch] = useState('');

  // Reset sub-topic filter when category changes
  useEffect(() => {
    setSelectedSubTopic('All');
  }, [selectedCategory]);

  // Sync state search with URL search
  useEffect(() => {
    if (urlSearch) {
      setSearch(urlSearch);
    }
  }, [urlSearch]);

  // Horizontal Ribbon categories (React Icons)
  const categories = [
    { label: 'Trending', value: '', icon: <TrendingUp size={13} className="text-orange-500" /> },
    { label: 'World Cup', value: 'Sports', icon: <Trophy size={13} className="text-yellow-600" /> },
    { label: 'Breaking', value: 'Politics', icon: <Zap size={13} className="text-red-500" /> },
    { label: 'Politics', value: 'Politics', icon: <Landmark size={13} className="text-indigo-600" /> },
    { label: 'Sports', value: 'Sports', icon: <Trophy size={13} className="text-slate-500" /> },
    { label: 'Crypto', value: 'Crypto', icon: <Coins size={13} className="text-amber-500" /> },
    { label: 'Esports', value: 'Technology', icon: <Gamepad2 size={13} className="text-purple-600" /> },
    { label: 'Iran', value: 'Iran', icon: <Globe size={13} className="text-emerald-600" /> },
    { label: 'Finance', value: 'Crypto', icon: <Coins size={13} className="text-teal-600" /> },
    { label: 'Geopolitics', value: 'Politics', icon: <Globe size={13} className="text-blue-600" /> },
    { label: 'Tech', value: 'Technology', icon: <Cpu size={13} className="text-cyan-600" /> },
    { label: 'Weather', value: 'Weather', icon: <CloudSun size={13} className="text-sky-500" /> },
  ];

  const sidebarItemsList = [
    { label: 'All', icon: <Folder size={13} />, value: 'All' },
    { label: '5 Min', icon: <Clock size={13} />, value: '5 Min' },
    { label: '15 Min', icon: <Clock size={13} />, value: '15 Min' },
    { label: '1 Hour', icon: <Clock size={13} />, value: '1 Hour' },
    { label: '4 Hours', icon: <Clock size={13} />, value: '4 Hours' },
    { label: 'Daily', icon: <Calendar size={13} />, value: 'Daily' },
    { label: 'Weekly', icon: <BarChart2 size={13} />, value: 'Weekly' },
    { label: 'Monthly', icon: <TrendingUp size={13} />, value: 'Monthly' },
    { label: 'Yearly', icon: <Calendar size={13} />, value: 'Yearly' },
    { label: 'Targets', icon: <Target size={13} />, value: 'Targets' },
    { label: 'Pre-Market', icon: <Zap size={13} />, value: 'Pre-Market' },
    { label: 'Institutions', icon: <Landmark size={13} />, value: 'Institutions' },
    { label: 'Industry', icon: <Globe size={13} />, value: 'Industry' },
    { label: 'Protocol Metrics', icon: <Cpu size={13} />, value: 'Protocol Metrics' },
  ];

  useEffect(() => {
    const filters = {
      search: search || undefined,
    };
    if (selectedCategory) {
      filters.category = selectedCategory;
    }
    fetchMarkets(filters);
  }, [selectedCategory, search, fetchMarkets]);

  // Count helper: scans fetched markets for keywords in title/description
  const getSubTopicCount = (topicLabel) => {
    let countList = markets;
    if (selectedCategory) {
      countList = markets.filter(m => m.category === selectedCategory);
    }
    if (topicLabel === 'All') {
      return countList.length;
    }
    if (topicLabel.toLowerCase() === 'rapid 5m') {
      return countList.filter(m => m.isRapid || m.title.toLowerCase().includes('5m')).length;
    }
    return countList.filter(m => 
      m.title.toLowerCase().includes(topicLabel.toLowerCase()) ||
      m.description.toLowerCase().includes(topicLabel.toLowerCase())
    ).length;
  };

  // Grouping logic for multi-outcome target markets
  const getSidebarItemCount = (label) => {
    const query = label.toLowerCase();
    let list = markets;
    if (selectedCategory) {
      list = markets.filter(m => m.category === selectedCategory);
    }
    if (query === 'all') return list.length;
    if (query === '5 min') return list.filter(m => m.isRapid || m.title.toLowerCase().includes('5m')).length;
    if (query === '15 min') return list.filter(m => m.title.toLowerCase().includes('15m')).length;
    if (query === '1 hour') return list.filter(m => m.title.toLowerCase().includes('1h')).length;
    if (query === '4 hours') return list.filter(m => m.title.toLowerCase().includes('4h')).length;
    if (query === 'daily') return list.filter(m => m.title.toLowerCase().includes('daily')).length;
    if (query === 'weekly') return list.filter(m => m.title.toLowerCase().includes('weekly')).length;
    if (query === 'monthly') return list.filter(m => m.title.toLowerCase().includes('monthly')).length;
    {/* Dynamic mock bounds for counts */}
    if (query === 'yearly') return list.filter(m => m.title.toLowerCase().includes('yearly') || m.title.toLowerCase().includes('june')).length;
    if (query === 'targets') return list.filter(m => m.title.toLowerCase().includes('target') || m.title.toLowerCase().includes('hit') || m.title.toLowerCase().includes('above') || m.title.toLowerCase().includes('below')).length;
    if (query === 'pre-market') return list.filter(m => m.title.toLowerCase().includes('above') || m.title.toLowerCase().includes('below')).length;
    if (query === 'institutions') return list.filter(m => m.category.toLowerCase().includes('politics') || m.category.toLowerCase().includes('iran')).length;
    if (query === 'industry') return list.filter(m => m.category.toLowerCase().includes('technology') || m.category.toLowerCase().includes('sports')).length;
    if (query === 'protocol metrics') return list.filter(m => m.isRapid).length;
    return 0;
  };

  const getGroupedAndFilteredMarkets = () => {
    const groupedList = [];
    const groups = {};

    // Filter by sidebar sub-topic keyword if not 'All'
    let filtered = markets;
    if (selectedSubTopic !== 'All') {
      filtered = markets.filter(m => {
        const query = selectedSubTopic.toLowerCase();
        if (query === '5 min') return m.isRapid || m.title.toLowerCase().includes('5m');
        if (query === '15 min') return m.title.toLowerCase().includes('15m');
        if (query === '1 hour') return m.title.toLowerCase().includes('1h');
        if (query === '4 hours') return m.title.toLowerCase().includes('4h');
        if (query === 'daily') return m.title.toLowerCase().includes('daily');
        if (query === 'weekly') return m.title.toLowerCase().includes('weekly');
        if (query === 'monthly') return m.title.toLowerCase().includes('monthly');
        if (query === 'yearly') return m.title.toLowerCase().includes('yearly') || m.title.toLowerCase().includes('june');
        if (query === 'targets') return m.title.toLowerCase().includes('target') || m.title.toLowerCase().includes('hit') || m.title.toLowerCase().includes('above') || m.title.toLowerCase().includes('below');
        if (query === 'pre-market') return m.title.toLowerCase().includes('above') || m.title.toLowerCase().includes('below');
        if (query === 'institutions') return m.category.toLowerCase().includes('politics') || m.category.toLowerCase().includes('iran');
        if (query === 'industry') return m.category.toLowerCase().includes('technology') || m.category.toLowerCase().includes('sports');
        if (query === 'protocol metrics') return m.isRapid;
        
        return m.title.toLowerCase().includes(query) || m.description.toLowerCase().includes(query);
      });
    }

    filtered.forEach((m) => {
      const parts = m.title.split(' - ');
      const baseTitle = parts[0];
      const subTitle = parts[1] || null;

      if (subTitle) {
        if (!groups[baseTitle]) {
          groups[baseTitle] = {
            id: m.id,
            title: baseTitle,
            category: m.category,
            status: m.status,
            isRapid: m.isRapid,
            endTime: m.endTime,
            resolutionSource: m.resolutionSource,
            isGroup: true,
            rows: [],
          };
        }
        groups[baseTitle].rows.push({
          id: m.id,
          subTitle,
          outcomes: m.outcomes,
          status: m.status,
        });
      } else {
        groupedList.push({
          ...m,
          isGroup: false,
        });
      }
    });

    // Add grouped items
    Object.keys(groups).forEach((key) => {
      groupedList.push(groups[key]);
    });

    return groupedList;
  };

  const displayMarkets = getGroupedAndFilteredMarkets();
  const sidebarTitle = selectedCategory || 'All Markets';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Mobile search bar */}
      <div className="flex md:hidden relative mb-4">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C867A]">
          <Search size={14} />
        </span>
        <input
          type="text"
          placeholder="Search markets..."
          value={search}
          className="w-full bg-[#FAF8F5] border border-[#E1DCD3] focus:border-[#0072F5]/45 focus:outline-none rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-[#2D2A26] placeholder:text-[#8C867A]"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT STICKY SIDEBAR (Category Dynamic Sub-topics) */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-20 space-y-3">
            <div className="space-y-0.5 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
              {sidebarItemsList.map((item) => {
                const count = getSidebarItemCount(item.value);
                const isActive = selectedSubTopic === item.value;
                return (
                  <button
                    key={item.label}
                    onClick={() => setSelectedSubTopic(item.value)}
                    className={`w-full flex items-center justify-between text-[13px] font-semibold py-2.5 px-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-[#EFECE6] text-[#2D2A26] shadow-sm border border-[#D8D3C9]'
                        : 'text-[#726D64] hover:text-[#2D2A26] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm opacity-90">{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      isActive ? 'bg-[#E2F2E9] text-[#137333]' : 'bg-[#EFECE6] text-[#726D64]'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTAINER */}
        <div className="flex-grow space-y-5">
          
          {/* HORIZONTAL CATEGORY SUB-NAVBAR RIBBON (Polymarket styling) */}
          <div className="flex items-center gap-4 overflow-x-auto border-b border-[#EBE7DF] pb-3.5 scrollbar-none select-none">
            {categories.map((cat) => {
              const isActive = (selectedCategory === cat.value && cat.value !== '') || (selectedCategory === '' && cat.label === 'Trending');
              return (
                <button
                  key={cat.label}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex items-center gap-1 text-[13.5px] font-black transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'text-[#2D2A26] border-b-2 border-[#2D2A26] pb-1 font-black scale-105'
                      : 'text-[#8C867A] hover:text-[#2D2A26] pb-1'
                  }`}
                >
                  <span className="text-sm select-none">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Grid Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#EBE7DF] border-t-[#0072F5] mb-4"></div>
              <p className="text-xs text-[#726D64] font-semibold animate-pulse">Loading markets...</p>
            </div>
          ) : displayMarkets.length === 0 ? (
            <div className="glass-panel p-16 text-center text-[#726D64] border-[#EBE7DF] bg-white rounded-2xl shadow-sm">
              <p className="text-sm font-bold italic mb-1 text-slate-800">No markets found</p>
              <p className="text-[11px] text-[#8C867A]">Try selecting a different filter or clearing search tags.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayMarkets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
