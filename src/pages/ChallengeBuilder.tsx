import React, { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Question, QuestionType, Subject, Difficulty } from '../utils/evaluationUtils';
import { Trophy, Calendar, Plus, Trash2, Save, Search, Filter, ChevronRight, Clock, Target, Zap, X, Info, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MathText from '../components/MathRenderer';

const ChallengeBuilder = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [challengeDate, setChallengeDate] = useState(new Date().toISOString().split('T')[0]);
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeType, setChallengeType] = useState('Daily Challenge');
  const [duration, setDuration] = useState(60);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  const [markingScheme, setMarkingScheme] = useState<Record<string, { positive: number; negative: number }>>({});
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Quick Add Form State
  const [newQ, setNewQ] = useState({
    subject: 'Physics' as Subject,
    type: 'Single MCQ' as QuestionType,
    difficulty: 'Medium' as Difficulty,
    text: '',
    options: ['', '', '', ''],
    correct: [] as string[],
    topic: '',
    subtopic: ''
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    const querySnapshot = await getDocs(collection(db, 'questionBank'));
    setQuestions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question)));
  };

  const handleSelect = (qId: string) => {
    setSelectedIds(prev => {
      const isSelected = prev.includes(qId);
      if (isSelected) {
        const { [qId]: _, ...rest } = markingScheme;
        setMarkingScheme(rest);
        return prev.filter(id => id !== qId);
      } else {
        const q = questions.find(q => q.id === qId);
        setMarkingScheme(prevScheme => ({
          ...prevScheme,
          [qId]: { positive: q?.marksCorrect || 4, negative: q?.marksWrong || 1 }
        }));
        return [...prev, qId];
      }
    });
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const questionData = {
      subject: newQ.subject,
      questionType: newQ.type,
      difficulty: newQ.difficulty,
      questionText: newQ.text,
      options: newQ.options,
      correctAnswers: newQ.type === 'Numerical' ? [parseFloat(newQ.correct[0])] : newQ.correct,
      topic: newQ.topic,
      subtopic: newQ.subtopic,
      marksCorrect: 4,
      marksWrong: 1,
      createdAt: new Date()
    };
    const docRef = await addDoc(collection(db, 'questionBank'), questionData);
    const addedQ = { id: docRef.id, ...questionData } as Question;
    setQuestions(prev => [addedQ, ...prev]);
    handleSelect(docRef.id);
    setShowQuickAdd(false);
    setNewQ({ subject: 'Physics', type: 'Single MCQ', difficulty: 'Medium', text: '', options: ['', '', '', ''], correct: [], topic: '', subtopic: '' });
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) return alert('Select at least one question');
    
    const challenge = {
      title: challengeTitle || `Challenge for ${challengeDate}`,
      type: challengeType,
      date: challengeDate,
      questionIds: selectedIds,
      markingScheme,
      duration,
      totalMarks: selectedIds.reduce((sum, id) => sum + (markingScheme[id]?.positive || 0), 0),
      createdAt: new Date()
    };

    await setDoc(doc(db, 'dailyChallenges', challengeDate), challenge);
    alert('Daily Challenge Published!');
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSubject = filterSubject === 'All' || q.subject === filterSubject;
    const matchesSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (q.topic || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tight text-slate-900">Challenge <span className="text-secondary">Architect</span></h1>
          <p className="text-slate-500 font-medium">Design and schedule high-impact preparation challenges.</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-3 bg-secondary text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-orange-600 transition-all shadow-xl shadow-secondary/20 active:scale-95"
        >
          <Save size={20} /> Publish Challenge
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Sidebar */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xl font-display font-black text-slate-900 flex items-center gap-3">
              <Zap size={24} className="text-secondary" /> Configuration
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Challenge Type</label>
                <select 
                  value={challengeType}
                  onChange={e => setChallengeType(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 font-bold focus:border-secondary focus:bg-white outline-none transition-all"
                >
                  <option>Daily Challenge</option>
                  <option>Weekly Mock</option>
                  <option>Subject Sprint</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Schedule Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="date"
                    value={challengeDate}
                    onChange={e => setChallengeDate(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold focus:border-secondary focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duration (Minutes)</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="number"
                    value={duration}
                    onChange={e => setDuration(parseInt(e.target.value))}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold focus:border-secondary focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-dark-bg p-8 rounded-[2.5rem] text-white shadow-2xl">
            <h3 className="text-xl font-display font-black mb-6 flex items-center gap-3">
              <Target size={24} className="text-secondary" /> Selected ({selectedIds.length})
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {selectedIds.map((id, i) => {
                const q = questions.find(q => q.id === id);
                return (
                  <div key={id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-500">#{i + 1}</span>
                      <div className="text-xs font-bold truncate max-w-[120px]">
                        <MathText text={q?.questionText.substring(0, 30) + '...'} />
                      </div>
                    </div>
                    <button 
                      onClick={() => handleSelect(id)}
                      className="p-2 text-slate-500 hover:text-danger transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
              {selectedIds.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm font-medium">
                  No questions selected yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Question Selector */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text"
                placeholder="Search question bank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:border-secondary outline-none transition-all font-medium shadow-sm"
              />
            </div>
            <button 
              onClick={() => setShowQuickAdd(true)}
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
            >
              <Plus size={18} /> Quick Add
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {['All', 'Physics', 'Chemistry', 'Mathematics'].map(s => (
              <button
                key={s}
                onClick={() => setFilterSubject(s)}
                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border-2 whitespace-nowrap ${
                  filterSubject === s ? 'bg-secondary border-secondary text-white shadow-lg shadow-secondary/20' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {showQuickAdd && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-secondary/5 p-8 rounded-[2.5rem] border-2 border-secondary/20 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-display font-black text-secondary">Quick LaTeX Add</h3>
                <button onClick={() => setShowQuickAdd(false)} className="p-2 hover:bg-secondary/10 rounded-full transition-colors">
                  <X size={20} className="text-secondary" />
                </button>
              </div>
              <form onSubmit={handleQuickAdd} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select 
                    value={newQ.subject}
                    onChange={e => setNewQ({...newQ, subject: e.target.value as Subject})}
                    className="bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-secondary"
                  >
                    <option>Physics</option><option>Chemistry</option><option>Mathematics</option>
                  </select>
                  <select 
                    value={newQ.type}
                    onChange={e => setNewQ({...newQ, type: e.target.value as QuestionType})}
                    className="bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-secondary"
                  >
                    <option>Single MCQ</option><option>Multi MCQ</option><option>Numerical</option>
                  </select>
                  <input 
                    type="text"
                    placeholder="Topic"
                    value={newQ.topic}
                    onChange={e => setNewQ({...newQ, topic: e.target.value})}
                    className="bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-secondary"
                  />
                </div>
                <textarea 
                  placeholder="Question LaTeX..."
                  value={newQ.text}
                  onChange={e => setNewQ({...newQ, text: e.target.value})}
                  className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 outline-none focus:border-secondary min-h-[100px] font-mono text-sm"
                  required
                />
                <div className="p-4 bg-white/50 rounded-xl border border-secondary/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-secondary/60 mb-2">Live Render</p>
                  <MathText text={newQ.text || '\\text{Preview...}'} block />
                </div>
                <button type="submit" className="w-full bg-secondary text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-secondary/20 hover:bg-orange-600 transition-all">
                  Add to Bank & Select
                </button>
              </form>
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-4 max-h-[700px] overflow-y-auto custom-scrollbar pr-2">
            {filteredQuestions.map((q) => {
              const isSelected = selectedIds.includes(q.id);
              return (
                <motion.div 
                  key={q.id}
                  onClick={() => handleSelect(q.id)}
                  className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-start justify-between group ${
                    isSelected ? 'bg-secondary/5 border-secondary shadow-lg shadow-secondary/5' : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                        q.subject === 'Physics' ? 'bg-blue-50 text-blue-600' : 
                        q.subject === 'Chemistry' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {q.subject}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-slate-50 text-slate-400 rounded-md border border-slate-100">{q.questionType}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Topic: <span className="text-slate-900">{q.topic || 'Uncategorized'}</span></span>
                    </div>
                    <div className="text-slate-800 font-medium mb-4">
                      <MathText text={q.questionText} />
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isSelected ? 'bg-secondary text-white shadow-lg' : 'bg-slate-50 text-slate-200 group-hover:text-slate-300'
                  }`}>
                    <Check size={20} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeBuilder;
