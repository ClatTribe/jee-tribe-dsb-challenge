import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDailyChallenge, getLeaderboard, checkAttempt } from '../services/db';
import { getDailyQuestions } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';
import { Trophy, Flame, Target, ChevronRight, Clock, BookOpen, TrendingUp, Zap, Coins, Calendar, Skull, FastForward, Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import MathText from '../components/MathRenderer';

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [challenge, setChallenge] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [hasAttemptedDaily, setHasAttemptedDaily] = useState(false);
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      try {
        // Pre-fetch daily questions to Firestore/cache
        getDailyQuestions().catch(err => console.error("Pre-fetch failed:", err));

        const [challengeData, leaderboardData, attempted] = await Promise.all([
          getDailyChallenge(today).catch(() => null),
          getLeaderboard(5).catch(() => []),
          checkAttempt(profile.uid, 'daily-mini-mock').catch(() => false)
        ]);
        setChallenge(challengeData);
        setLeaderboard(leaderboardData);
        setHasAttemptedDaily(attempted);
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      }
    };
    fetchData();
  }, [today, profile]);

  const stats = [
    { label: 'Current Streak', value: profile?.currentStreak || 0, icon: Flame, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
    { label: 'Total XP', value: profile?.totalScore || 0, icon: Trophy, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
    { label: 'Accuracy', value: `${profile?.averageAccuracy || 0}%`, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Coins', value: profile?.coins || 0, icon: Coins, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const gameModes = [
    { 
      title: 'Flashcards', 
      desc: 'Active recall revision', 
      icon: BookOpen, 
      color: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20',
      path: '/flashcards'
    },
    { 
      title: 'Sudden Death', 
      desc: '1 mistake = Game Over', 
      icon: Skull, 
      color: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20',
      path: '/sudden-death'
    },
    { 
      title: 'Skip or Solve', 
      desc: 'Identify traps quickly', 
      icon: FastForward, 
      color: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20',
      path: '/skip-strategy'
    },
    { 
      title: 'Duels', 
      desc: '1v1 Live Battles', 
      icon: Swords, 
      color: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20',
      path: '/duels'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-full border border-slate-200/50 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
          >
            <Target size={14} className="text-[#F59E0B]" /> Mission: JEE Tribe DSB
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-display font-black tracking-tighter text-slate-900 dark:text-white">
            Sup, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">{profile?.displayName?.split(' ')[0]}</span>! ✨
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Only <span className="text-amber-500 dark:text-amber-400 font-bold">84 days</span> left. Let's get this bread. 🍞</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md px-6 py-4 rounded-[2rem] border border-slate-200/50 dark:border-white/5 flex items-center gap-3 shadow-lg shadow-slate-200/20 dark:shadow-none">
            <Calendar size={20} className="text-amber-500" />
            <span className="font-black text-slate-700 dark:text-slate-200">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative z-10">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
            className="bg-white/80 dark:bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200/50 dark:border-white/5 shadow-lg shadow-slate-200/20 dark:shadow-none flex flex-col gap-4 group hover:border-amber-500/30 dark:hover:border-amber-500/30 transition-all hover:-translate-y-1"
          >
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Daily Challenge Hero */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-[#060818] rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-amber-500/10 border border-white/5"
          >
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-6 max-w-md">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <span className="bg-white/5 backdrop-blur-md text-white text-[10px] uppercase font-black px-4 py-1.5 rounded-full border border-white/10 tracking-widest">
                    🔥 JEE Mains Daily Sprint
                  </span>
                  {hasAttemptedDaily && (
                    <span className="bg-amber-500/20 text-amber-400 text-[10px] uppercase font-black px-4 py-1.5 rounded-full border border-amber-500/20 tracking-widest">
                      Completed
                    </span>
                  )}
                  <span className="text-white/40 text-xs font-bold">Director Special Batch Exclusive</span>
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl md:text-5xl font-display font-black leading-tight"
                >
                  <MathText text={challenge?.title || 'Daily DSB Challenge'} />
                </motion.h2>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap gap-6 text-slate-400"
                >
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                    <Zap size={18} className="text-amber-500" />
                    <span className="text-sm font-bold">12 Questions</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                    <Clock size={18} className="text-amber-500" />
                    <span className="text-sm font-bold">30 Minutes</span>
                  </div>
                </motion.div>
                <motion.button 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => navigate(`/test/daily-mini-mock`)}
                  className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-lg active:scale-95 ${
                    hasAttemptedDaily 
                      ? 'bg-white/10 text-white/60 border border-white/10 hover:bg-white/20' 
                      : 'btn-liquid-secondary'
                  }`}
                >
                  {hasAttemptedDaily ? 'Review / Re-attempt' : 'Start Daily Mock'} <ChevronRight size={24} />
                </motion.button>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                className="hidden md:block w-48 h-48 bg-white/10 rounded-full border-8 border-white/5 flex items-center justify-center relative"
              >
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-t-4 border-secondary/50"
                />
                  <div className="text-center relative z-10">
                    <p className="text-4xl font-black text-amber-500">+50</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">XP Reward</p>
                  </div>
                </motion.div>
              </div>
              
              {/* Decorative elements */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1] 
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" 
              />
              <motion.div 
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.1, 0.3, 0.1] 
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -left-20 -bottom-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" 
              />
            </motion.div>

          {/* Game Modes Grid */}
          <div className="relative z-10">
            <h3 className="font-display font-black text-slate-900 dark:text-white flex items-center gap-2 mb-6 text-2xl tracking-tight">
              <Zap size={28} className="text-amber-500" /> Training Modes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameModes.map((mode, i) => (
                <motion.button 
                  key={i}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(mode.path)}
                  className={`flex items-center gap-4 p-6 rounded-[2rem] border-2 border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 dark:hover:border-amber-500/30 hover:shadow-xl transition-all text-left bg-white/80 dark:bg-white/5 backdrop-blur-xl group`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${mode.color} group-hover:rotate-6 transition-transform duration-300`}>
                    <mode.icon size={28} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">{mode.title}</h4>
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{mode.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8 relative z-10">
          {/* Leaderboard Preview */}
          <div className="bg-[#060818] rounded-[2.5rem] p-8 text-white shadow-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-2xl font-display font-black tracking-tight">Global Rank</h3>
              <Trophy className="text-amber-400" size={28} />
            </div>
            <div className="space-y-6 relative z-10">
              {leaderboard.length > 0 ? leaderboard.map((user, i) => (
                <motion.div 
                  key={user.id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between group hover:bg-white/5 p-3 -mx-3 rounded-2xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-black w-4 ${i === 0 ? 'text-amber-400 text-lg' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500'}`}>{i + 1}</span>
                    <div className={`w-12 h-12 rounded-[1.25rem] border-2 flex items-center justify-center font-black text-sm transition-all duration-300 ${i === 0 ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-white/5 border-white/10 text-slate-300 group-hover:border-amber-500/50'}`}>
                      {user.displayName?.substring(0, 2).toUpperCase() || '??'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{user.displayName}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">{user.totalScore || 0} XP</p>
                    </div>
                  </div>
                  {i === 0 && <Flame size={20} className="text-amber-500 animate-pulse" />}
                </motion.div>
              )) : (
                <div className="text-center py-4 text-slate-500 text-xs">No data yet</div>
              )}
            </div>
            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-500">YOU</span>
                  <span className="text-xs font-bold">{profile?.displayName?.split(' ')[0]}</span>
                </div>
                <span className="text-xs font-black text-amber-500">{profile?.totalScore || 0} XP</span>
              </div>
            </div>
            <button className="w-full mt-6 py-4 rounded-2xl bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
              View Full Leaderboard
            </button>
          </div>

          {/* Pro Tip */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                <Zap size={16} />
              </div>
              <h4 className="font-black text-emerald-500 text-sm uppercase tracking-widest">Ranker's Tip</h4>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-400 leading-relaxed font-medium">
              "In JEE Advanced, knowing what to skip is as important as knowing what to solve. Use the 'Skip or Solve' mode to train your intuition."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
