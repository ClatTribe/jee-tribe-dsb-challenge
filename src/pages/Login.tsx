import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Flame, Trophy, Award, BarChart3, BookOpen, Zap, ChevronRight, ArrowRight, Target, Brain, Users, Star, Shield, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const },
  }),
};

/* ── SLIDE 1: Mock Test UI ── */
const MockTestSlide = () => (
  <div className="relative bg-gradient-to-br from-[#0c1a2e] to-[#080e1c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/40">
    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-b border-white/5 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
          <span className="font-black text-[10px] text-[#060818]">PT</span>
        </div>
        <div>
          <p className="text-xs font-black text-white">Daily Mini Mock</p>
          <p className="text-[10px] text-slate-500">Physics • Chemistry • Maths / Bio</p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
        <span className="text-[10px] font-black text-orange-400">18:42</span>
      </div>
    </div>
    <div className="px-6 py-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full">Q7 / 12</span>
        <span className="bg-amber-500/5 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">Physics</span>
        <span className="bg-orange-500/10 text-orange-400 text-[10px] font-black px-2 py-0.5 rounded-full">+4 / −1</span>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">
        A particle moves in a circle of radius <span className="text-amber-400 font-mono">R</span> with constant speed. The magnitude of average velocity in half revolution is:
      </p>
      <div className="space-y-2.5 pt-1">
        {[
          { label: 'A', text: '2v / π', active: false },
          { label: 'B', text: '2R / πt', active: true },
          { label: 'C', text: 'v / 2', active: false },
          { label: 'D', text: 'πR / t', active: false },
        ].map((opt) => (
          <div key={opt.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${opt.active ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5' : 'bg-white/[0.02] border-white/5'}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${opt.active ? 'bg-amber-500 text-[#060818]' : 'bg-white/5 text-slate-500'}`}>{opt.label}</div>
            <span className={`text-sm font-mono ${opt.active ? 'text-amber-300 font-bold' : 'text-slate-400'}`}>{opt.text}</span>
            {opt.active && <div className="ml-auto w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center"><svg className="w-3 h-3 text-[#060818]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div>}
          </div>
        ))}
      </div>
    </div>
    <div className="border-t border-white/5 px-6 py-4 flex items-center justify-between bg-white/[0.01]">
      <div className="flex -space-x-1">
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`w-5 h-5 rounded-md border text-[8px] font-black flex items-center justify-center ${i < 6 ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : i === 6 ? 'bg-amber-500 border-amber-400 text-[#060818]' : 'bg-white/5 border-white/10 text-slate-600'}`}>{i + 1}</div>
        ))}
      </div>
      <div className="bg-amber-500 text-[#060818] px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider">Next →</div>
    </div>
  </div>
);

/* ── SLIDE 2: Performance Analytics ── */
const AnalyticsSlide = () => {
  const bars = [65, 82, 45, 90, 73, 88, 56, 95, 70, 84];
  const subjects = [
    { name: 'Physics', score: 87 },
    { name: 'Chemistry', score: 72 },
    { name: 'Maths', score: 94 },
  ];
  return (
    <div className="relative bg-gradient-to-br from-[#0c1a2e] to-[#080e1c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/40">
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
            <BarChart3 size={14} className="text-[#060818]" />
          </div>
          <div>
            <p className="text-xs font-black text-white">Performance Analytics</p>
            <p className="text-[10px] text-slate-500">Last 10 Mock Tests</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
          <TrendingUp size={10} className="text-amber-400" />
          <span className="text-[10px] font-black text-amber-400">+12.4%</span>
        </div>
      </div>
      <div className="px-6 py-5 space-y-5">
        {/* Score Trend Chart */}
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Score Trend</p>
          <div className="flex items-end gap-1.5 h-24">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full rounded-t-md ${i === bars.length - 1 ? 'bg-gradient-to-t from-amber-500 to-amber-400' : 'bg-gradient-to-t from-amber-500/30 to-orange-400/50'}`} style={{ height: `${h}%` }} />
                <span className="text-[8px] text-slate-600">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Subject Breakdown */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject Breakdown</p>
          {subjects.map((s) => (
            <div key={s.name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">{s.name}</span>
                <span className="text-xs font-black text-white">{s.score}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${s.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/5 px-6 py-4 flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1.5"><Clock size={12} /><span className="text-[10px] font-bold">Avg: 1.2 min/Q</span></div>
          <div className="flex items-center gap-1.5"><Target size={12} /><span className="text-[10px] font-bold">Accuracy: 84%</span></div>
        </div>
        <div className="bg-amber-500 text-[#060818] px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider">Full Report</div>
      </div>
    </div>
  );
};

/* ── SLIDE 3: Flashcards / Study Modes ── */
const FlashcardsSlide = () => {
  const modes = [
    { icon: <Zap size={16} />, name: 'Sudden Death', desc: '1 wrong = game over', wins: '23 streak' },
    { icon: <Brain size={16} />, name: 'Flashcards', desc: 'Spaced repetition', wins: '340 cards' },
    { icon: <Users size={16} />, name: 'Live Duels', desc: '1v1 real-time battles', wins: '18 wins' },
    { icon: <Target size={16} />, name: 'Skip or Solve', desc: 'Risk-reward strategy', wins: '156 pts' },
  ];
  return (
    <div className="relative bg-gradient-to-br from-[#0c1a2e] to-[#080e1c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/40">
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
            <BookOpen size={14} className="text-[#060818]" />
          </div>
          <div>
            <p className="text-xs font-black text-white">Game Modes</p>
            <p className="text-[10px] text-slate-500">5 Ways to Master Your Exam</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
          <Flame size={10} className="text-amber-400" />
          <span className="text-[10px] font-black text-amber-400">14 Day Streak</span>
        </div>
      </div>
      <div className="px-6 py-5 space-y-3">
        {modes.map((m) => (
          <div key={m.name} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/20 transition-all group">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-[#060818] shadow-lg shadow-amber-500/20">
              {m.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-white">{m.name}</p>
              <p className="text-[11px] text-slate-500">{m.desc}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-amber-400">{m.wins}</p>
              <div className="flex gap-0.5 mt-1 justify-end">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < 4 ? 'bg-amber-500' : 'bg-white/10'}`} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 px-6 py-4 flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <CheckCircle size={12} className="text-amber-400" />
          <span className="text-[10px] font-bold text-slate-400">47 sessions this week</span>
        </div>
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-[#060818] px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider">Play Now</div>
      </div>
    </div>
  );
};

/* ── HERO CAROUSEL ── */
const HeroCarousel = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [<MockTestSlide key={0} />, <AnalyticsSlide key={1} />, <FlashcardsSlide key={2} />];
  const labels = ['Mock Test', 'Analytics', 'Game Modes'];
  const colors = ['bg-amber-500', 'bg-amber-500', 'bg-amber-500'];

  useEffect(() => {
    const timer = setInterval(() => setActiveSlide((p) => (p + 1) % 3), 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative hidden md:block"
    >
      {/* Glow behind cards */}
      <div className="absolute -inset-8 rounded-[3rem] blur-3xl pointer-events-none bg-amber-500/8" />

      {/* Carousel slides */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, x: 60, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.96 }}
            transition={{ duration: 0.4, ease: 'easeInOut' as const }}
          >
            {slides[activeSlide]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Carousel indicators */}
      <div className="flex items-center justify-center gap-3 mt-6">
        {labels.map((label, i) => (
          <button
            key={label}
            onClick={() => setActiveSlide(i)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              i === activeSlide
                ? `${colors[i]} text-[#060818] shadow-lg`
                : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${i === activeSlide ? 'bg-[#060818]' : 'bg-slate-600'}`} />
            {label}
          </button>
        ))}
      </div>

      {/* Floating stat card */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' as const }}
        className="absolute -bottom-6 -left-6 bg-[#0c1829]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <Trophy size={20} className="text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Daily Top Scorer</p>
            <p className="text-lg font-black text-white">99.98 Percentile</p>
          </div>
        </div>
      </motion.div>

      {/* Floating accuracy card */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' as const }}
        className="absolute -top-4 -right-4 bg-[#0c1829]/95 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-4 shadow-2xl z-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <Target size={20} className="text-orange-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Accuracy</p>
            <p className="text-lg font-black text-white">94.2%</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Login = () => {
  const { loginWithGoogle, user } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (user) {
      // Redirect to the page they were trying to visit, or default to home
      const from = (location.state as any)?.from?.pathname || '/';
      const search = (location.state as any)?.from?.search || '';
      navigate(from + search, { replace: true });
    }
  }, [user, navigate, location.state]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060818] text-white overflow-x-hidden">
      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-[#060818]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img src="/preptribe-white.svg" alt="PrepTribe Logo" className="h-36 w-auto object-contain" />
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#stories" className="hover:text-white transition-colors">Success Stories</a>
          </div>

          {/* Right: Product Switcher + CTA */}
          <div className="flex items-center gap-3">
            {/* Product Tabs */}
            <div className="hidden md:flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid rgba(99, 102, 241, 0.1)' }}>
              {[
                { id: 'edunext', label: 'EduNext', url: 'https://getedunext.com' },
                { id: 'preptribe', label: 'PrepTribe', url: 'https://jeetribechallenge.getedunext.com' },
                { id: 'schooltribe', label: 'SchoolTribe', url: 'https://vidyaa-rho.vercel.app' },
              ].map((p) => {
                const isActive = p.id === 'preptribe';
                return (
                  <a
                    key={p.id}
                    href={p.url}
                    className="px-4 py-2 text-xs font-bold tracking-wide transition-all duration-200"
                    style={{
                      color: isActive ? '#F59E0B' : '#94a3b8',
                      backgroundColor: isActive ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                      borderBottom: isActive ? '2px solid #F59E0B' : '2px solid transparent',
                    }}
                  >
                    {p.label}
                  </a>
                );
              })}
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="bg-amber-500 hover:bg-amber-400 text-[#060818] px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isLoggingIn ? 'Connecting...' : 'Join Elite'}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Rich gradient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] bg-gradient-to-tl from-orange-600/15 via-amber-500/10 to-transparent rounded-full blur-[120px]" />
          <div className="absolute top-[30%] right-[20%] w-[30%] h-[40%] bg-gradient-to-b from-amber-500/8 to-transparent rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-32 relative">

        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full">
                Advanced Learning Framework
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight"
            >
              Conquer Your Exam
              <br />
              <span className="text-amber-500">with PrepTribe</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-slate-400 text-lg leading-relaxed max-w-lg"
            >
              The only gamified mock test platform for JEE, NEET & CUET aspirants. Precision-engineered simulations that turn preparation into performance.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="bg-amber-500 hover:bg-amber-400 text-[#060818] px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoggingIn ? (
                  <div className="w-5 h-5 border-2 border-[#060818] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap size={18} />
                )}
                Start Free Mock Test
              </button>
              <a
                href="#features"
                className="border border-white/20 hover:border-white/40 text-white px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all hover:bg-white/5 flex items-center gap-2"
              >
                View Features <ArrowRight size={16} />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap gap-3"
            >
              {['JEE Mains & Advanced', 'NEET UG', 'CUET UG'].map((exam) => (
                <span key={exam} className="bg-white/5 border border-white/10 text-slate-400 text-xs font-bold px-4 py-2 rounded-full">
                  {exam}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Hero Visual — Carousel with 3 slides */}
          <HeroCarousel />
        </div>
        </div>
      </section>

      {/* ── LEARN LIKE A CHAMPION ── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Learn Like a Champion</h2>
            <p className="text-slate-400 mt-2">Your progress is your power. Stay consistent to unlock Elite rewards.</p>
          </div>
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-amber-400 text-xs font-black uppercase tracking-widest">3,429 Aspirants Online</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Daily Streaks Card */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 relative overflow-hidden"
          >
            <Flame size={18} className="text-amber-500 mb-2" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Daily Streaks</p>
            <p className="text-5xl font-black">14 <span className="text-lg text-slate-500">Days</span></p>
            <div className="w-1/3 h-1 bg-amber-500 rounded-full mt-4 mb-4" />
            <p className="text-sm text-slate-400">6 more days to unlock the <span className="text-amber-400 font-bold">"Atomic Scholar"</span> badge.</p>
            <Flame size={80} className="absolute top-4 right-4 text-white/[0.03]" />
          </motion.div>

          {/* Top Rankers Card */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-8"
          >
            <Trophy size={18} className="text-amber-500 mb-2" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Top Rankers</p>
            <div className="space-y-4">
              {[
                { rank: 1, name: 'Aditya Verma', pts: 995 },
                { rank: 2, name: 'Isha Singh', pts: 982 },
                { rank: 3, name: 'Rohan K.', pts: 965 },
              ].map((r) => (
                <div key={r.rank} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center text-xs font-black">{r.rank}</span>
                    <span className="font-bold text-sm text-slate-300">{r.name}</span>
                  </div>
                  <span className="text-amber-400 font-black text-sm">{r.pts} pts</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Achievements Card */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-8"
          >
            <Award size={18} className="text-amber-500 mb-2" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Achievements</p>
            <div className="flex gap-4 mb-6">
              {[
                { icon: <Zap size={20} />, label: 'Rapid Fire', unlocked: true },
                { icon: <Target size={20} />, label: 'Deep Diver', unlocked: true },
                { icon: <Shield size={20} />, label: 'Marathon', unlocked: false },
              ].map((a, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${a.unlocked ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-slate-600'}`}>
                    {a.icon}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{a.label}</span>
                </div>
              ))}
            </div>
            <button className="text-amber-400 text-[10px] font-black uppercase tracking-widest hover:text-amber-300 transition-colors">
              View All 12 Medals
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── RIGOR. RESULTS. REPEAT. ── */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-black tracking-tight">Rigor. Results. Repeat.</h2>
          <div className="w-16 h-1 bg-amber-500 rounded-full mx-auto mt-4" />
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <BookOpen size={24} />,
              title: 'Elite Questions',
              desc: 'Curated by top-tier alumni, our question bank targets the conceptual depths frequently tested in JEE, NEET & CUET.',
            },
            {
              icon: <BarChart3 size={24} />,
              title: 'Precision Analytics',
              desc: 'Get pinpoint feedback on speed, accuracy, and topic-wise mastery. Visualize your path to the 99th percentile.',
            },
            {
              icon: <Brain size={24} />,
              title: 'Step-by-Step Solutions',
              desc: "Don't just see the answer. Understand the logic with interactive, visual explanations for every complex problem.",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 hover:border-amber-500/30 transition-colors group"
            >
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-xl font-black mb-3">{f.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SUCCESS STORIES ── */}
      <section id="stories" className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Success Stories</h2>
          <span className="text-amber-400 text-xs font-black uppercase tracking-widest mt-2 md:mt-0">From Aspirants to Toppers</span>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              quote: "The precision analytics changed how I revised. I stopped guessing and started targeting my weaknesses. AIR 452 wouldn't be possible without PrepTribe.",
              name: 'Vikram Aditya',
              college: 'IIT Bombay, CSE',
              initials: 'VA',
            },
            {
              quote: "The gamified approach kept me hooked even on days I felt burnt out. Those daily streaks actually made me look forward to mock tests.",
              name: 'Sneha Verma',
              college: 'IIT Delhi, Electrical',
              initials: 'SV',
            },
            {
              quote: "As a NEET aspirant, finding quality Biology MCQs was hard. PrepTribe's AI generates fresh questions daily and the analytics helped me focus on my weak chapters.",
              name: 'Priya Sharma',
              college: 'AIIMS Delhi, MBBS',
              initials: 'PS',
            },
          ].map((t, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              className="flex gap-6 items-start"
            >
              <div className="shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center text-white font-black text-lg relative">
                  {t.initials}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-lg flex items-center justify-center">
                    <Star size={10} className="text-[#060818]" />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-slate-300 italic leading-relaxed mb-4">"{t.quote}"</p>
                <p className="font-black text-white">{t.name}</p>
                <p className="text-amber-400 text-xs font-black uppercase tracking-widest">{t.college}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-amber-500 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-400/50 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-[#060818] tracking-tight mb-4">
              Your Journey to the Top Starts Here
            </h2>
            <p className="text-[#060818]/70 text-lg max-w-xl mx-auto mb-8">
              Join aspirants across JEE, NEET & CUET who are already transforming their prep. Get your first comprehensive analysis report today for free.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="bg-[#060818] hover:bg-[#0a1020] text-white px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50"
              >
                {isLoggingIn ? 'Connecting...' : 'Create Account'}
              </button>
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-[#060818]/30 hover:border-[#060818]/60 text-[#060818] px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all hover:bg-[#060818]/5"
              >
                Talk to a Mentor
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="font-black text-xs text-[#060818]">PT</span>
            </div>
            <span className="text-sm font-bold text-slate-500">PrepTribe by EduNext</span>
          </div>
          <p className="text-slate-600 text-xs font-bold">Built for warriors. Powered by AI.</p>
        </div>
      </footer>

      {/* Pulse animation for hero rings */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default Login;
