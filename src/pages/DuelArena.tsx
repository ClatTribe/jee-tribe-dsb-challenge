import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Zap, Clock, ChevronRight, Trophy, X, Shield, User, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import MathText from '../components/MathRenderer';
import { Question } from '../services/geminiService';
import { listenToDuel, updateDuelScore, Duel } from '../services/db';

const DuelArena = () => {
  const { duelId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins
  const [isGameOver, setIsGameOver] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [opponentName, setOpponentName] = useState('Opponent');
  const [duelData, setDuelData] = useState<Duel | null>(null);
  const [isBotMatch, setIsBotMatch] = useState(false);

  useEffect(() => {
    if (!duelId || !profile) return;

    const unsubscribe = listenToDuel(duelId, (duel) => {
      setDuelData(duel);
      setQuestions(duel.questions);
      
      // Update opponent info
      const opponentId = Object.keys(duel.players).find(id => id !== profile.uid);
      if (opponentId) {
        const opp = duel.players[opponentId];
        setOpponentName(opp.displayName);
        setOpponentScore(opp.score);
        setOpponentProgress((opp.currentIndex / duel.questions.length) * 100);
        setIsBotMatch(!!(opp as any).isBot);
      }

      // Update user score from DB (in case of multi-device or sync)
      const user = duel.players[profile.uid];
      if (user) {
        setUserScore(user.score);
        setCurrentIndex(user.currentIndex);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [duelId, profile]);

  // Bot simulation logic
  useEffect(() => {
    if (!isBotMatch || isGameOver || !duelId || !duelData) return;

    const opponentId = Object.keys(duelData.players).find(id => id !== profile?.uid);
    if (!opponentId) return;

    const botInterval = setInterval(async () => {
      const opp = duelData.players[opponentId];
      if (opp.completed) {
        clearInterval(botInterval);
        return;
      }

      // Bot makes a move every 8-15 seconds
      const nextIndex = opp.currentIndex + 1;
      const isCorrect = Math.random() > 0.3; // 70% accuracy for bot
      const newScore = isCorrect ? opp.score + 1 : opp.score;
      const completed = nextIndex >= questions.length;

      await updateDuelScore(duelId, opponentId, newScore, Math.min(nextIndex, questions.length - 1), completed);
    }, 8000 + Math.random() * 7000);

    return () => clearInterval(botInterval);
  }, [isBotMatch, isGameOver, duelId, duelData, questions.length, profile?.uid]);

  useEffect(() => {
    if (timeLeft <= 0 || loading || isGameOver) {
      if (timeLeft <= 0 && !isGameOver) setIsGameOver(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, isGameOver]);

  const handleAnswer = async (index: number) => {
    if (selectedOption !== null || isGameOver || !questions[currentIndex] || !duelId || !profile) return;
    
    setSelectedOption(index);
    const isCorrect = index === questions[currentIndex].correct;
    
    const newScore = isCorrect ? userScore + 1 : userScore;
    const isLastQuestion = currentIndex === questions.length - 1;
    const nextIndex = isLastQuestion ? currentIndex : currentIndex + 1;
    
    // Update score in Firestore
    await updateDuelScore(duelId, profile.uid, newScore, nextIndex, isLastQuestion);

    setTimeout(() => {
      if (!isLastQuestion) {
        // We don't manually setCurrentIndex here because the Firestore listener will do it
        // But for better UX we can do it locally too
        setCurrentIndex(nextIndex);
        setSelectedOption(null);
      } else {
        setIsGameOver(true);
      }
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Entering the Arena...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Arena is closed for maintenance. Try again later!</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-5xl mx-auto space-y-5 md:space-y-8 pb-12 px-2 md:px-0">
      {/* Duel Header - Mobile: compact row, Desktop: 3 columns */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-6 items-center">
        {/* User Info */}
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl p-3 md:p-4 rounded-xl md:rounded-3xl border border-slate-200/50 dark:border-white/5 flex items-center gap-2 md:gap-4">
          <div className="w-8 h-8 md:w-12 md:h-12 bg-amber-500 text-[#060818] rounded-lg md:rounded-2xl flex items-center justify-center font-black text-xs md:text-base shadow-lg shrink-0">
            {profile?.displayName?.substring(0, 2).toUpperCase() || 'ME'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-end mb-0.5 md:mb-1">
              <span className="text-[10px] md:text-sm font-black text-slate-900 dark:text-white truncate">You</span>
              <span className="text-[10px] md:text-xs font-black text-amber-500">{userScore}</span>
            </div>
            <div className="h-1.5 md:h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber-500"
                animate={{ width: `${(currentIndex / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Timer & VS */}
        <div className="flex flex-col items-center justify-center gap-1 md:gap-2">
          <div className="px-3 md:px-6 py-1.5 md:py-2 bg-[#060818] text-white rounded-full flex items-center gap-1.5 md:gap-2 shadow-xl border border-white/5">
            <Clock size={12} className="text-amber-500 md:hidden" />
            <Clock size={16} className="text-amber-500 hidden md:block" />
            <span className="font-mono font-black text-sm md:text-lg">{timeLeft}s</span>
          </div>
          <Swords size={16} className="text-slate-400 md:hidden" />
          <div className="hidden md:flex items-center gap-4">
            <div className="h-px w-12 bg-slate-200 dark:bg-white/5" />
            <Swords size={20} className="text-slate-400" />
            <div className="h-px w-12 bg-slate-200 dark:bg-white/5" />
          </div>
        </div>

        {/* Opponent Info */}
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl p-3 md:p-4 rounded-xl md:rounded-3xl border border-slate-200/50 dark:border-white/5 flex items-center gap-2 md:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-end mb-0.5 md:mb-1">
              <span className="text-[10px] md:text-xs font-black text-orange-500">{opponentScore}</span>
              <span className="text-[10px] md:text-sm font-black text-slate-900 dark:text-white truncate">{opponentName.split('_')[0]}</span>
            </div>
            <div className="h-1.5 md:h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-orange-500"
                animate={{ width: `${opponentProgress}%` }}
              />
            </div>
          </div>
          <div className="w-8 h-8 md:w-12 md:h-12 bg-orange-500 text-[#060818] rounded-lg md:rounded-2xl flex items-center justify-center font-black text-xs md:text-base shadow-lg shrink-0">
            {opponentName.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-white/5 p-5 md:p-12 rounded-xl md:rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-2xl min-h-[300px] md:min-h-[400px] flex flex-col justify-center relative overflow-hidden"
          >
            <div className="absolute top-8 left-8 flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
              <Zap size={12} className="text-amber-500" /> Question {currentIndex + 1} of {questions.length}
            </div>

            <div className="text-lg md:text-3xl font-display font-bold text-slate-900 dark:text-white leading-relaxed mb-6 md:mb-12">
              <MathText text={currentQuestion.text} block />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={selectedOption !== null}
                  className={`p-4 md:p-6 rounded-xl md:rounded-2xl border-2 text-left transition-all duration-300 flex items-center justify-between group ${
                    selectedOption === i
                      ? i === currentQuestion.correct
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600'
                        : 'bg-rose-500/10 border-rose-500 text-rose-600'
                      : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-amber-500/50 hover:bg-amber-500/5'
                  }`}
                >
                  <span className="font-bold text-sm md:text-lg"><MathText text={option} /></span>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedOption === i ? 'border-current' : 'border-slate-200 dark:border-slate-600 group-hover:border-amber-500/50'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#060818] p-5 md:p-8 rounded-xl md:rounded-[2.5rem] text-white shadow-2xl border border-white/5">
            <h3 className="text-lg font-display font-black mb-6 flex items-center gap-2">
              <Shield size={20} className="text-amber-500" /> Battle Intel
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Subject</span>
                <span className="font-black text-amber-500">{currentQuestion.subject}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Difficulty</span>
                <span className="font-black text-amber-500">{currentQuestion.difficulty}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Avg. Time</span>
                <span className="font-black text-slate-300">12s</span>
              </div>
            </div>
          </div>

          <div className="bg-white/50 dark:bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-slate-200/50 dark:border-white/5 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Pro Tip</p>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Speed is key, but accuracy is king. Don't rush the math. 🧠</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-[#060818]/90 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-[#060818] p-6 md:p-12 rounded-2xl md:rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-2xl max-w-lg w-full text-center space-y-5 md:space-y-8"
            >
              <div className="w-16 h-16 md:w-24 md:h-24 bg-amber-500/10 text-amber-500 rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto">
                <Trophy size={32} className="md:hidden" />
                <Trophy size={48} className="hidden md:block" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl md:text-4xl font-display font-black text-slate-900 dark:text-white">Duel Finished!</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">The battle has concluded. Here are the results:</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-amber-500/10 rounded-3xl border border-amber-500/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">You</p>
                  <p className="text-4xl font-black text-slate-900 dark:text-white">{userScore}</p>
                </div>
                <div className="p-6 bg-orange-500/10 rounded-3xl border border-orange-500/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-1">{opponentName}</p>
                  <p className="text-4xl font-black text-slate-900 dark:text-white">{opponentScore}</p>
                </div>
              </div>

              <div className="pt-4">
                <div className={`text-2xl font-black uppercase tracking-tighter mb-8 ${
                  userScore > opponentScore ? 'text-emerald-500' : userScore < opponentScore ? 'text-rose-500' : 'text-amber-500'
                }`}>
                  {userScore > opponentScore ? 'Victory!' : userScore < opponentScore ? 'Defeat' : 'It\'s a Draw!'}
                </div>
                
                <button 
                  onClick={() => navigate('/')}
                  className="w-full py-5 btn-liquid rounded-2xl font-black text-xl uppercase tracking-widest shadow-xl"
                >
                  Return to Base
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DuelArena;
