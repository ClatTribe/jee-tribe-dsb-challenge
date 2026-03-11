import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MathText from '../components/MathRenderer';
import { RefreshCw, ChevronLeft, ChevronRight, Book, Zap, CheckCircle2, Trophy, Loader2 } from 'lucide-react';
import { getDailyQuestions, Question } from '../services/geminiService';

const Flashcards = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mastered, setMastered] = useState<number[]>([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const daily = await getDailyQuestions();
        setQuestions(daily.flashcards);
      } catch (error) {
        console.error("Failed to fetch questions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % questions.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + questions.length) % questions.length);
    }, 150);
  };

  const toggleMastered = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mastered.includes(currentIndex)) {
      setMastered(mastered.filter(i => i !== currentIndex));
    } else {
      setMastered([...mastered, currentIndex]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-secondary animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Preparing Daily Flashcards...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No flashcards available for today. Try again later!</p>
      </div>
    );
  }

  const current = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-8 md:space-y-12 py-4 md:py-8 pb-20 px-4 md:px-0">
      <div className="text-center space-y-3 md:space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full text-[10px] font-black uppercase tracking-widest">
          <Zap size={14} /> Active Recall Mode
        </div>
        <h1 className="text-2xl md:text-4xl font-display font-black tracking-tight text-slate-900">Smart <span className="text-secondary">Flashcards</span></h1>
        <p className="text-sm md:text-base text-slate-500 font-medium">Quickly recall essential formulas and theorems.</p>
      </div>

      <div className="relative h-[380px] md:h-[450px] perspective-1000">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50, rotate: 5 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: -50, rotate: -5 }}
            className="w-full h-full cursor-pointer"
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
              className="w-full h-full relative preserve-3d"
              onClick={() => {
                console.log('Card clicked, current flip state:', isFlipped);
                setIsFlipped(!isFlipped);
              }}
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-white rounded-2xl md:rounded-[3rem] border-2 border-slate-100 shadow-2xl p-6 md:p-12 flex flex-col items-center justify-center text-center space-y-5 md:space-y-8">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                    current.subject === 'Physics' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                    current.subject === 'Chemistry' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                  }`}>
                    {current.subject}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{current.difficulty}</span>
                </div>
                <div className="text-xl md:text-3xl font-display font-black text-slate-800 leading-tight">
                  <MathText text={current?.text || ''} block />
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest">
                    <RefreshCw size={16} className="animate-spin-slow" /> Tap to reveal formula
                  </div>
                  <button 
                    onClick={toggleMastered}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      mastered.includes(currentIndex) 
                        ? 'bg-success text-white shadow-lg shadow-success/20' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 size={16} /> {mastered.includes(currentIndex) ? 'Mastered' : 'Mark as Mastered'}
                  </button>
                </div>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 backface-hidden bg-dark-bg rounded-2xl md:rounded-[3rem] shadow-2xl p-6 md:p-12 flex flex-col items-center justify-center text-center space-y-5 md:space-y-8 text-white border-4 border-secondary/20"
                style={{ transform: 'rotateY(180deg)' }}
              >
                <div className="text-2xl font-black">
                  <MathText text={current?.options?.[current?.correct || 0] || 'No answer provided'} block />
                </div>
                <div className="space-y-4">
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Explanation</p>
                  <p className="text-sm font-medium text-slate-300 max-w-sm mx-auto">
                    <MathText text={current?.explanation || ''} />
                  </p>
                  <div className="flex items-center gap-2 text-secondary font-black justify-center">
                    <Trophy size={20} /> Keep it up!
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between px-2 md:px-8">
        <button 
          onClick={prevCard}
          className="p-5 rounded-3xl bg-white border-2 border-slate-100 text-slate-400 hover:text-secondary hover:border-secondary transition-all shadow-sm active:scale-95"
        >
          <ChevronLeft size={28} />
        </button>
        <div className="flex flex-col items-center gap-1">
          <div className="text-xl font-black text-slate-900">
            {currentIndex + 1} <span className="text-slate-300">/ {questions.length}</span>
          </div>
          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-secondary transition-all duration-500" 
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <button 
          onClick={nextCard}
          className="p-5 rounded-3xl bg-white border-2 border-slate-100 text-slate-400 hover:text-secondary hover:border-secondary transition-all shadow-sm active:scale-95"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      <div className="bg-white p-5 md:p-8 rounded-xl md:rounded-[2.5rem] border border-slate-200 flex items-start gap-4 md:gap-6 shadow-sm">
        <div className="w-10 h-10 md:w-14 md:h-14 bg-secondary/10 rounded-xl md:rounded-2xl flex items-center justify-center text-secondary shadow-sm shrink-0">
          <Book size={22} className="md:hidden" />
          <Book size={28} className="hidden md:block" />
        </div>
        <div className="space-y-1 md:space-y-2">
          <h4 className="font-display font-black text-slate-900 text-base md:text-lg uppercase tracking-tight">Recall Practice</h4>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            Active recall is the most effective way to memorize JEE formulas. Try to visualize the entire derivation before flipping the card.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Flashcards;
