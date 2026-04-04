import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import MathText from '../components/MathRenderer';
import { Clock, ChevronLeft, ChevronRight, Send, BookOpen, LayoutGrid, ArrowLeft, CheckCircle, XCircle, MinusCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FLTQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number; // 0-3 index
  explanation: string;
  topic: string;
  subtopic?: string;
  difficulty: string;
}

interface FLTSubmission {
  selectedOption: number | null; // null = skipped
}

/**
 * Split explanation into readable steps
 */
function formatSteps(text: string): string[] {
  if (!text) return [];
  if (text.includes('\n')) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 1) return lines;
  }
  const stepKeywords = [
    'Using ', 'Applying ', 'From ', 'By ', 'Since ', 'Now,', 'Now ', 'Therefore,', 'Therefore ',
    'Thus,', 'Thus ', 'Hence,', 'Hence ', 'So,', 'So ', 'Substituting', 'We get', 'We have',
    'We know', 'This gives', 'This means', 'This implies', 'Let ', 'Given', 'The ',
    'After ', 'When ', 'Taking', 'Simplifying', 'Divid', "Let's", 'According',
  ];
  const steps: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    let bestSplit = -1;
    for (const kw of stepKeywords) {
      for (const pat of ['. ' + kw, '.' + kw]) {
        const idx = remaining.indexOf(pat);
        if (idx !== -1 && idx > 15) {
          const sp = idx + (pat.startsWith('. ') ? 2 : 1);
          if (bestSplit === -1 || sp < bestSplit) bestSplit = sp;
        }
      }
    }
    if (bestSplit !== -1 && remaining.length - bestSplit > 10) {
      steps.push(remaining.slice(0, bestSplit).trim());
      remaining = remaining.slice(bestSplit).trim();
    } else {
      steps.push(remaining.trim());
      break;
    }
  }
  return steps.length > 0 ? steps : [text];
}

const FullLengthTestEngine = () => {
  const { subject, testId } = useParams<{ subject: string; testId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [questions, setQuestions] = useState<FLTQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submissions, setSubmissions] = useState<Record<number, FLTSubmission>>({});
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes in seconds
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'test' | 'results'>('test');
  const [showGrid, setShowGrid] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Check if already attempted
  const [previousAttempt, setPreviousAttempt] = useState<any>(null);

  useEffect(() => {
    loadTest();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [testId]);

  useEffect(() => {
    if (phase === 'test' && questions.length > 0 && !previousAttempt) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [phase, questions, previousAttempt]);

  const loadTest = async () => {
    if (!testId || !profile?.uid) return;
    setLoading(true);
    try {
      // Load test from Firestore
      const docRef = doc(db, 'fullLengthTests', testId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        setError('Test not found. It may not have been generated yet.');
        setLoading(false);
        return;
      }
      const data = snap.data();
      setQuestions(data.questions || []);
      setTestTitle(data.title || testId);
      setTimeLeft((data.duration || 60) * 60);

      // Check previous attempt
      const attemptRef = doc(db, 'users', profile.uid, 'fltAttempts', testId);
      const attemptSnap = await getDoc(attemptRef);
      if (attemptSnap.exists()) {
        const ad = attemptSnap.data();
        setPreviousAttempt(ad);
        setSubmissions(ad.submissions || {});
        setPhase('results');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load test');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (optionIdx: number) => {
    if (phase !== 'test' || previousAttempt) return;
    setSubmissions(prev => ({
      ...prev,
      [currentIndex]: { selectedOption: optionIdx },
    }));
  };

  const handleSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate score
    let correct = 0;
    let attempted = 0;
    questions.forEach((q, i) => {
      const sub = submissions[i];
      if (sub && sub.selectedOption !== null) {
        attempted++;
        if (sub.selectedOption === q.correctAnswer) correct++;
      }
    });

    // Save to Firestore
    if (profile?.uid && testId) {
      try {
        const attemptRef = doc(db, 'users', profile.uid, 'fltAttempts', testId);
        await setDoc(attemptRef, {
          testId,
          subject,
          score: correct,
          total: attempted,
          totalQuestions: questions.length,
          submissions,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error saving attempt:', err);
      }
    }

    setPreviousAttempt({ score: correct, total: attempted });
    setPhase('results');
  };

  const answeredCount = Object.values(submissions).filter(s => s.selectedOption !== null).length;

  const score = useMemo(() => {
    if (phase !== 'results') return { correct: 0, wrong: 0, skipped: 0 };
    let correct = 0, wrong = 0, skipped = 0;
    questions.forEach((q, i) => {
      const sub = submissions[i];
      if (!sub || sub.selectedOption === null) { skipped++; return; }
      if (sub.selectedOption === q.correctAnswer) correct++;
      else wrong++;
    });
    return { correct, wrong, skipped };
  }, [phase, questions, submissions]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading test...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle size={48} className="text-rose-400" />
        <p className="text-lg font-bold text-slate-600 dark:text-slate-300">{error}</p>
        <button onClick={() => navigate('/full-length-tests')} className="px-6 py-3 bg-amber-500 text-[#060818] rounded-xl font-black text-sm">
          <ArrowLeft size={16} className="inline mr-2" /> Back to Tests
        </button>
      </div>
    );
  }

  // ── RESULTS VIEW ──
  if (phase === 'results') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/full-length-tests')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
            <ArrowLeft size={20} className="text-slate-500" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{testTitle} — Results</h1>
            <p className="text-xs text-slate-500">{subject?.replace(/([A-Z])/g, ' $1').trim()}</p>
          </div>
        </div>

        {/* Score Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <CheckCircle size={24} className="text-emerald-500 mx-auto mb-1" />
            <p className="text-2xl font-black text-emerald-500">{score.correct}</p>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Correct</p>
          </div>
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
            <XCircle size={24} className="text-rose-500 mx-auto mb-1" />
            <p className="text-2xl font-black text-rose-500">{score.wrong}</p>
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Wrong</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-500/10 border border-slate-500/20 text-center">
            <MinusCircle size={24} className="text-slate-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-slate-400">{score.skipped}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Skipped</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-center">
          <p className="text-3xl font-black text-amber-500">{score.correct}/{score.correct + score.wrong}</p>
          <p className="text-xs text-slate-500 mt-1">
            Accuracy: {(score.correct + score.wrong) > 0 ? Math.round((score.correct / (score.correct + score.wrong)) * 100) : 0}%
          </p>
        </div>

        {/* Question-wise Review */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Question-wise Review</h2>
          {questions.map((q, i) => {
            const sub = submissions[i];
            const isCorrect = sub?.selectedOption === q.correctAnswer;
            const isSkipped = !sub || sub.selectedOption === null;

            return (
              <div key={i} className={`p-4 md:p-5 rounded-2xl border ${
                isSkipped ? 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10'
                : isCorrect ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20'
                : 'bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20'
              }`}>
                {/* Question */}
                <div className="flex gap-3 mb-3">
                  <span className={`text-xs font-black px-2 py-1 rounded-lg shrink-0 h-fit ${
                    isSkipped ? 'bg-slate-200 dark:bg-white/10 text-slate-500'
                    : isCorrect ? 'bg-emerald-200 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-200 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                  }`}>Q{i + 1}</span>
                  <div className="text-sm md:text-base text-slate-800 dark:text-slate-200">
                    <MathText text={q.questionText} block />
                  </div>
                </div>

                {/* Options */}
                <div className="grid gap-2 ml-8 mb-3">
                  {q.options.map((opt, oi) => {
                    const isSelected = sub?.selectedOption === oi;
                    const isAnswer = oi === q.correctAnswer;
                    return (
                      <div key={oi} className={`px-3 py-2 rounded-lg text-sm border ${
                        isAnswer ? 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                        : isSelected && !isAnswer ? 'bg-rose-100 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
                        : 'bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                      }`}>
                        <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>
                        <MathText text={opt} />
                        {isAnswer && <span className="ml-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400">✓ CORRECT</span>}
                        {isSelected && !isAnswer && <span className="ml-2 text-[10px] font-black text-rose-600 dark:text-rose-400">✗ YOUR ANSWER</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="ml-8 p-3 md:p-4 bg-primary/5 dark:bg-amber-500/5 rounded-xl border border-primary/10 dark:border-amber-500/10">
                    <p className="text-[10px] font-black text-primary dark:text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <BookOpen size={12} /> Solution
                    </p>
                    <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
                      {formatSteps(q.explanation).map((step, si) => (
                        <div key={si} className="flex gap-2">
                          {formatSteps(q.explanation).length > 1 && (
                            <span className="text-primary dark:text-amber-500 font-bold text-xs mt-0.5 shrink-0">{si + 1}.</span>
                          )}
                          <div className="flex-1"><MathText text={step} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // ── TEST VIEW ──
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-4">
      {/* Top Bar */}
      <div className="sticky top-16 z-20 bg-white/80 dark:bg-[#060818]/80 backdrop-blur-lg rounded-2xl p-3 border border-slate-200 dark:border-white/10 flex items-center justify-between">
        <button onClick={() => navigate('/full-length-tests')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div className="text-center">
          <p className="text-xs font-black text-slate-900 dark:text-white">{testTitle}</p>
          <p className="text-[10px] text-slate-400">{answeredCount}/{questions.length} answered</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowGrid(!showGrid)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
            <LayoutGrid size={18} className="text-slate-500" />
          </button>
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${
            timeLeft < 300 ? 'bg-rose-500/10 text-rose-500 animate-pulse' : 'bg-amber-500/10 text-amber-500'
          }`}>
            <Clock size={14} />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Question Grid Modal */}
      <AnimatePresence>
        {showGrid && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl"
          >
            <p className="text-xs font-bold text-slate-500 mb-3">Question Navigator</p>
            <div className="grid grid-cols-10 gap-1.5">
              {questions.map((_, i) => {
                const sub = submissions[i];
                const answered = sub && sub.selectedOption !== null;
                return (
                  <button
                    key={i}
                    onClick={() => { setCurrentIndex(i); setShowGrid(false); }}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      i === currentIndex
                        ? 'bg-amber-500 text-[#060818] scale-110'
                        : answered
                          ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Card */}
      {currentQuestion && (
        <div className="p-5 md:p-8 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10">
          {/* Question header */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">
              Q{currentIndex + 1} of {questions.length}
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg">
              {currentQuestion.topic}
            </span>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
              currentQuestion.difficulty === 'Very Tough' ? 'bg-rose-500/10 text-rose-400' : 'bg-orange-500/10 text-orange-400'
            }`}>
              {currentQuestion.difficulty}
            </span>
          </div>

          {/* Question text */}
          <div className="text-base md:text-lg text-slate-800 dark:text-slate-200 mb-6 leading-relaxed">
            <MathText text={currentQuestion.questionText} block />
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((opt, oi) => {
              const isSelected = submissions[currentIndex]?.selectedOption === oi;
              return (
                <button
                  key={oi}
                  onClick={() => handleSelectOption(oi)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:border-amber-500/30 hover:bg-amber-500/5'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                    isSelected ? 'bg-amber-500 text-[#060818]' : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                  }`}>
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <span className="text-sm md:text-base text-slate-700 dark:text-slate-300">
                    <MathText text={opt} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 transition-all"
        >
          <ChevronLeft size={16} /> Previous
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm bg-amber-500 text-[#060818] hover:bg-amber-400 shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
          >
            <Send size={16} /> Submit Test
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-amber-500 hover:bg-amber-500/10 transition-all"
          >
            Next <ChevronRight size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default FullLengthTestEngine;
