import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Heart, ShieldAlert, ChevronRight, Zap, Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MathText from '../components/MathRenderer';
import { getDailyQuestions, Question } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { submitMiniGameScore, checkAttempt } from '../services/db';

const SuddenDeath = () => {
  const { profile } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins
  const [gameOver, setGameOver] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isReattempt, setIsReattempt] = useState(false);
  const [showReattemptWarning, setShowReattemptWarning] = useState(false);
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];
  const challengeId = `sudden-death-${today}`;

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!profile) return;
      try {
        const [daily, attempted] = await Promise.all([
          getDailyQuestions(),
          checkAttempt(profile.uid, challengeId)
        ]);
        setQuestions(daily.suddenDeath);
        setIsReattempt(attempted);
      } catch (error) {
        console.error("Failed to fetch questions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [profile, challengeId]);

  useEffect(() => {
    if (timeLeft <= 0 || gameOver || loading) {
      if (timeLeft <= 0 && !gameOver) handleGameOver();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameOver, loading]);

  const handleGameOver = async () => {
    setGameOver(true);
    if (profile) {
      await submitMiniGameScore(profile.uid, challengeId, score, isReattempt);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (index: number) => {
    if (gameOver || selectedOption !== null || !currentQuestion) return;
    
    setSelectedOption(index);
    
    if (index === currentQuestion.correct) {
      const newScore = score + 10;
      setScore(newScore);
      setTimeout(() => {
        setSelectedOption(null);
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          // Win state
          handleGameOver();
        }
      }, 1000);
    } else {
      setTimeout(() => {
        handleGameOver();
      }, 1000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Generating Daily Challenges...</p>
      </div>
    );
  }

  if (!currentQuestion && !gameOver) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No questions available for today. Try again later!</p>
      </div>
    );
  }

  if (gameOver) {
    const isWin = selectedOption === currentQuestion?.correct;
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 px-6">
        <motion.div 
          initial={{ scale: 0, rotate: -180 }} 
          animate={{ scale: 1, rotate: 0 }} 
          className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center shadow-2xl ${isWin ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-rose-500 text-white shadow-rose-500/30'}`}
        >
          {isWin ? <Zap size={64} /> : <Skull size={64} />}
        </motion.div>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-6xl font-display font-black text-slate-900 dark:text-white tracking-tighter">
            {isWin ? 'W Victory!' : 'L Ratio...'}
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">
            {isWin ? 'You survived the gauntlet. Main character energy. ✨' : `You survived ${score / 10} questions. We go again. 😤`}
          </p>
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
                  setTimeLeft(600);
                  setGameOver(false);
                  setSelectedOption(null);
                  setIsReattempt(true);
                  setShowReattemptWarning(false);
                }
              }}
              className="w-full py-5 btn-liquid-secondary rounded-2xl font-black uppercase tracking-widest text-xl"
            >
              {showReattemptWarning ? 'Start Anyway' : 'Try Again'}
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
    <div className="max-w-3xl mx-auto space-y-8 pb-12 px-6 relative z-10">
      <div className="flex items-center justify-between bg-white/80 dark:bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 shadow-2xl shadow-slate-200/20 dark:shadow-none">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner">
            <Skull size={28} />
          </div>
          <div>
            <h2 className="font-display font-black text-2xl text-slate-900 dark:text-white tracking-tight">Sudden Death</h2>
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">1 Mistake = Game Over 💀</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Time Left</p>
          <p className={`text-3xl font-black tracking-tighter ${timeLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>{formatTime(timeLeft)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Current Streak</p>
          <p className="text-3xl font-black text-rose-500 tracking-tighter">{score / 10}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white dark:bg-white/5 p-8 md:p-12 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-8 left-8 flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Zap size={12} className="text-amber-500" /> Question {currentIndex + 1}
          </div>

          <div className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white leading-relaxed mb-12 pt-8">
            <MathText text={currentQuestion?.text || ''} block />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {currentQuestion?.options?.map((option, i) => {
              let btnClass = "bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 hover:border-amber-500/50 hover:bg-amber-500/5";
              if (selectedOption !== null) {
                if (i === currentQuestion.correct) {
                  btnClass = "bg-emerald-500/10 border-emerald-500 text-emerald-600";
                } else if (i === selectedOption) {
                  btnClass = "bg-rose-500/10 border-rose-500 text-rose-600";
                } else {
                  btnClass = "bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-400 opacity-50";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={selectedOption !== null}
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-medium text-lg flex items-center gap-4 ${btnClass}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${selectedOption !== null && i === currentQuestion.correct ? 'bg-emerald-500 text-white' : selectedOption === i ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <MathText text={option} />
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SuddenDeath;
