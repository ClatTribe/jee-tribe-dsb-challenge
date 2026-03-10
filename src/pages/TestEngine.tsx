import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { submitChallenge, checkAttempt } from '../services/db';
import { Question, Submission, TestResult } from '../utils/evaluationUtils';
import MathText from '../components/MathRenderer';
import { Clock, ChevronLeft, ChevronRight, Send, AlertCircle, Trophy, Bookmark, BookmarkCheck, X, HelpCircle, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { getDailyQuestions, Question as GeminiQuestion } from '../services/geminiService';

const TestEngine = () => {
  const { challengeId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [challenge, setChallenge] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showSolutions, setShowSolutions] = useState(false);
  const [isReattempt, setIsReattempt] = useState(false);

  // Time tracking per question
  const questionStartTime = useRef<number>(Date.now());

  useEffect(() => {
    const fetchData = async () => {
      if (!challengeId || !profile) return;

      try {
        setLoading(true);
        // Check for re-attempt
        const hasAttempted = await checkAttempt(profile.uid, challengeId);
        setIsReattempt(hasAttempted);

        if (challengeId === 'daily-mini-mock') {
          const daily = await getDailyQuestions();
          if (!daily || !daily.miniMock) throw new Error("Invalid daily questions data");
          
          const miniMockQuestions = daily.miniMock.map(q => ({
            id: q.id,
            questionText: q.text,
            options: q.options || [],
            correctAnswers: q.options && q.options[q.correct] ? q.options[q.correct] : 'N/A',
            subject: q.subject,
            topic: 'Daily Sprint',
            difficulty: 'Hard',
            questionType: 'Single MCQ',
            explanation: q.explanation,
            marksCorrect: 4,
            marksWrong: 1
          } as Question));
          
          setQuestions(miniMockQuestions);
          setChallenge({
            title: 'JEE Mains Daily Sprint',
            duration: 30,
            markingScheme: miniMockQuestions.reduce((acc, q) => ({
              ...acc,
              [q.id]: { positive: 4, negative: 1 }
            }), {})
          });
          setTimeLeft(30 * 60);
        } else {
          const challengeRef = doc(db, 'dailyChallenges', challengeId);
          const challengeSnap = await getDoc(challengeRef);
          
          if (challengeSnap.exists()) {
            const data = challengeSnap.data();
            setChallenge(data);
            setTimeLeft(data.duration * 60);

            const qRefs = data.questionIds;
            if (qRefs && qRefs.length > 0) {
              const qSnap = await getDocs(query(collection(db, 'questionBank'), where(documentId(), 'in', qRefs)));
              const fetchedQuestions = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
              const sortedQuestions = qRefs.map((id: string) => fetchedQuestions.find(q => q.id === id)).filter(Boolean) as Question[];
              setQuestions(sortedQuestions);
            }
          }
        }
      } catch (error) {
        console.error("Error in TestEngine fetchData:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [challengeId, profile]);

  useEffect(() => {
    if (timeLeft <= 0 || showResults || showStartScreen) {
      if (timeLeft <= 0 && !showResults && !loading && !showStartScreen) handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, showResults, loading, showStartScreen]);

  const updateTimeSpent = () => {
    const now = Date.now();
    const spent = Math.floor((now - questionStartTime.current) / 1000);
    const qId = questions[currentIndex]?.id;
    if (qId) {
      setSubmissions(prev => ({
        ...prev,
        [qId]: { 
          ...(prev[qId] || { questionId: qId, timeSpent: 0, isMarkedForReview: false }), 
          timeSpent: (prev[qId]?.timeSpent || 0) + spent 
        }
      }));
    }
    questionStartTime.current = now;
  };

  const handleIndexChange = (newIndex: number) => {
    updateTimeSpent();
    setCurrentIndex(newIndex);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOptionSelect = (qId: string, opt: string) => {
    const q = questions.find(q => q.id === qId);
    if (!q) return;

    setSubmissions(prev => {
      const current = prev[qId] || { questionId: qId, selectedOptions: [], timeSpent: 0, isMarkedForReview: false };
      let newOptions = current.selectedOptions || [];

      if (q.questionType === 'Single MCQ') {
        newOptions = [opt];
      } else {
        newOptions = newOptions.includes(opt) 
          ? newOptions.filter(o => o !== opt) 
          : [...newOptions, opt];
      }

      return { ...prev, [qId]: { ...current, selectedOptions: newOptions } };
    });
  };

  const handleNumericalChange = (qId: string, val: string) => {
    setSubmissions(prev => ({
      ...prev,
      [qId]: { 
        ...(prev[qId] || { questionId: qId, timeSpent: 0, isMarkedForReview: false }), 
        numericalValue: parseFloat(val) 
      }
    }));
  };

  const toggleMarkForReview = () => {
    const qId = questions[currentIndex].id;
    setSubmissions(prev => ({
      ...prev,
      [qId]: { 
        ...(prev[qId] || { questionId: qId, timeSpent: 0, isMarkedForReview: false }), 
        isMarkedForReview: !prev[qId]?.isMarkedForReview 
      }
    }));
  };

  const handleSubmit = async () => {
    if (!profile || !challenge || isSubmitting) return;
    updateTimeSpent();
    setIsSubmitting(true);
    const result = await submitChallenge(
      profile.uid,
      challengeId!,
      Object.values(submissions),
      questions,
      challenge.markingScheme,
      !isReattempt
    );
    setTestResult(result);
    setShowResults(true);
    setIsSubmitting(false);
    setShowSubmitConfirm(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-[#060818] gap-4 transition-colors">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-amber-500"></div>
      <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs">Initializing Test Engine...</p>
    </div>
  );

  if (!challenge) return <div className="text-center py-20 font-display font-bold text-slate-400">Challenge not found.</div>;

  if (showStartScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-white dark:bg-white/5 backdrop-blur-xl p-12 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-2xl space-y-8 text-center"
        >
          <div className="w-20 h-20 bg-primary/10 dark:bg-amber-500/10 text-primary dark:text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto">
            <BookOpen size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-display font-black text-slate-900 dark:text-white">
              <MathText text={challenge.title} />
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Ready to test your knowledge? Review the details below.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-slate-100 dark:border-white/5">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Duration</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{challenge.duration} Mins</p>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-slate-100 dark:border-white/5">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Questions</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{questions.length}</p>
            </div>
          </div>

          {isReattempt && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl text-amber-700 text-sm font-bold flex items-start gap-4 text-left">
              <AlertCircle size={24} className="shrink-0 text-amber-500" />
              <div className="space-y-1">
                <p className="text-lg font-black uppercase tracking-tight">Re-attempt Detected</p>
                <p className="opacity-80">You have already completed this test. You can practice again, but <span className="underline decoration-amber-500/50">no XP, coins, or streak updates</span> will be awarded for this session.</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => {
                setShowStartScreen(false);
                questionStartTime.current = Date.now();
              }}
              className="w-full py-5 btn-liquid-secondary rounded-2xl font-black uppercase tracking-widest text-xl shadow-xl shadow-amber-500/20"
            >
              Start Challenge
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-primary transition-colors"
            >
              Cancel and Return
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  if (showResults) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto py-12 px-6 space-y-12"
      >
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-success/10 text-success rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-success/10">
            <Trophy size={48} />
          </div>
          <h1 className="text-5xl font-display font-black text-slate-900 dark:text-white">Challenge Complete!</h1>
          {isReattempt && (
            <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-6 py-3 rounded-2xl font-bold text-sm inline-block">
              ⚠️ Re-attempt detected. No new points or coins awarded.
            </div>
          )}
          <p className="text-slate-500 dark:text-slate-400 font-medium">Excellent work. Here's your performance breakdown.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Total Score</p>
            <p className="text-5xl font-black text-primary dark:text-amber-500">{testResult?.totalScore}</p>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2">out of {testResult?.maxScore}</p>
          </div>
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Accuracy</p>
            <p className="text-5xl font-black text-success">{Math.round((testResult?.accuracy || 0) * 100)}%</p>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2">Correct attempts</p>
          </div>
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Negative Marks</p>
            <p className="text-5xl font-black text-danger">-{testResult?.marksLostToNegative}</p>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2">Points lost</p>
          </div>
        </div>

        <div className="bg-dark-bg p-10 rounded-[3rem] text-white shadow-2xl">
          <h3 className="text-2xl font-display font-black mb-8">Subject Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {Object.entries(testResult?.subjectBreakdown || {}).map(([subject, data]: [string, any]) => (
              <div key={subject} className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-sm font-black uppercase tracking-widest text-slate-400">{subject}</p>
                  <p className="text-2xl font-black text-white">{data.score}</p>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(data.correct / (data.correct + data.wrong + data.skipped || 1)) * 100}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-success rounded-full" /> {data.correct} Correct</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-danger rounded-full" /> {data.wrong} Wrong</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button 
            onClick={() => setShowSolutions(!showSolutions)}
            className="px-12 py-5 rounded-2xl font-black text-lg border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
          >
            {showSolutions ? 'Hide Solutions' : 'Review Solutions'}
          </button>
          <button 
            onClick={() => navigate('/')}
            className="btn-liquid px-12 py-5 rounded-2xl font-black text-lg active:scale-95"
          >
            Back to Dashboard
          </button>
        </div>

        <AnimatePresence>
          {showSolutions && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6 pt-8"
            >
              <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white mb-6">Detailed Solutions</h3>
              {questions.map((q, idx) => {
                const sub = submissions[q.id];
                const isCorrect = testResult?.results.find(r => r.questionId === q.id)?.isCorrect;
                const isSkipped = !sub || (q.questionType !== 'Numerical' && (!sub.selectedOptions || sub.selectedOptions.length === 0)) || (q.questionType === 'Numerical' && sub.numericalValue === undefined);

                return (
                  <div key={q.id} className={`p-8 rounded-[2rem] border-2 ${isSkipped ? 'border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5' : isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Question {idx + 1} • {q.subject}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${isSkipped ? 'bg-slate-100 text-slate-500' : isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {isSkipped ? 'Skipped' : isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    
                    <div className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-6">
                      <MathText text={q.questionText} block />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="p-4 rounded-xl bg-white dark:bg-black/20 border border-slate-100 dark:border-white/5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Answer</p>
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          {isSkipped ? 'No answer provided' : q.questionType === 'Numerical' ? sub.numericalValue : sub.selectedOptions?.join(', ')}
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-black/20 border border-slate-100 dark:border-white/5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Correct Answer</p>
                        <div className="font-bold text-emerald-600">
                          {Array.isArray(q.correctAnswers) ? q.correctAnswers.join(', ') : q.correctAnswers}
                        </div>
                      </div>
                    </div>

                    {q.explanation && (
                      <div className="mt-6 p-6 bg-primary/5 dark:bg-amber-500/5 rounded-2xl border border-primary/10 dark:border-amber-500/10">
                        <p className="text-[10px] font-black text-primary dark:text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <BookOpen size={14} /> Step-by-Step Solution
                        </p>
                        <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          <MathText text={q.explanation} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-120px)] pb-6 relative">
      <div className="lg:col-span-3 flex flex-col gap-6">
        {/* Header */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Question</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{currentIndex + 1} <span className="text-slate-300 dark:text-slate-600">/ {questions.length}</span></span>
            </div>
            <div className="h-10 w-px bg-slate-100 dark:bg-white/5" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Subject</span>
              <span className="text-sm font-black text-primary dark:text-amber-500 uppercase tracking-tight">{currentQuestion?.subject}</span>
            </div>
          </div>
          
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-mono font-black text-xl transition-all ${timeLeft < 300 ? 'bg-danger/10 text-danger animate-pulse' : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200'}`}>
            <Clock size={20} />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 bg-white dark:bg-white/5 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-sm overflow-y-auto custom-scrollbar">
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-black px-3 py-1.5 bg-primary/10 dark:bg-amber-500/10 text-primary dark:text-amber-500 rounded-xl border border-primary/10 dark:border-amber-500/10 tracking-widest">
                  {currentQuestion?.questionType}
                </span>
                <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest">
                  Correct: <span className="text-success">+{challenge.markingScheme[currentQuestion?.id]?.positive}</span> • 
                  Wrong: <span className="text-danger">-{challenge.markingScheme[currentQuestion?.id]?.negative}</span>
                </span>
              </div>
              <button 
                onClick={toggleMarkForReview}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  submissions[currentQuestion?.id]?.isMarkedForReview 
                    ? 'bg-danger text-white shadow-lg shadow-danger/20' 
                    : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                {submissions[currentQuestion?.id]?.isMarkedForReview ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                Review
              </button>
            </div>
            
            <div className="text-xl md:text-2xl text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              <MathText text={currentQuestion?.questionText} block />
            </div>

            {currentQuestion?.questionType !== 'Numerical' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {currentQuestion?.options?.map((opt, i) => {
                  const isSelected = submissions[currentQuestion.id]?.selectedOptions?.includes(opt);
                  return (
                    <button
                      key={i}
                      onClick={() => handleOptionSelect(currentQuestion.id, opt)}
                      className={`p-6 rounded-[1.5rem] border-2 text-left transition-all flex items-center gap-5 group ${
                        isSelected 
                          ? 'bg-primary/5 dark:bg-amber-500/5 border-primary dark:border-amber-500 shadow-lg shadow-primary/5' 
                          : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all ${
                        isSelected ? 'bg-primary dark:bg-amber-500 text-white scale-110' : 'bg-slate-50 dark:bg-white/10 text-slate-400 dark:text-slate-500 group-hover:bg-slate-100 dark:group-hover:bg-white/20'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <div className="flex-1 font-bold text-slate-700 dark:text-slate-300">
                        <MathText text={opt} />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="pt-4 max-w-sm">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-widest">Your Numerical Answer</label>
                <input 
                  type="number"
                  step="any"
                  placeholder="Enter value..."
                  value={submissions[currentQuestion.id]?.numericalValue || ''}
                  onChange={(e) => handleNumericalChange(currentQuestion.id, e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 rounded-[1.5rem] px-8 py-5 text-2xl font-black focus:border-primary dark:focus:border-amber-500 focus:bg-white dark:focus:bg-[#060818] outline-none transition-all placeholder:text-slate-200 dark:placeholder:text-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between gap-4">
          <button 
            onClick={() => handleIndexChange(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 transition-all uppercase text-xs tracking-widest"
          >
            <ChevronLeft size={20} /> Back
          </button>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setSubmissions(prev => {
                  const { [currentQuestion.id]: _, ...rest } = prev;
                  return rest;
                });
              }}
              className="px-6 py-4 rounded-2xl font-black text-slate-400 dark:text-slate-500 hover:text-danger dark:hover:text-danger hover:bg-danger/5 transition-all uppercase text-xs tracking-widest"
            >
              Clear
            </button>
            {currentIndex === questions.length - 1 ? (
              <button 
                onClick={() => setShowSubmitConfirm(true)}
                className="flex items-center gap-3 bg-success text-white px-10 py-4 rounded-2xl font-black hover:bg-emerald-600 transition-all shadow-xl shadow-success/20 uppercase text-xs tracking-widest"
              >
                Finish Test <Send size={18} />
              </button>
            ) : (
              <button 
                onClick={() => handleIndexChange(Math.min(questions.length - 1, currentIndex + 1))}
                className="flex items-center gap-3 btn-liquid px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest"
              >
                Next <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Palette */}
      <div className="hidden lg:flex flex-col gap-6">
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-sm flex-1 flex flex-col">
          <h3 className="font-display font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
            <AlertCircle size={20} className="text-primary dark:text-amber-500" /> Question Palette
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {questions.map((q, i) => {
              const sub = submissions[q.id];
              const isAnswered = sub && (
                (sub.selectedOptions && sub.selectedOptions.length > 0) ||
                (sub.numericalValue !== undefined)
              );
              const isMarked = sub?.isMarkedForReview;
              
              let bgColor = 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-400 dark:text-slate-500';
              if (currentIndex === i) bgColor = 'bg-primary dark:bg-amber-500 border-primary dark:border-amber-500 text-white shadow-lg shadow-primary/20';
              else if (isMarked) bgColor = 'bg-danger border-danger text-white shadow-lg shadow-danger/20';
              else if (isAnswered) bgColor = 'bg-success/10 dark:bg-success/20 border-success/20 dark:border-success/30 text-success';
              
              return (
                <button
                  key={q.id}
                  onClick={() => handleIndexChange(i)}
                  className={`w-full aspect-square rounded-xl font-black text-sm transition-all border-2 ${bgColor} hover:scale-105 active:scale-95`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          
          <div className="mt-auto pt-8 border-t border-slate-100 dark:border-white/5 space-y-4">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              <div className="w-4 h-4 bg-primary dark:bg-amber-500 rounded-md" /> Current
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              <div className="w-4 h-4 bg-success/20 border border-success/30 rounded-md" /> Answered
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              <div className="w-4 h-4 bg-danger rounded-md" /> Marked for Review
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              <div className="w-4 h-4 bg-slate-50 dark:bg-white/10 border border-slate-100 dark:border-white/10 rounded-md" /> Unvisited
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubmitConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-[#060818] w-full max-w-md p-10 rounded-[3rem] shadow-2xl space-y-8 border border-white/5"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-primary/10 dark:bg-amber-500/10 text-primary dark:text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto">
                  <HelpCircle size={40} />
                </div>
                <h3 className="text-3xl font-display font-black text-slate-900 dark:text-white">Submit Test?</h3>
                {isReattempt && (
                  <p className="text-amber-600 dark:text-amber-400 font-bold text-sm bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl">
                    Note: You have already attempted this test. No points will be awarded for this session.
                  </p>
                )}
                <p className="text-slate-500 dark:text-slate-400 font-medium">You've answered {Object.keys(submissions).length} out of {questions.length} questions. Are you sure you want to finish?</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowSubmitConfirm(false)}
                  className="px-6 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all uppercase text-xs tracking-widest"
                >
                  Go Back
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-4 btn-liquid rounded-2xl font-black uppercase text-xs tracking-widest"
                >
                  {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TestEngine;
