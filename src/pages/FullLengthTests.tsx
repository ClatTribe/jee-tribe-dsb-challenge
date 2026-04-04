import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Clock, ArrowRight, BookOpen, Lock, CheckCircle, ChevronDown } from 'lucide-react';
import { CuetDomainSubject } from '../services/examConfig';

interface TestMeta {
  id: string;
  subject: string;
  testNumber: number;
  title: string;
  questionCount: number;
  duration: number; // minutes
  difficulty: string;
  attempted?: boolean;
  score?: number;
}

// Top 8 popular CUET domain subjects
const CUET_FLT_SUBJECTS: CuetDomainSubject[] = [
  'Physics', 'Chemistry', 'Mathematics', 'Economics',
  'Business Studies', 'Accountancy', 'Political Science', 'Psychology',
];

const subjectColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  'Physics': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', glow: 'shadow-blue-500/10' },
  'Chemistry': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', glow: 'shadow-green-500/10' },
  'Mathematics': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', glow: 'shadow-purple-500/10' },
  'Economics': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-amber-500/10' },
  'Business Studies': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', glow: 'shadow-orange-500/10' },
  'Accountancy': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20', glow: 'shadow-teal-500/10' },
  'Political Science': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', glow: 'shadow-rose-500/10' },
  'Psychology': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', glow: 'shadow-indigo-500/10' },
};

const FullLengthTests = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [tests, setTests] = useState<TestMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [attemptedTests, setAttemptedTests] = useState<Record<string, { score: number; total: number }>>({});

  // Determine available subjects based on user's CUET domains
  const userDomains = profile?.cuetDomains || (profile?.cuetDomain ? [profile.cuetDomain] : []);
  const availableSubjects = profile?.exam === 'CUET'
    ? CUET_FLT_SUBJECTS.filter(s => userDomains.includes(s) || userDomains.length === 0)
    : CUET_FLT_SUBJECTS;

  // Show all subjects but highlight user's domains
  const allSubjects = CUET_FLT_SUBJECTS;

  useEffect(() => {
    if (!activeSubject && allSubjects.length > 0) {
      // Default to first user domain, or first subject
      const defaultSubject = userDomains.length > 0 ? userDomains[0] : allSubjects[0];
      setActiveSubject(defaultSubject);
    }
  }, [userDomains]);

  useEffect(() => {
    loadTests();
    loadAttempts();
  }, [activeSubject]);

  const loadTests = async () => {
    if (!activeSubject) return;
    setLoading(true);
    try {
      const subjectKey = activeSubject.replace(/\s+/g, '');
      // Load all 5 tests in PARALLEL instead of sequentially
      const testIds = Array.from({ length: 5 }, (_, i) => `FLT-${subjectKey}-${i + 1}`);
      const snaps = await Promise.all(
        testIds.map(id => getDoc(doc(db, 'fullLengthTests', id)))
      );

      const testList: TestMeta[] = snaps.map((snap, i) => {
        const docId = testIds[i];
        if (snap.exists()) {
          const data = snap.data();
          return {
            id: docId,
            subject: activeSubject,
            testNumber: i + 1,
            title: data.title || `${activeSubject} Full Test ${i + 1}`,
            questionCount: data.questions?.length || 50,
            duration: data.duration || 60,
            difficulty: data.difficulty || 'Tough to Very Tough',
          };
        }
        return {
          id: docId,
          subject: activeSubject,
          testNumber: i + 1,
          title: `${activeSubject} Full Test ${i + 1}`,
          questionCount: 50,
          duration: 60,
          difficulty: 'Tough to Very Tough',
        };
      });
      setTests(testList);
    } catch (err) {
      console.error('Error loading tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAttempts = async () => {
    if (!profile?.uid || !activeSubject) return;
    try {
      const subjectKey = activeSubject.replace(/\s+/g, '');
      const testIds = Array.from({ length: 5 }, (_, i) => `FLT-${subjectKey}-${i + 1}`);
      // Load all 5 attempts in PARALLEL
      const snaps = await Promise.all(
        testIds.map(id => getDoc(doc(db, 'users', profile.uid, 'fltAttempts', id)))
      );

      const attempts: Record<string, { score: number; total: number }> = {};
      snaps.forEach((snap, i) => {
        if (snap.exists()) {
          const d = snap.data();
          attempts[testIds[i]] = { score: d.score || 0, total: d.total || 50 };
        }
      });
      setAttemptedTests(attempts);
    } catch (err) {
      console.error('Error loading attempts:', err);
    }
  };

  const handleStartTest = (testId: string, subject: string) => {
    const subjectKey = subject.replace(/\s+/g, '');
    navigate(`/full-length-test/${subjectKey}/${testId}`);
  };

  const colors = subjectColors[activeSubject] || subjectColors['Physics'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ClipboardList size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Full Length Tests</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">CUET Domain-wise • 50 Questions • 60 Minutes</p>
          </div>
        </div>
      </motion.div>

      {/* Subject Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
      >
        {allSubjects.map((subject) => {
          const isActive = activeSubject === subject;
          const isUserDomain = userDomains.includes(subject);
          const sc = subjectColors[subject] || subjectColors['Physics'];
          return (
            <button
              key={subject}
              onClick={() => setActiveSubject(subject)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                isActive
                  ? `${sc.bg} ${sc.text} ${sc.border} shadow-lg ${sc.glow}`
                  : isUserDomain
                    ? 'bg-white/5 dark:bg-white/5 border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/10'
                    : 'bg-white/[0.02] dark:bg-white/[0.02] border-white/5 text-slate-400 dark:text-slate-500 hover:bg-white/5'
              }`}
            >
              {subject}
              {isUserDomain && !isActive && (
                <span className="ml-1.5 text-[8px] bg-amber-500/20 text-amber-400 px-1 py-0.5 rounded-full">MY</span>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Test Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading tests...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSubject}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {tests.map((test, idx) => {
                const attempted = attemptedTests[test.id];
                const testExists = test.questionCount > 0;
                return (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-5 rounded-2xl border transition-all ${
                      attempted
                        ? 'bg-emerald-500/5 dark:bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/10 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Test Number */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-lg font-black ${
                        attempted
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : `${colors.bg} ${colors.text}`
                      }`}>
                        {attempted ? <CheckCircle size={28} /> : `#${test.testNumber}`}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-base text-slate-900 dark:text-white">{test.title}</h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <BookOpen size={12} /> {test.questionCount} Questions (Attempt any 40)
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Clock size={12} /> {test.duration} Minutes
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                            {test.difficulty}
                          </span>
                          {attempted && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                              Score: {attempted.score}/{attempted.total}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleStartTest(test.id, test.subject)}
                        className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shrink-0 ${
                          attempted
                            ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                            : 'bg-amber-500 text-[#060818] hover:bg-amber-400 shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95'
                        }`}
                      >
                        {attempted ? 'Review' : 'Start'} <ArrowRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/10 text-center"
      >
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Each test has <span className="font-bold text-amber-500">50 MCQs</span> — attempt any <span className="font-bold text-amber-500">40</span> in <span className="font-bold text-amber-500">60 minutes</span>.
          Matches the actual CUET domain paper format.
        </p>
      </motion.div>
    </div>
  );
};

export default FullLengthTests;
