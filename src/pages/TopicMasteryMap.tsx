import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronRight, Zap, Target, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PaywallOverlay from '../components/PaywallOverlay';
import { EXAM_CONFIGS, ExamType } from '../services/examConfig';

interface TopicData {
  topic: string;
  correct: number;
  total: number;
  accuracy: number;
  lastAttempted: string;
  trend: 'improving' | 'declining' | 'stable' | 'new';
}

interface SubjectData {
  subject: string;
  topics: TopicData[];
  overallAccuracy: number;
  totalQuestions: number;
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  Physics: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', accent: 'bg-blue-500' },
  Chemistry: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', accent: 'bg-emerald-500' },
  Mathematics: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', accent: 'bg-amber-500' },
  Biology: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20', accent: 'bg-green-500' },
  English: { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/20', accent: 'bg-violet-500' },
  'General Test': { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20', accent: 'bg-orange-500' },
  Economics: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', accent: 'bg-amber-500' },
  'Political Science': { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20', accent: 'bg-rose-500' },
  Psychology: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20', accent: 'bg-indigo-500' },
  'Business Studies': { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20', accent: 'bg-orange-500' },
  Accountancy: { bg: 'bg-teal-500/10', text: 'text-teal-500', border: 'border-teal-500/20', accent: 'bg-teal-500' },
  History: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20', accent: 'bg-yellow-500' },
  Geography: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20', accent: 'bg-cyan-500' },
  Sociology: { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/20', accent: 'bg-pink-500' },
  'Computer Science': { bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-500/20', accent: 'bg-slate-500' },
};

const getMasteryColor = (accuracy: number) => {
  if (accuracy >= 0.8) return { bg: 'bg-emerald-500', text: 'text-emerald-500', label: 'Mastered', emoji: '🟢' };
  if (accuracy >= 0.6) return { bg: 'bg-amber-500', text: 'text-amber-500', label: 'Learning', emoji: '🟡' };
  if (accuracy >= 0.3) return { bg: 'bg-orange-500', text: 'text-orange-500', label: 'Weak', emoji: '🟠' };
  if (accuracy > 0) return { bg: 'bg-rose-500', text: 'text-rose-500', label: 'Critical', emoji: '🔴' };
  return { bg: 'bg-slate-400', text: 'text-slate-400', label: 'Not Started', emoji: '⚪' };
};

const TopicMasteryMap = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [subjectData, setSubjectData] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  useEffect(() => {
    const fetchMasteryData = async () => {
      if (!profile?.uid) return;

      try {
        const historyRef = collection(db, 'users', profile.uid, 'history');
        const q = query(historyRef, orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);

        // Build subject list from user's exam config
        const exam = (profile.exam || 'JEE') as ExamType;
        const config = EXAM_CONFIGS[exam];
        let examSubjects = [...config.subjects];
        // For CUET, replace generic "Domain Subject" with actual user domains
        if (exam === 'CUET') {
          examSubjects = examSubjects.filter(s => s !== 'Domain Subject');
          const domains = profile.cuetDomains || (profile.cuetDomain ? [profile.cuetDomain] : []);
          examSubjects.push(...domains);
        }

        // Aggregate topic-level data from attempt history
        const topicMap: Record<string, Record<string, { correct: number; total: number; dates: string[] }>> = {};
        examSubjects.forEach(s => { topicMap[s] = {}; });

        snap.docs.forEach(doc => {
          const data = doc.data();
          const breakdown = data.subjectBreakdown;
          if (!breakdown) return;

          const dateStr = data.completedAt?.toDate?.()?.toISOString?.()?.split('T')[0] || '';

          // Extract subject-level data and map to generic topics
          Object.entries(breakdown).forEach(([subject, stats]: [string, any]) => {
            if (!topicMap[subject]) return;

            // Use challengeId to infer topic if available
            const topicName = data.topicName || getTopicFromChallenge(data.challengeId, subject);

            if (!topicMap[subject][topicName]) {
              topicMap[subject][topicName] = { correct: 0, total: 0, dates: [] };
            }

            topicMap[subject][topicName].correct += stats.correct || 0;
            topicMap[subject][topicName].total += (stats.correct || 0) + (stats.wrong || 0) + (stats.skipped || 0);
            if (dateStr) topicMap[subject][topicName].dates.push(dateStr);
          });
        });

        // Convert to display format
        const subjects: SubjectData[] = Object.entries(topicMap).map(([subject, topics]) => {
          const topicList: TopicData[] = Object.entries(topics)
            .map(([topic, data]) => ({
              topic,
              correct: data.correct,
              total: data.total,
              accuracy: data.total > 0 ? data.correct / data.total : 0,
              lastAttempted: data.dates[0] || 'Never',
              trend: calculateTrend(data.dates, data.correct, data.total),
            }))
            .sort((a, b) => b.total - a.total);

          const totalCorrect = topicList.reduce((s, t) => s + t.correct, 0);
          const totalQ = topicList.reduce((s, t) => s + t.total, 0);

          return {
            subject,
            topics: topicList.length > 0 ? topicList : getDefaultTopics(subject),
            overallAccuracy: totalQ > 0 ? totalCorrect / totalQ : 0,
            totalQuestions: totalQ,
          };
        });

        setSubjectData(subjects);
      } catch (error) {
        console.error('Error fetching mastery data:', error);
        setSubjectData(getDefaultSubjects());
      } finally {
        setLoading(false);
      }
    };

    fetchMasteryData();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20 animate-bounce">
          <Target size={24} />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Mapping Your Mastery...</p>
      </div>
    );
  }

  const totalQuestions = subjectData.reduce((s, d) => s + d.totalQuestions, 0);
  const overallAccuracy = totalQuestions > 0
    ? subjectData.reduce((s, d) => s + d.overallAccuracy * d.totalQuestions, 0) / totalQuestions
    : 0;

  return (
    <div className="space-y-6 pb-12">
      <PaywallOverlay />
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/80 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 flex items-center justify-center hover:scale-110 transition-transform">
          <ArrowLeft size={20} className="text-slate-500" />
        </button>
        <div>
          <h1 className="text-2xl md:text-4xl font-display font-black tracking-tighter text-slate-900 dark:text-white">
            Topic Mastery Map 🗺️
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Subject → Topic breakdown with color-coded mastery levels</p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 text-center">
          <p className="text-2xl font-black text-slate-900 dark:text-white">{totalQuestions}</p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Questions Done</p>
        </div>
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 text-center">
          <p className="text-2xl font-black text-slate-900 dark:text-white">{Math.round(overallAccuracy * 100)}%</p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Overall Accuracy</p>
        </div>
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 text-center">
          <p className="text-2xl font-black text-slate-900 dark:text-white">{subjectData.reduce((s, d) => s + d.topics.length, 0)}</p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Topics Tracked</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-3 rounded-2xl border border-slate-200/50 dark:border-white/5">
        {[
          { emoji: '🟢', label: 'Mastered (80%+)' },
          { emoji: '🟡', label: 'Learning (60-80%)' },
          { emoji: '🟠', label: 'Weak (30-60%)' },
          { emoji: '🔴', label: 'Critical (<30%)' },
          { emoji: '⚪', label: 'Not Started' },
        ].map(l => (
          <span key={l.label} className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            {l.emoji} {l.label}
          </span>
        ))}
      </div>

      {/* Subject Trees */}
      <div className="space-y-4">
        {subjectData.map((subject) => {
          const colors = SUBJECT_COLORS[subject.subject] || SUBJECT_COLORS.Physics;
          const isExpanded = expandedSubject === subject.subject;

          return (
            <motion.div key={subject.subject} layout className="overflow-hidden">
              <button
                onClick={() => setExpandedSubject(isExpanded ? null : subject.subject)}
                className={`w-full bg-white/80 dark:bg-white/5 backdrop-blur-xl p-5 rounded-2xl border-2 ${colors.border} flex items-center justify-between hover:shadow-lg transition-all group`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${colors.bg} ${colors.text} rounded-2xl flex items-center justify-center font-black text-lg`}>
                    {subject.subject.charAt(0)}
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-slate-900 dark:text-white text-lg">{subject.subject}</h3>
                    <p className="text-xs font-bold text-slate-400">
                      {subject.totalQuestions} questions · {Math.round(subject.overallAccuracy * 100)}% accuracy · {subject.topics.length} topics
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Mini accuracy bar */}
                  <div className="hidden md:flex w-32 h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${colors.accent} rounded-full transition-all`} style={{ width: `${subject.overallAccuracy * 100}%` }} />
                  </div>
                  {isExpanded ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-2 space-y-2 pl-4 md:pl-8"
                  >
                    {subject.topics.map((topic, idx) => {
                      const mastery = getMasteryColor(topic.accuracy);
                      return (
                        <motion.div
                          key={topic.topic}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm p-4 rounded-xl border border-slate-200/50 dark:border-white/5 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-lg">{mastery.emoji}</span>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{topic.topic}</p>
                              <p className="text-[10px] font-bold text-slate-400">{topic.correct}/{topic.total} correct · Last: {topic.lastAttempted}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {/* Accuracy bar */}
                            <div className="w-20 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden hidden sm:block">
                              <div className={`h-full ${mastery.bg} rounded-full`} style={{ width: `${topic.accuracy * 100}%` }} />
                            </div>
                            <span className={`text-sm font-black ${mastery.text}`}>{Math.round(topic.accuracy * 100)}%</span>
                            {/* Trend indicator */}
                            {topic.trend === 'improving' && <TrendingUp size={16} className="text-emerald-500" />}
                            {topic.trend === 'declining' && <TrendingDown size={16} className="text-rose-500" />}
                            {topic.trend === 'stable' && <Minus size={16} className="text-slate-400" />}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────

function getTopicFromChallenge(challengeId: string, subject: string): string {
  // Map challenge types to general topic areas
  if (challengeId?.includes('mini-mock')) return 'Mixed Practice';
  if (challengeId?.includes('sudden-death')) return 'Speed Drill';
  if (challengeId?.includes('skip')) return 'Strategy Practice';
  if (challengeId?.includes('flashcard')) return 'Recall Practice';
  if (challengeId?.includes('duel')) return 'Competitive';
  return 'General Practice';
}

function calculateTrend(_dates: string[], correct: number, total: number): 'improving' | 'declining' | 'stable' | 'new' {
  if (total < 3) return 'new';
  const accuracy = correct / total;
  if (accuracy > 0.7) return 'improving';
  if (accuracy < 0.4) return 'declining';
  return 'stable';
}

function getDefaultTopics(subject: string): TopicData[] {
  const topics: Record<string, string[]> = {
    Physics: ['Mechanics', 'Electrostatics', 'Optics', 'Thermodynamics', 'Modern Physics', 'Magnetism', 'Waves'],
    Chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Coordination Compounds', 'Electrochemistry'],
    Mathematics: ['Calculus', 'Algebra', 'Coordinate Geometry', 'Trigonometry', 'Probability & Statistics', 'Vectors & 3D'],
    Biology: ['Human Physiology', 'Plant Physiology', 'Genetics', 'Ecology', 'Cell Biology', 'Molecular Biology'],
    English: ['Reading Comprehension', 'Vocabulary', 'Grammar', 'Para Jumbles', 'Error Spotting'],
    'General Test': ['Quantitative Aptitude', 'Logical Reasoning', 'Data Interpretation', 'General Knowledge', 'Current Affairs'],
    Economics: ['Microeconomics', 'Macroeconomics', 'Indian Economy', 'Statistics', 'Development Economics'],
    'Political Science': ['Indian Constitution', 'Political Theory', 'International Relations', 'Comparative Politics'],
    Psychology: ['Learning & Memory', 'Human Development', 'Social Psychology', 'Statistics in Psychology', 'Abnormal Psychology'],
    'Business Studies': ['Management Principles', 'Marketing', 'Financial Management', 'Business Environment', 'Planning & Organising'],
    Accountancy: ['Financial Statements', 'Partnership Accounts', 'Company Accounts', 'Cash Flow Statement', 'Ratio Analysis'],
    History: ['Ancient India', 'Medieval India', 'Modern India', 'World History', 'Nationalism'],
    Geography: ['Physical Geography', 'Human Geography', 'Indian Geography', 'Climatology', 'Map Skills'],
    Sociology: ['Society & Social Institutions', 'Social Change', 'Indian Society', 'Social Stratification'],
    'Computer Science': ['Programming', 'Data Structures', 'Networking', 'Database Management', 'Boolean Algebra'],
  };

  return (topics[subject] || ['General Practice']).map(t => ({
    topic: t, correct: 0, total: 0, accuracy: 0, lastAttempted: 'Never', trend: 'new' as const,
  }));
}

function getDefaultSubjects(): SubjectData[] {
  // Fallback — will be overridden by exam-specific subjects in fetchMasteryData
  return ['Physics', 'Chemistry', 'Mathematics'].map(subject => ({
    subject,
    topics: getDefaultTopics(subject),
    overallAccuracy: 0,
    totalQuestions: 0,
  }));
}

export default TopicMasteryMap;
