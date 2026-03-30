import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, orderBy, limit as fbLimit, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { generateWeeklyReport, WeeklyReport } from '../services/aiService';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Brain, Target, BookOpen, Clock, Sparkles, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GRADE_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  'A+': { bg: 'bg-emerald-500', text: 'text-emerald-500', ring: 'ring-emerald-500/30' },
  'A': { bg: 'bg-emerald-500', text: 'text-emerald-500', ring: 'ring-emerald-500/30' },
  'B+': { bg: 'bg-amber-500', text: 'text-amber-500', ring: 'ring-amber-500/30' },
  'B': { bg: 'bg-amber-500', text: 'text-amber-500', ring: 'ring-amber-500/30' },
  'C+': { bg: 'bg-orange-500', text: 'text-orange-500', ring: 'ring-orange-500/30' },
  'C': { bg: 'bg-orange-500', text: 'text-orange-500', ring: 'ring-orange-500/30' },
  'D': { bg: 'bg-rose-500', text: 'text-rose-500', ring: 'ring-rose-500/30' },
  'F': { bg: 'bg-rose-500', text: 'text-rose-500', ring: 'ring-rose-500/30' },
};

const MeriReport = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchReport = async (forceRegenerate = false) => {
    if (!profile?.uid) return;

    // Check localStorage for cached report
    if (!forceRegenerate) {
      const cached = localStorage.getItem(`weekly_report_${profile.uid}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const cacheDate = parsed._cacheDate;
          const today = new Date().toISOString().split('T')[0];
          // Use cache if generated today
          if (cacheDate === today) {
            setReport(parsed.report);
            setLoading(false);
            return;
          }
        } catch (e) { /* ignore */ }
      }
    }

    setGenerating(true);

    try {
      // Fetch last 7 days of history
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const historyRef = collection(db, 'users', profile.uid, 'history');
      const q = query(historyRef, orderBy('timestamp', 'desc'), fbLimit(50));
      const snap = await getDocs(q);

      const historyData = snap.docs.map(doc => {
        const data = doc.data();
        return {
          challengeId: data.challengeId,
          totalScore: data.totalScore,
          maxScore: data.maxScore,
          accuracy: data.accuracy,
          subjectBreakdown: data.subjectBreakdown,
          timeSpent: data.timeSpent,
          completedAt: data.completedAt,
          isReattempt: data.isReattempt,
        };
      });

      const result = await generateWeeklyReport(
        profile.displayName || 'Student',
        historyData,
        profile.currentStreak || 0,
        profile.totalScore || 0
      );

      setReport(result);

      // Cache the report
      localStorage.setItem(`weekly_report_${profile.uid}`, JSON.stringify({
        report: result,
        _cacheDate: new Date().toISOString().split('T')[0],
      }));
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20"
        >
          <Brain size={24} />
        </motion.div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
          {generating ? 'AI Analyzing Your Week...' : 'Loading Report...'}
        </p>
      </div>
    );
  }

  if (!report) return null;

  const gradeColor = GRADE_COLORS[report.overallGrade] || GRADE_COLORS['B'];

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
              Meri Report 📊
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Weekly AI-powered performance diagnosis</p>
          </div>
        </div>
        <button
          onClick={() => fetchReport(true)}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 rounded-full text-xs font-black hover:bg-amber-500/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Generating...' : 'Regenerate'}
        </button>
      </div>

      {/* Overall Grade Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#060818] rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 text-white relative overflow-hidden"
      >
        <div className="flex items-center gap-6 md:gap-10">
          <div className={`w-20 h-20 md:w-28 md:h-28 rounded-[2rem] ${gradeColor.bg} flex items-center justify-center ring-4 ${gradeColor.ring} shadow-2xl`}>
            <span className="text-3xl md:text-5xl font-black text-white">{report.overallGrade}</span>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Weekly Grade</span>
            </div>
            <p className="text-base md:text-lg font-medium text-slate-300 leading-relaxed">{report.overallMessage}</p>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-amber-500/5 rounded-full blur-3xl" />
      </motion.div>

      {/* Subject Analysis */}
      <div className="space-y-4">
        <h3 className="font-display font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen size={20} className="text-amber-500" /> Subject Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {report.subjectAnalysis.map((sa, i) => {
            const saGrade = GRADE_COLORS[sa.grade] || GRADE_COLORS['B'];
            return (
              <motion.div
                key={sa.subject}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/80 dark:bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 dark:text-white">{sa.subject}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-black ${saGrade.text}`}>{sa.grade}</span>
                    {sa.trend === 'improving' && <TrendingUp size={16} className="text-emerald-500" />}
                    {sa.trend === 'declining' && <TrendingDown size={16} className="text-rose-500" />}
                    {sa.trend === 'stable' && <Minus size={16} className="text-slate-400" />}
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full ${saGrade.bg} rounded-full transition-all`} style={{ width: `${sa.accuracy * 100}%` }} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">{Math.round(sa.accuracy * 100)}% accuracy</p>

                {sa.weakTopics.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Weak Areas</p>
                    <div className="flex flex-wrap gap-1">
                      {sa.weakTopics.map(t => (
                        <span key={t} className="text-[10px] font-bold bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {sa.strongTopics.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Strong Areas</p>
                    <div className="flex flex-wrap gap-1">
                      {sa.strongTopics.map(t => (
                        <span key={t} className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium italic">💡 {sa.tip}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
          <h4 className="font-black text-emerald-500 text-sm uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={16} /> Strengths
          </h4>
          {report.strengths.map((s, i) => (
            <p key={i} className="text-sm text-slate-700 dark:text-slate-300 font-medium flex items-start gap-2">
              <span className="text-emerald-500">✓</span> {s}
            </p>
          ))}
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 space-y-3">
          <h4 className="font-black text-rose-500 text-sm uppercase tracking-widest flex items-center gap-2">
            <Target size={16} /> Areas to Improve
          </h4>
          {report.weaknesses.map((w, i) => (
            <p key={i} className="text-sm text-slate-700 dark:text-slate-300 font-medium flex items-start gap-2">
              <span className="text-rose-500">→</span> {w}
            </p>
          ))}
        </div>
      </div>

      {/* Error Patterns + Time Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-3">
          <h4 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Brain size={16} className="text-violet-500" /> Error Patterns
          </h4>
          {report.errorPatterns.map((p, i) => (
            <p key={i} className="text-sm text-slate-600 dark:text-slate-400 font-medium">• {p}</p>
          ))}
        </div>
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-3">
          <h4 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Clock size={16} className="text-blue-500" /> Time Analysis
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{report.timeAnalysis}</p>
        </div>
      </div>

      {/* Next Week Focus */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 space-y-3">
        <h4 className="font-black text-amber-500 text-sm uppercase tracking-widest">📋 Next Week Focus Plan</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {report.nextWeekFocus.map((f, i) => (
            <div key={i} className="bg-white/50 dark:bg-white/5 p-3 rounded-xl border border-amber-500/10">
              <span className="text-amber-500 font-black text-lg mr-2">{i + 1}.</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Motivational Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6 text-center"
      >
        <Sparkles size={24} className="text-amber-500 mx-auto mb-3" />
        <p className="text-lg font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{report.motivationalNote}</p>
      </motion.div>
    </div>
  );
};

export default MeriReport;
