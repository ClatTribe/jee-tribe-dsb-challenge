import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, orderBy, limit as fbLimit } from 'firebase/firestore';
import { db } from '../firebase';
import { generateDailyPlan, DailyPlan } from '../services/aiService';
import MathText from '../components/MathRenderer';
import { motion } from 'framer-motion';
import { ArrowLeft, Sun, Target, Coffee, Moon, Sparkles, RefreshCw, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AajKaPlan = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [completedBlocks, setCompletedBlocks] = useState<Set<string>>(new Set());

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const dayOfWeek = dayNames[today.getDay()];
  const dateStr = today.toISOString().split('T')[0];

  // Load completed blocks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`plan_completed_${dateStr}`);
    if (saved) {
      setCompletedBlocks(new Set(JSON.parse(saved)));
    }
  }, [dateStr]);

  const toggleBlock = (blockId: string) => {
    setCompletedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      localStorage.setItem(`plan_completed_${dateStr}`, JSON.stringify([...next]));
      return next;
    });
  };

  const fetchPlan = async (forceRegenerate = false) => {
    if (!profile?.uid) return;

    // Check cache
    if (!forceRegenerate) {
      const cached = localStorage.getItem(`daily_plan_${profile.uid}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed._date === dateStr) {
            setPlan(parsed.plan);
            setLoading(false);
            return;
          }
        } catch (e) { /* ignore */ }
      }
    }

    setGenerating(true);

    try {
      // Get recent history to determine weak areas
      const historyRef = collection(db, 'users', profile.uid, 'history');
      const q = query(historyRef, orderBy('timestamp', 'desc'), fbLimit(20));
      const snap = await getDocs(q);

      const recentHistory = snap.docs.map(doc => doc.data());

      // Extract weak topics from recent attempts
      const weakTopics: string[] = [];
      recentHistory.forEach(h => {
        const breakdown = h.subjectBreakdown;
        if (!breakdown) return;
        Object.entries(breakdown).forEach(([subject, stats]: [string, any]) => {
          if (stats.wrong > stats.correct) {
            weakTopics.push(subject);
          }
        });
      });

      const result = await generateDailyPlan(
        profile.displayName || 'Student',
        [...new Set(weakTopics)],
        recentHistory,
        profile.currentStreak || 0,
        dayOfWeek,
        profile.exam,
        profile.cuetDomains || (profile.cuetDomain ? [profile.cuetDomain] : undefined)
      );

      setPlan(result);

      // Cache
      localStorage.setItem(`daily_plan_${profile.uid}`, JSON.stringify({
        plan: result,
        _date: dateStr,
      }));
    } catch (error) {
      console.error('Error generating plan:', error);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20"
        >
          <Sun size={24} />
        </motion.div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
          {generating ? 'AI Planning Your Day...' : 'Loading Plan...'}
        </p>
      </div>
    );
  }

  if (!plan) return null;

  const blocks = [
    {
      id: 'morning',
      icon: Sun,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      time: '6:00 - 6:20 AM',
      ...plan.morningWarmup,
    },
    {
      id: 'main',
      icon: Target,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      time: '4:00 - 5:00 PM',
      ...plan.mainPractice,
    },
    {
      id: 'afternoon',
      icon: Coffee,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      time: '5:30 - 6:00 PM',
      ...plan.afternoonTarget,
    },
    {
      id: 'evening',
      icon: Moon,
      iconColor: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20',
      time: '9:00 - 9:20 PM',
      ...plan.eveningRecall,
    },
  ];

  const completedCount = completedBlocks.size;
  const progress = (completedCount / 4) * 100;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/80 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 flex items-center justify-center hover:scale-110 transition-transform">
            <ArrowLeft size={20} className="text-slate-500" />
          </button>
          <div>
            <h1 className="text-2xl md:text-4xl font-display font-black tracking-tighter text-slate-900 dark:text-white">
              Aaj Ka Plan 📋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{dayOfWeek}, {today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
        <button
          onClick={() => fetchPlan(true)}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 rounded-full text-xs font-black hover:bg-amber-500/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Planning...' : 'New Plan'}
        </button>
      </div>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5"
      >
        <div className="text-lg font-bold text-slate-700 dark:text-slate-300"><MathText text={plan.greeting} /></div>
      </motion.div>

      {/* Progress Bar */}
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/50 dark:border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Today's Progress</span>
          <span className="text-sm font-black text-amber-500">{completedCount}/4 blocks done</span>
        </div>
        <div className="w-full h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {completedCount === 4 && (
          <p className="text-xs font-bold text-emerald-500 mt-2 text-center">🎉 All blocks completed! +{plan.estimatedXP} XP earned today!</p>
        )}
      </div>

      {/* Schedule Blocks */}
      <div className="space-y-4">
        {blocks.map((block, i) => {
          const isCompleted = completedBlocks.has(block.id);
          const Icon = block.icon;

          return (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl border-2 overflow-hidden transition-all ${
                isCompleted ? 'border-emerald-500/30 opacity-80' : block.borderColor
              }`}
            >
              {/* Block Header */}
              <div className="p-5 flex items-start gap-4">
                <button
                  onClick={() => toggleBlock(block.id)}
                  className="mt-1 shrink-0"
                >
                  {isCompleted ? (
                    <CheckCircle2 size={24} className="text-emerald-500" />
                  ) : (
                    <Circle size={24} className="text-slate-300 dark:text-slate-600 hover:text-amber-500 transition-colors" />
                  )}
                </button>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${block.bgColor} ${block.iconColor} rounded-xl flex items-center justify-center`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h4 className={`font-black text-slate-900 dark:text-white ${isCompleted ? 'line-through opacity-60' : ''}`}>
                          {block.title}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400">{block.time} · {block.duration}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`text-sm text-slate-600 dark:text-slate-400 font-medium ${isCompleted ? 'line-through opacity-60' : ''}`}>
                    <MathText text={block.description} />
                  </div>

                  {/* Topics/Subjects tags */}
                  {'topics' in block && (block as any).topics && (
                    <div className="flex flex-wrap gap-1">
                      {(block as any).topics.map((t: string, idx: number) => (
                        <span key={idx} className={`text-[10px] font-bold ${block.bgColor} ${block.iconColor} px-2 py-0.5 rounded-full`}>{t}</span>
                      ))}
                    </div>
                  )}
                  {'subjects' in block && (block as any).subjects && (
                    <div className="flex flex-wrap gap-2">
                      {(block as any).subjects.map((s: any, idx: number) => (
                        <span key={idx} className="text-[10px] font-bold bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">
                          {s.subject}: {s.questionCount}Q on {s.topics?.join(', ')}
                        </span>
                      ))}
                    </div>
                  )}
                  {'focusArea' in block && (block as any).focusArea && (
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">
                      Focus: {(block as any).focusArea}
                    </span>
                  )}
                  {'revisionTopics' in block && (block as any).revisionTopics && (
                    <div className="flex flex-wrap gap-1">
                      {(block as any).revisionTopics.map((t: string, idx: number) => (
                        <span key={idx} className="text-[10px] font-bold bg-violet-500/10 text-violet-500 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Estimated XP */}
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-500">Estimated XP for completing all blocks</span>
        <span className="text-lg font-black text-amber-500">+{plan.estimatedXP} XP</span>
      </div>

      {/* Motivational Quote */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-2xl p-6 text-center"
      >
        <Sparkles size={24} className="text-violet-500 mx-auto mb-3" />
        <div className="text-base font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic">"<MathText text={plan.motivationalQuote} />"</div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/test/daily-mini-mock')}
          className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center gap-2 text-amber-500 font-black text-sm hover:bg-amber-500/20 transition-colors"
        >
          Start Daily Mock <ChevronRight size={16} />
        </button>
        <button
          onClick={() => navigate('/flashcards')}
          className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center gap-2 text-emerald-500 font-black text-sm hover:bg-emerald-500/20 transition-colors"
        >
          Quick Flashcards <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default AajKaPlan;
