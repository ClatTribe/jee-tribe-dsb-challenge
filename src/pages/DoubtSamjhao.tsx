import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, orderBy, limit as fbLimit } from 'firebase/firestore';
import { db } from '../firebase';
import { getDailyQuestions, Question as GeminiQuestion } from '../services/geminiService';
import { askDoubtTutor, TutorMessage } from '../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Bot, User, Sparkles, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import MathText from '../components/MathRenderer';

interface QuestionContext {
  questionText: string;
  options: string[];
  correct: number;
  studentAnswer: number | null;
  explanation: string;
  subject: string;
}

const DoubtSamjhao = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Question context can come from navigation state (from TestEngine results) or be selected here
  const passedQuestion = (location.state as any)?.question as QuestionContext | undefined;

  const [question, setQuestion] = useState<QuestionContext | null>(passedQuestion || null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [wrongQuestions, setWrongQuestions] = useState<QuestionContext[]>([]);
  const [fetchingQuestions, setFetchingQuestions] = useState(!passedQuestion);
  const [showQuestionPicker, setShowQuestionPicker] = useState(!passedQuestion);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch wrong answers by cross-referencing history with daily questions
  useEffect(() => {
    const fetchWrongAnswers = async () => {
      if (!profile?.uid || passedQuestion) return;
      setFetchingQuestions(true);

      try {
        // 1. Fetch daily questions (has actual question text, options, explanations)
        const dailyQuestions = await getDailyQuestions(profile?.exam, profile?.cuetDomain);

        // Build a map of all questions by ID for quick lookup
        const allQuestions: GeminiQuestion[] = [
          ...(dailyQuestions.miniMock || []),
          ...(dailyQuestions.flashcards || []),
          ...(dailyQuestions.suddenDeath || []),
          ...(dailyQuestions.skipOrSolve || []),
          ...(dailyQuestions.duels || []),
        ];
        const questionMap = new Map<string, GeminiQuestion>();
        allQuestions.forEach(q => questionMap.set(q.id, q));

        // 2. Fetch recent history to find wrong answers
        const historyRef = collection(db, 'users', profile.uid, 'history');
        const q = query(historyRef, orderBy('timestamp', 'desc'), fbLimit(20));
        const snap = await getDocs(q);

        const wrong: QuestionContext[] = [];
        const seenIds = new Set<string>();

        snap.docs.forEach(doc => {
          const data = doc.data();
          if (!data.results) return;

          data.results.forEach((r: any) => {
            if (r.isCorrect || !r.questionId || seenIds.has(r.questionId)) return;
            seenIds.add(r.questionId);

            // Try to find the full question data
            const fullQ = questionMap.get(r.questionId);
            if (fullQ) {
              // Find what the student selected — match option text to index
              let studentAnswer: number | null = null;
              // We don't have the exact selected option from history results,
              // so we leave it as null (the tutor knows it was wrong)

              wrong.push({
                questionText: fullQ.text,
                options: fullQ.options,
                correct: fullQ.correct,
                studentAnswer,
                explanation: fullQ.explanation,
                subject: fullQ.subject,
              });
            }
          });
        });

        // If no wrong from history matching today's questions,
        // also show all today's questions as "practice doubts"
        if (wrong.length === 0 && allQuestions.length > 0) {
          // Show first 5 questions as available for discussion
          allQuestions.slice(0, 8).forEach(q => {
            wrong.push({
              questionText: q.text,
              options: q.options,
              correct: q.correct,
              studentAnswer: null,
              explanation: q.explanation,
              subject: q.subject,
            });
          });
        }

        setWrongQuestions(wrong);
      } catch (error) {
        console.error('Error fetching wrong answers:', error);
      } finally {
        setFetchingQuestions(false);
      }
    };

    fetchWrongAnswers();
  }, [profile, passedQuestion]);

  // Auto-greet when question is set
  useEffect(() => {
    if (question && messages.length === 0) {
      setMessages([{
        role: 'tutor',
        content: `Hey! 👋 Dekh, is question mein ${question.studentAnswer !== null ? 'galat option choose hua' : 'let me help you understand this one'}. Koi baat nahi — I'll break it down step by step. Pehle question padh le aur phir mujhse pucho jo samajh nahi aaya. Kuch bhi pooch sakte ho — "ye formula kahan se aaya?", "step 2 samjhao", ya "ek aur example do" — I'm here for you! 🚀`
      }]);
    }
  }, [question]);

  const sendMessage = async () => {
    if (!input.trim() || !question || loading) return;

    const userMsg: TutorMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await askDoubtTutor(
        question.questionText,
        question.options,
        question.correct,
        question.studentAnswer,
        question.explanation,
        question.subject,
        [...messages, userMsg],
        userMsg.content
      );

      setMessages(prev => [...prev, { role: 'tutor', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'tutor',
        content: 'Oops, kuch technical issue aa gaya. Ek baar phir try karo! 🤗'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const selectQuestion = (q: QuestionContext) => {
    setQuestion(q);
    setMessages([]);
    setShowQuestionPicker(false);
  };

  // Quick prompts
  const quickPrompts = [
    'Step by step samjhao',
    'Ye formula kahan se aaya?',
    'Ek aur example do',
    'Aur simple mein samjhao',
    'Mera answer galat kyu hai?',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-h-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/80 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 flex items-center justify-center hover:scale-110 transition-transform">
            <ArrowLeft size={20} className="text-slate-500" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tighter text-slate-900 dark:text-white">
              Doubt Samjhao 🧑‍🏫
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">AI Tutor — poocho kuch bhi, bilkul free!</p>
          </div>
        </div>
        {question && (
          <button
            onClick={() => { setShowQuestionPicker(true); setQuestion(null); setMessages([]); }}
            className="text-xs font-black text-amber-500 hover:text-amber-400 transition-colors"
          >
            Change Question
          </button>
        )}
      </div>

      {/* Question Picker */}
      {showQuestionPicker && (
        <div className="space-y-3 mb-4 flex-1 overflow-y-auto">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
            <h3 className="font-black text-amber-500 text-sm mb-2 flex items-center gap-2">
              <BookOpen size={16} /> Select a question to discuss
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {wrongQuestions.length > 0
                ? "Pick any question below — I'll explain it step by step."
                : "Your wrong answers from today's challenges will appear here."}
            </p>
          </div>

          {fetchingQuestions ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 size={24} className="text-amber-500 animate-spin" />
              <p className="text-xs font-bold text-slate-400">Loading today's questions...</p>
            </div>
          ) : wrongQuestions.length > 0 ? (
            <div className="space-y-2">
              {wrongQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => selectQuestion(q)}
                  className="w-full text-left p-4 bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-xl border border-slate-200/50 dark:border-white/5 hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={14} className="text-rose-500" />
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{q.subject}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                    <MathText text={q.questionText} />
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {q.options.slice(0, 4).map((opt, j) => (
                      <span key={j} className={`text-[9px] px-1.5 py-0.5 rounded ${
                        j === q.correct
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                      }`}>
                        {String.fromCharCode(65 + j)}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              <p className="font-bold">No questions available yet!</p>
              <p className="text-xs mt-1">Attempt a daily challenge first, then come back here for help.</p>
            </div>
          )}
        </div>
      )}

      {/* Question Display + Chat */}
      {question && !showQuestionPicker && (
        <>
          {/* Question Card (collapsed) */}
          <div className="bg-[#060818] rounded-xl p-4 mb-4 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/20 px-2 py-0.5 rounded-full">{question.subject}</span>
            </div>
            <p className="text-sm text-white/80 font-medium line-clamp-3">
              <MathText text={question.questionText} />
            </p>
            {question.options.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-1">
                {question.options.map((opt, i) => (
                  <span key={i} className={`text-[10px] px-2 py-1 rounded-lg ${
                    i === question.correct ? 'bg-emerald-500/20 text-emerald-400 font-bold' :
                    i === question.studentAnswer ? 'bg-rose-500/20 text-rose-400 font-bold' :
                    'bg-white/5 text-white/40'
                  }`}>
                    {String.fromCharCode(65 + i)}. <MathText text={opt} />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'tutor' && (
                    <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0">
                      <Bot size={16} className="text-amber-500" />
                    </div>
                  )}
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-white rounded-br-sm'
                      : 'bg-white/80 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 rounded-bl-sm'
                  }`}>
                    <MathText text={msg.content} />
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                      <User size={16} className="text-blue-500" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-amber-500" />
                </div>
                <div className="bg-white/80 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 p-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-2 mb-3 shrink-0">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(prompt); }}
                  className="text-[10px] font-bold bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-full hover:bg-amber-500/20 transition-colors border border-amber-500/20"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Apna doubt poocho..."
              className="flex-1 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500/50 transition-colors"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white hover:bg-amber-600 transition-colors disabled:opacity-50 active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DoubtSamjhao;
