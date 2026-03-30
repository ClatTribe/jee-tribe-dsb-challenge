import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FastForward, CheckCircle2, XCircle, BrainCircuit, Zap, Loader2, AlertTriangle } from 'lucide-react';
import ShareScoreButton from '../components/ShareScoreButton';
import { drawSkipStrategyCard } from '../utils/shareScoreCard';
import { useNavigate } from 'react-router-dom';
import MathText from '../components/MathRenderer';
import { getDailyQuestions, Question } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { submitMiniGameScore, checkAttempt } from '../services/db';

const SkipStrategy = () => {
  const { profile } = useAuth();
  const [questions, setQuestions] = useState<(Question & { isTrap: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; reason: string } | null>(null);
  const [isReattempt, setIsReattempt] = useState(false);
  const [showReattemptWarning, setShowReattemptWarning] = useState(false);
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];
  const challengeId = `skip-strategy-${today}`;

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!profile) return;
      try {
        const [daily, attempted] = await Promise.all([
          getDailyQuestions(profile?.exam, profile?.cuetDomain),
          checkAttempt(profile.uid, challengeId)
        ]);
        setQuestions(daily.skipOrSolve);
        setIsReattempt(attempted);
      } catch (error) {
        console.error("Failed to fetch questions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [profile, challengeId]);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (feedback !== null || currentIndex >= questions.length || loading) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleChoice('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, feedback, loading, questions.length]);

  const handleChoice = async (choice: 'skip' | 'solve' | 'timeout') => {
    if (feedback !== null || !currentQuestion) return;

    let isCorrect = false;
    if (choice === 'skip' && currentQuestion.isTrap) isCorrect = true;
    if (choice === 'solve' && !currentQuestion.isTrap) isCorrect = true;

    const newScore = isCorrect ? score + 20 : score;
    setScore(newScore);

    setFeedback({
      isCorrect,
      reason: choice === 'timeout' ? 'Time ran out! You must decide quickly.' : currentQuestion.explanation
    });

    if (currentIndex === questions.length - 1) {
      if (profile) {
        await submitMiniGameScore(profile.uid, challengeId, newScore, isReattempt);
      }
    }

    setTimeout(() => {
      setFeedback(null);
      setTimeLeft(15);
      setCurrentIndex(currentIndex + 1);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Analyzing Traps...</p>
      </div>
    );
  }

  if (currentIndex >= questions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 px-6">
        <motion.div 
          initial={{ scale: 0, rotate: -180 }} 
          animate={{ scale: 1, rotate: 0 }} 
          className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center bg-emerald-500 text-white shadow-2xl shadow-emerald-500/30"
        >
          <BrainCircuit size={64} />
        </motion.div>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-6xl font-display font-black text-slate-900 dark:text-white tracking-tighter">Instincts Sharpened!</h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">You earned <span className="text-amber-500 font-bold">{isReattempt ? 0 : score} XP</span> for your strategic decisions. 🧠</p>
          <div className="inline-flex flex-col items-center gap-4 mt-4">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500/10 text-amber-500 rounded-full text-lg font-black border border-amber-500/20">
              {isReattempt ? '+0 XP (Re-attempt)' : `+${score} XP Earned`}
            </div>
            {isReattempt && (
              <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">XP is only awarded on your first attempt of the day.</p>
            )}
          </div>
        </div>
        <div className="flex flex-col w-full max-w-xs gap-4">
          <ShareScoreButton
            generateImage={() => drawSkipStrategyCard({
              userName: profile?.displayName || 'Student',
              score,
            })}
          />
          <div className="space-y-2">
            {showReattemptWarning && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-amber-600 text-xs font-bold flex items-start gap-3 text-left"
              >
                <AlertTriangle size={16} className="shrink-0" />
                <p>Note: You have already completed this challenge today. No XP will be awarded for this session.</p>
              </motion.div>
            )}
            <button
              onClick={() => {
                if (!showReattemptWarning) {
                  setShowReattemptWarning(true);
                } else {
                  setCurrentIndex(0);
                  setScore(0);
                  setTimeLeft(15);
                  setFeedback(null);
                  setIsReattempt(true);
                  setShowReattemptWarning(false);
                }
              }}
              className="w-full py-5 btn-liquid-secondary rounded-2xl font-black uppercase tracking-widest text-xl"
            >
              {showReattemptWarning ? 'Start Anyway' : 'Play Again'}
            </button>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs hover:text-amber-500 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 md:space-y-8 pb-12 px-4 md:px-6 relative z-10">
      <div className="flex items-center justify-between bg-white/80 dark:bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-xl md:rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 shadow-2xl shadow-slate-200/20 dark:shadow-none">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-amber-500/10 text-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner shrink-0">
            <FastForward size={20} className="md:hidden" />
            <FastForward size={28} className="hidden md:block" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg md:text-2xl text-slate-900 dark:text-white tracking-tight">Skip or Solve</h2>
            <p className="text-[8px] md:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Identify Traps</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[8px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Time</p>
          <p className={`text-xl md:text-3xl font-black tracking-tighter ${timeLeft < 4 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>{timeLeft}s</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-white/5 p-5 md:p-12 rounded-xl md:rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden space-y-5 md:space-y-8"
        >
          {/* Timer Bar */}
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-100 dark:bg-white/5">
            <motion.div 
              className={`h-full ${timeLeft > 5 ? 'bg-amber-500' : timeLeft > 2 ? 'bg-orange-500' : 'bg-rose-500'}`}
              initial={{ width: '100%' }}
              animate={{ width: `${(timeLeft / 15) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">
              Question {currentIndex + 1}
            </div>
            <div className={`text-2xl font-black ${timeLeft <= 3 ? 'text-rose-500 animate-pulse' : 'text-slate-400 dark:text-slate-500'}`}>
              00:{timeLeft.toString().padStart(2, '0')}
            </div>
          </div>
          
          <div className="text-lg md:text-3xl font-display font-bold text-slate-900 dark:text-white leading-relaxed min-h-[80px] md:min-h-[120px]">
            <MathText text={currentQuestion?.text || ''} block />
          </div>

          {feedback ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-8 rounded-3xl border-2 flex items-start gap-4 ${feedback.isCorrect ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' : 'bg-rose-500/10 border-rose-500 text-rose-600'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${feedback.isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                {feedback.isCorrect ? <Zap size={24} /> : <XCircle size={24} />}
              </div>
              <div>
                <p className="font-black text-xl mb-1">{feedback.isCorrect ? 'W Decision!' : 'L Instinct...'}</p>
                <p className="text-sm font-medium opacity-90 leading-relaxed">
                  <MathText text={feedback.reason} />
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:gap-6 pt-4 md:pt-8">
              <button
                onClick={() => handleChoice('skip')}
                className="p-5 md:p-8 rounded-2xl md:rounded-3xl border-2 border-rose-500/20 bg-rose-500/5 text-rose-600 hover:bg-rose-500/10 hover:border-rose-500 transition-all font-black text-base md:text-xl uppercase tracking-widest flex flex-col items-center gap-3 md:gap-4 active:scale-95 group shadow-lg shadow-rose-500/5"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-rose-500 text-white rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <FastForward size={24} className="md:hidden" />
                  <FastForward size={32} className="hidden md:block" />
                </div>
                Skip It
              </button>
              <button
                onClick={() => handleChoice('solve')}
                className="p-5 md:p-8 rounded-2xl md:rounded-3xl border-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500 transition-all font-black text-base md:text-xl uppercase tracking-widest flex flex-col items-center gap-3 md:gap-4 active:scale-95 group shadow-lg shadow-emerald-500/5"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-500 text-white rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-transform">
                  <Zap size={24} className="md:hidden" />
                  <Zap size={32} className="hidden md:block" />
                </div>
                Solve It
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SkipStrategy;
