import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDailyChallenge, getLeaderboard, checkAttempt } from '../services/db';
import { getDailyQuestions } from '../services/geminiService';
import { EXAM_CONFIGS } from '../services/examConfig';
import { useNavigate } from 'react-router-dom';
import { Trophy, Flame, Target, ChevronRight, Clock, BookOpen, TrendingUp, Zap, Coins, Calendar, Skull, FastForward, Swords, Map, Brain, ClipboardList, MessageCircle, Shield, Sparkles, Award, Gift, Crown } from 'lucide-react';
import ShareScoreButton from '../components/ShareScoreButton';
import { drawDashboardCard } from '../utils/shareScoreCard';
import { motion } from 'framer-motion';
import MathText from '../components/MathRenderer';
import PredictedAIRCard from '../components/PredictedAIRCard';
import PsycheBanner from '../components/PsycheBanner';
import MysteryBoxModal from '../components/MysteryBoxModal';
import { getAIRFromHistory, PredictedAIR } from '../services/airPredictionService';
import { analyzePsyche, PsycheAnalysis } from '../services/psycheService';
import { shouldShowMysteryBox, MysteryBoxReward, getStreakMultiplier } from '../services/gamificationService';
import { collection, getDocs, query, orderBy, limit as fbLimit, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../firebase';

const StudentDashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const [challenge, setChallenge] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [hasAttemptedDaily, setHasAttemptedDaily] = useState(false);
  const [predictedAIR, setPredictedAIR] = useState<PredictedAIR | null>(null);
  const [psycheAnalysis, setPsycheAnalysis] = useState<PsycheAnalysis | null>(null);
  const [showMysteryBox, setShowMysteryBox] = useState(false);
  const [dismissedPsyche, setDismissedPsyche] = useState(false);
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  // Calculate days until exam based on user's selected exam
  const daysUntilExam = React.useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Approximate exam dates (month, day) — updated yearly
    // JEE Main Session 1: ~Jan end, Session 2: ~Apr first week
    // NEET UG: ~May first week
    // CUET UG: ~May mid to June start
    const examSchedules: Record<string, Array<{ month: number; day: number }>> = {
      JEE: [
        { month: 0, day: 28 },  // Jan 28 — Session 1
        { month: 3, day: 5 },   // Apr 5 — Session 2
      ],
      NEET: [
        { month: 4, day: 4 },   // May 4
      ],
      CUET: [
        { month: 4, day: 15 },  // May 15 (start of CUET window)
      ],
    };

    const exam = profile?.exam || 'JEE';
    const schedule = examSchedules[exam] || examSchedules.JEE;

    // Find the next upcoming exam date
    let nextExamDate: Date | null = null;
    for (const { month, day } of schedule) {
      const candidate = new Date(currentYear, month, day);
      if (candidate > now) {
        nextExamDate = candidate;
        break;
      }
    }
    // If all dates this year have passed, use next year's first date
    if (!nextExamDate) {
      const first = schedule[0];
      nextExamDate = new Date(currentYear + 1, first.month, first.day);
    }

    const diffMs = nextExamDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [profile?.exam]);

  // Refresh profile on mount to pick up latest Elo, coins, streak from Firestore
  useEffect(() => {
    refreshProfile();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      try {
        // Pre-fetch daily questions to Firestore/cache
        getDailyQuestions(profile?.exam, profile?.cuetDomain).catch(err => console.error("Pre-fetch failed:", err));

        const [challengeData, leaderboardData, attempted] = await Promise.all([
          getDailyChallenge(today).catch(() => null),
          getLeaderboard(5).catch(() => []),
          checkAttempt(profile.uid, `daily-mini-mock-${today}`).catch(() => false)
        ]);
        setChallenge(challengeData);
        setLeaderboard(leaderboardData);
        setHasAttemptedDaily(attempted);

        // Fetch history for AIR prediction + Psyche analysis
        try {
          const historyRef = collection(db, 'users', profile.uid, 'history');
          const hq = query(historyRef, orderBy('timestamp', 'desc'), fbLimit(20));
          const histSnap = await getDocs(hq);
          const historyData = histSnap.docs.map(d => d.data());

          if (historyData.length > 0) {
            // AIR Prediction
            try {
              const air = getAIRFromHistory(historyData.filter(h => h.maxScore));
              setPredictedAIR(air);
            } catch (e) { /* not enough data */ }

            // Psyche Analysis
            try {
              const psyche = await analyzePsyche(historyData, profile);
              setPsycheAnalysis(psyche);
            } catch (e) { console.warn('Psyche analysis skipped:', e); }
          }
        } catch (e) { console.warn('History fetch for analytics failed:', e); }

        // Check for Mystery Box trigger
        if (shouldShowMysteryBox(profile.totalQuestionsAttempted || 0)) {
          const lastBoxKey = `mysterybox-${profile.totalQuestionsAttempted}`;
          if (!localStorage.getItem(lastBoxKey)) {
            setShowMysteryBox(true);
            localStorage.setItem(lastBoxKey, 'shown');
          }
        }
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      }
    };
    fetchData();
  }, [today, profile]);

  const predictedAIRDisplay = predictedAIR
    ? predictedAIR.predictedRank.toLocaleString('en-IN')
    : '—';

  const stats = [
    { label: 'Current Streak', value: profile?.currentStreak || 0, icon: Flame, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
    { label: 'Total XP', value: profile?.totalScore || 0, icon: Trophy, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
    { label: 'Predicted AIR', value: predictedAIRDisplay, icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-500/10' },
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
      color: 'bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/20',
      path: '/sudden-death'
    },
    {
      title: 'Skip or Solve',
      desc: 'Identify traps quickly',
      icon: FastForward,
      color: 'bg-amber-600/10 text-amber-600 dark:text-amber-500 border-amber-600/20',
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

  const handleMysteryBoxClose = async (reward: MysteryBoxReward | null) => {
    setShowMysteryBox(false);
    if (reward && profile) {
      try {
        const userRef = doc(db, 'users', profile.uid);
        if (reward.type === 'coins') {
          await updateDoc(userRef, { coins: increment(reward.amount) });
        } else if (reward.type === 'streak_shield') {
          await updateDoc(userRef, { streakFreezeAvailable: increment(1) });
        }
      } catch (e) { console.warn('Mystery box reward save failed:', e); }
    }
  };

  const streakInfo = getStreakMultiplier(profile?.currentStreak || 0);

  return (
    <div className="space-y-5 md:space-y-8 pb-12 px-1 md:px-0">
      {/* Mystery Box Modal */}
      <MysteryBoxModal isOpen={showMysteryBox} onClose={handleMysteryBoxClose} />

      {/* Psyche Banner */}
      {psycheAnalysis && !dismissedPsyche && (
        <PsycheBanner analysis={psycheAnalysis} onDismiss={() => setDismissedPsyche(true)} />
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-2">
          {/* Badge removed — clean hero */}
          <h1 className="text-3xl md:text-6xl font-display font-black tracking-tighter text-slate-900 dark:text-white">
            Sup, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">{profile?.displayName?.split(' ')[0]}</span>!{' '}
            {profile?.isPremium ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-black uppercase align-middle">
                <Crown size={14} /> Pro
              </span>
            ) : '✨'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Only <span className="text-amber-500 dark:text-amber-400 font-bold">{daysUntilExam} days</span> left. Let's get this bread. 🍞</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md px-6 py-4 rounded-[2rem] border border-slate-200/50 dark:border-white/5 flex items-center gap-3 shadow-lg shadow-slate-200/20 dark:shadow-none">
            <Calendar size={20} className="text-amber-500" />
            <span className="font-black text-slate-700 dark:text-slate-200">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 relative z-10">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
            className="bg-white/80 dark:bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-xl md:rounded-[2rem] border border-slate-200/50 dark:border-white/5 shadow-lg shadow-slate-200/20 dark:shadow-none flex flex-col gap-2 md:gap-4 group hover:border-amber-500/30 dark:hover:border-amber-500/30 transition-all hover:-translate-y-1"
          >
            <div className={`w-10 h-10 md:w-14 md:h-14 ${stat.bg} ${stat.color} rounded-xl md:rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
              <stat.icon size={20} className="md:hidden" />
              <stat.icon size={28} className="hidden md:block" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5 md:mb-1">{stat.label}</p>
              <p className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
              {i === 0 && (
                <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 mt-2">
                  Grace: 2/mo • Freezes: buy with coins
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Share Daily Stats */}
      <div className="relative z-10">
        <div className="max-w-xs">
          <ShareScoreButton
            generateImage={() => drawDashboardCard({
              userName: profile?.displayName || 'Student',
              currentStreak: profile?.currentStreak || 0,
              totalXP: profile?.totalScore || 0,
              coins: profile?.coins || 0,
              predictedAIR: predictedAIR?.predictedRank || null,
              airCategory: predictedAIR?.category || null,
            })}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Daily Challenge Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/5 rounded-xl md:rounded-[2.5rem] p-5 md:p-12 text-slate-900 dark:text-white relative overflow-hidden shadow-2xl shadow-amber-500/10 dark:shadow-none border border-amber-200 dark:border-amber-500/20"
          >
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-6 max-w-md">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <span className="bg-amber-100/80 dark:bg-amber-500/20 backdrop-blur-md text-amber-900 dark:text-amber-300 text-[10px] uppercase font-black px-4 py-1.5 rounded-full border border-amber-200 dark:border-amber-500/30 tracking-widest">
                    🔥 {profile?.exam ? EXAM_CONFIGS[profile.exam]?.mockTitle : 'Daily Sprint'}
                  </span>
                  {hasAttemptedDaily && (
                    <span className="bg-amber-200/80 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 text-[10px] uppercase font-black px-4 py-1.5 rounded-full border border-amber-300 dark:border-amber-500/30 tracking-widest">
                      Completed
                    </span>
                  )}
                  <span className="text-amber-700/60 dark:text-amber-500/60 text-xs font-bold">PrepTribe Exclusive</span>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl md:text-5xl font-display font-black leading-tight"
                >
                  <MathText text={challenge?.title || 'Daily DSB Challenge'} />
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap gap-6 text-slate-600 dark:text-slate-400"
                >
                  <div className="flex items-center gap-2 bg-amber-100/60 dark:bg-white/10 px-3 py-1.5 rounded-xl border border-amber-200/80 dark:border-white/10">
                    <Zap size={18} className="text-amber-600 dark:text-amber-500" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">12 Questions</span>
                  </div>
                  <div className="flex items-center gap-2 bg-amber-100/60 dark:bg-white/10 px-3 py-1.5 rounded-xl border border-amber-200/80 dark:border-white/10">
                    <Clock size={18} className="text-amber-600 dark:text-amber-500" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">30 Minutes</span>
                  </div>
                </motion.div>
                <motion.button 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => navigate(`/test/daily-mini-mock`)}
                  className={`flex items-center gap-2 md:gap-3 px-6 md:px-10 py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-sm md:text-lg active:scale-95 ${
                    hasAttemptedDaily
                      ? 'bg-amber-100 dark:bg-white/10 text-amber-800 dark:text-white/60 border border-amber-200 dark:border-white/10 hover:bg-amber-200 dark:hover:bg-white/20'
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
                className="hidden md:block w-48 h-48 bg-amber-100/40 dark:bg-amber-500/10 rounded-full border-8 border-amber-200/60 dark:border-amber-500/20 flex items-center justify-center relative"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-t-4 border-amber-500/50 dark:border-secondary/50"
                />
                  <div className="text-center relative z-10">
                    <p className="text-4xl font-black text-amber-600 dark:text-amber-500">+50</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700/60 dark:text-slate-500">XP Reward</p>
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
            <h3 className="font-display font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4 md:mb-6 text-xl md:text-2xl tracking-tight">
              <Zap size={22} className="text-amber-500 md:hidden" />
              <Zap size={28} className="text-amber-500 hidden md:block" />
              Training Modes
            </h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {gameModes.map((mode, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(mode.path)}
                  className={`flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4 p-4 md:p-6 rounded-xl md:rounded-[2rem] border-2 border-l-4 border-slate-200/50 dark:border-white/5 border-l-amber-500 dark:border-l-amber-500 hover:border-amber-500/30 dark:hover:border-amber-500/30 hover:shadow-xl transition-all text-center md:text-left bg-white/80 dark:bg-white/5 backdrop-blur-xl group`}
                >
                  <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 ${mode.color} group-hover:rotate-6 transition-transform duration-300`}>
                    <mode.icon size={20} className="md:hidden" />
                    <mode.icon size={28} className="hidden md:block" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm md:text-lg tracking-tight">{mode.title}</h4>
                    <p className="text-[8px] md:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{mode.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* AI-Powered Features */}
          <div className="relative z-10">
            <h3 className="font-display font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4 md:mb-6 text-xl md:text-2xl tracking-tight">
              <Sparkles size={22} className="text-amber-500 md:hidden" />
              <Sparkles size={28} className="text-amber-500 hidden md:block" />
              AI Coach Tools
            </h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {[
                {
                  title: 'Topic Mastery',
                  desc: 'Your strength map',
                  icon: Map,
                  color: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20',
                  path: '/mastery-map',
                },
                {
                  title: 'Meri Report',
                  desc: 'Weekly AI diagnosis',
                  icon: Brain,
                  color: 'bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/20',
                  path: '/meri-report',
                },
                {
                  title: 'Aaj Ka Plan',
                  desc: 'Personalized schedule',
                  icon: ClipboardList,
                  color: 'bg-amber-600/10 text-amber-600 dark:text-amber-500 border-amber-600/20',
                  path: '/aaj-ka-plan',
                },
                {
                  title: 'Doubt Samjhao',
                  desc: 'AI tutor for doubts',
                  icon: MessageCircle,
                  color: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20',
                  path: '/doubt-samjhao',
                },
              ].map((feature, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(feature.path)}
                  className={`flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4 p-4 md:p-6 rounded-xl md:rounded-[2rem] border-2 border-dashed border-slate-200/70 dark:border-white/10 hover:border-amber-500/30 dark:hover:border-amber-500/30 hover:shadow-xl transition-all text-center md:text-left bg-white/80 dark:bg-white/5 backdrop-blur-xl group relative`}
                >
                  <div className="absolute top-2 right-2 bg-amber-500/20 dark:bg-amber-500/30 text-amber-700 dark:text-amber-400 text-[7px] font-black px-2 py-1 rounded-md border border-amber-500/30 uppercase tracking-widest">AI</div>
                  <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 ${feature.color} group-hover:rotate-6 transition-transform duration-300`}>
                    <feature.icon size={20} className="md:hidden" />
                    <feature.icon size={28} className="hidden md:block" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm md:text-lg tracking-tight">{feature.title}</h4>
                    <p className="text-[8px] md:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{feature.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-8 relative z-10">
          {/* Leaderboard Preview */}
          <div className="bg-white dark:bg-white/5 rounded-xl md:rounded-[2.5rem] p-5 md:p-8 text-slate-900 dark:text-white shadow-2xl dark:shadow-none border border-amber-200 dark:border-white/10 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 dark:bg-amber-500/5 rounded-full blur-3xl" />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-2xl font-display font-black tracking-tight">Global Rank</h3>
              <Trophy className="text-amber-500 dark:text-amber-400" size={28} />
            </div>
            <div className="space-y-6 relative z-10">
              {leaderboard.length > 0 ? leaderboard.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between group hover:bg-amber-50/60 dark:hover:bg-white/5 p-3 -mx-3 rounded-2xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-black w-4 ${i === 0 ? 'text-amber-500 dark:text-amber-400 text-lg' : i === 1 ? 'text-slate-400 dark:text-slate-300' : i === 2 ? 'text-amber-600 dark:text-amber-600' : 'text-slate-500 dark:text-slate-500'}`}>{i + 1}</span>
                    <div className={`w-12 h-12 rounded-[1.25rem] border-2 flex items-center justify-center font-black text-sm transition-all duration-300 ${i === 0 ? 'bg-amber-500/20 border-amber-500/50 text-amber-600 dark:bg-amber-500/20 dark:border-amber-500/50 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-100/50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 group-hover:border-amber-500/50'}`}>
                      {user.displayName?.substring(0, 2).toUpperCase() || '??'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{user.displayName}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">{user.totalScore || 0} XP</p>
                    </div>
                  </div>
                  {i === 0 && <Flame size={20} className="text-amber-500 dark:text-amber-500 animate-pulse" />}
                </motion.div>
              )) : (
                <div className="text-center py-4 text-slate-500 dark:text-slate-500 text-xs">No data yet</div>
              )}
            </div>
            <div className="mt-8 pt-8 border-t border-amber-200 dark:border-white/5">
              <div className="flex items-center justify-between bg-amber-100/40 dark:bg-white/5 p-4 rounded-2xl border border-amber-200 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-600 dark:text-slate-500">YOU</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200">{profile?.displayName?.split(' ')[0]}</span>
                </div>
                <span className="text-xs font-black text-amber-600 dark:text-amber-500">{profile?.totalScore || 0} XP</span>
              </div>
            </div>
            <button className="w-full mt-6 py-4 rounded-2xl bg-amber-100/60 dark:bg-white/5 text-slate-700 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 dark:hover:bg-white/10 transition-colors">
              View Full Leaderboard
            </button>
          </div>

          {/* Predicted AIR Card */}
          {predictedAIR && (
            <PredictedAIRCard airData={predictedAIR} compact />
          )}

          {/* Elo / Skill Rating removed */}

          {/* Streak Multiplier Badge */}
          {streakInfo.multiplier > 1 && (
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-amber-400">{streakInfo.multiplier}x</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coin Multiplier Active</p>
              {streakInfo.nextTier && (
                <p className="text-[9px] text-slate-500 font-bold mt-1">
                  Next: {streakInfo.nextTier.multiplier}x at {streakInfo.nextTier.days} days
                </p>
              )}
            </div>
          )}

          {/* Pro Tip */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl md:rounded-[2rem] p-4 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white">
                <Zap size={16} />
              </div>
              <h4 className="font-black text-amber-500 text-sm uppercase tracking-widest">Ranker's Tip</h4>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-400 leading-relaxed font-medium">
              "Knowing what to skip is as important as knowing what to solve. Use the 'Skip or Solve' mode to train your intuition."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
