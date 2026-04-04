import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Question, QuestionType, Subject, Difficulty } from '../utils/evaluationUtils';
import { Plus, Search, Trash2, Filter, Database, ChevronRight, Save, X, Info, Edit2, Sparkles, Image as ImageIcon, Video, Link as LinkIcon, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MathText from '../components/MathRenderer';
import { extractQuestionFromImage, extractMultipleQuestionsFromDocument } from '../services/geminiService';

const QuestionManager = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkReview, setShowBulkReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState<string>('All');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'difficulty' | 'subject' | 'type' | 'none'>('none');
  const [searchTerm, setSearchTerm] = useState('');
  const [isScribing, setIsScribing] = useState(false);
  const [isScribingBulk, setIsScribingBulk] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const [bulkQuestions, setBulkQuestions] = useState<Partial<Question>[]>([]);
  const [bulkGlobalSettings, setBulkGlobalSettings] = useState({
    subject: 'Physics' as Subject,
    difficulty: 'Medium' as Difficulty,
    topic: '',
    subtopic: '',
    tags: [] as string[],
    marksCorrect: 4,
    marksWrong: 1
  });

  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    subject: 'Physics',
    questionType: 'Single MCQ',
    difficulty: 'Medium',
    questionText: '',
    imageUrl: '',
    youtubeUrl: '',
    options: ['', '', '', ''],
    correctAnswers: '',
    explanation: '',
    marksCorrect: 4,
    marksWrong: 1,
    topic: '',
    subtopic: '',
    tags: []
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'questionBank'));
    setQuestions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question)));
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'questionBank'), {
      ...newQuestion,
      createdAt: new Date()
    });
    setShowAddForm(false);
    fetchQuestions();
    setNewQuestion({
      subject: 'Physics',
      questionType: 'Single MCQ',
      difficulty: 'Medium',
      questionText: '',
      imageUrl: '',
      youtubeUrl: '',
      options: ['', '', '', ''],
      correctAnswers: '',
      explanation: '',
      marksCorrect: 4,
      marksWrong: 1,
      topic: '',
      subtopic: '',
      tags: []
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScribing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const mimeType = file.type;
        
        try {
          const extractedData = await extractQuestionFromImage(base64String, mimeType);
          
          setNewQuestion(prev => ({
            ...prev,
            subject: extractedData.subject as Subject || prev.subject,
            questionType: extractedData.questionType as QuestionType || prev.questionType,
            questionText: extractedData.questionText || prev.questionText,
            options: extractedData.options?.length ? extractedData.options : prev.options,
            correctAnswers: extractedData.correctAnswers || prev.correctAnswers,
            explanation: extractedData.explanation || prev.explanation,
            difficulty: extractedData.difficulty || prev.difficulty,
            topic: extractedData.topic || prev.topic,
            subtopic: extractedData.subtopic || prev.subtopic,
            tags: extractedData.tags || prev.tags,
          }));
        } catch (error) {
          console.error("AI Scribing failed:", error);
          alert("Failed to extract question from image. Please try again.");
        } finally {
          setIsScribing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File reading failed:", error);
      setIsScribing(false);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScribingBulk(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const mimeType = file.type;
        
        try {
          const extractedQuestions = await extractMultipleQuestionsFromDocument(base64String, mimeType);
          if (Array.isArray(extractedQuestions) && extractedQuestions.length > 0) {
            setBulkQuestions(extractedQuestions.map(q => ({
              ...q,
              subject: q.subject || bulkGlobalSettings.subject,
              difficulty: q.difficulty || bulkGlobalSettings.difficulty,
              topic: q.topic || bulkGlobalSettings.topic,
              subtopic: q.subtopic || bulkGlobalSettings.subtopic,
              marksCorrect: bulkGlobalSettings.marksCorrect,
              marksWrong: bulkGlobalSettings.marksWrong
            })));
            setShowBulkReview(true);
          } else {
            alert("No questions could be extracted from the document.");
          }
        } catch (error) {
          console.error("Bulk AI Scribing failed:", error);
          alert("Failed to extract questions. Please try again.");
        } finally {
          setIsScribingBulk(false);
          if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File reading failed:", error);
      setIsScribingBulk(false);
    }
  };

  const handleSaveBulk = async () => {
    try {
      const batch = writeBatch(db);
      const questionBankRef = collection(db, 'questionBank');
      
      bulkQuestions.forEach(q => {
        const newDocRef = doc(questionBankRef);
        batch.set(newDocRef, {
          ...q,
          subject: q.subject || bulkGlobalSettings.subject,
          difficulty: q.difficulty || bulkGlobalSettings.difficulty,
          topic: q.topic || bulkGlobalSettings.topic,
          subtopic: q.subtopic || bulkGlobalSettings.subtopic,
          marksCorrect: bulkGlobalSettings.marksCorrect,
          marksWrong: bulkGlobalSettings.marksWrong,
          createdAt: new Date()
        });
      });
      
      await batch.commit();
      setShowBulkReview(false);
      setBulkQuestions([]);
      fetchQuestions();
      alert(`Successfully added ${bulkQuestions.length} questions!`);
    } catch (error) {
      console.error("Failed to save bulk questions:", error);
      alert("Failed to save questions. Please try again.");
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSubject = filterSubject === 'All' || q.subject === filterSubject;
    const matchesDifficulty = filterDifficulty === 'All' || q.difficulty === filterDifficulty;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = q.questionText.toLowerCase().includes(searchLower) || 
                         (q.topic || '').toLowerCase().includes(searchLower) ||
                         (q.subtopic || '').toLowerCase().includes(searchLower) ||
                         (q.difficulty || '').toLowerCase().includes(searchLower) ||
                         (q.tags || []).some(tag => tag.toLowerCase().includes(searchLower));
                         
    return matchesSubject && matchesDifficulty && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'difficulty') {
      const weights = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
      return weights[a.difficulty] - weights[b.difficulty];
    }
    if (sortBy === 'subject') return a.subject.localeCompare(b.subject);
    if (sortBy === 'type') return a.questionType.localeCompare(b.questionType);
    return 0;
  });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tight text-slate-900">Question <span className="text-primary">Bank</span></h1>
          <p className="text-slate-500 font-medium">Manage and organize your JEE preparation content.</p>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="file" 
            accept="image/*,application/pdf" 
            className="hidden" 
            ref={bulkFileInputRef}
            onChange={handleBulkUpload}
          />
          <button 
            onClick={() => bulkFileInputRef.current?.click()}
            disabled={isScribingBulk}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-6 py-4 rounded-2xl font-black text-sm hover:bg-indigo-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {isScribingBulk ? (
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText size={20} />
            )}
            {isScribingBulk ? 'Extracting...' : 'Bulk Import (PDF/Image)'}
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-3 btn-liquid px-8 py-4 rounded-2xl font-black text-sm active:scale-95"
          >
            <Plus size={20} /> Add New Question
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Search questions or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-primary focus:bg-white outline-none transition-all font-medium"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          {['All', 'Physics', 'Chemistry', 'Mathematics'].map(s => (
            <button
              key={s}
              onClick={() => setFilterSubject(s)}
              className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 whitespace-nowrap ${
                filterSubject === s ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          {['All', 'Easy', 'Medium', 'Hard'].map(d => (
            <button
              key={d}
              onClick={() => setFilterDifficulty(d)}
              className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 whitespace-nowrap ${
                filterDifficulty === d ? 'bg-slate-800 border-slate-800 text-white shadow-lg shadow-slate-800/20' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Sort By:</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer pr-2"
          >
            <option value="none">None</option>
            <option value="difficulty">Difficulty</option>
            <option value="subject">Subject</option>
            <option value="type">Type</option>
          </select>
        </div>
      </div>

      {/* Question List */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-medium">Loading question bank...</div>
        ) : filteredQuestions.length > 0 ? (
          filteredQuestions.map((q, i) => (
            <motion.div 
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-primary/30 transition-all group"
            >
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
                      q.subject === 'Physics' ? 'bg-blue-50 text-blue-600' : 
                      q.subject === 'Chemistry' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {q.subject}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-50 text-slate-500 rounded-lg">
                      {q.questionType}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
                      q.difficulty === 'Easy' ? 'bg-success/10 text-success' : 
                      q.difficulty === 'Medium' ? 'bg-secondary/10 text-secondary' : 'bg-danger/10 text-danger'
                    }`}>
                      {q.difficulty}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Topic: <span className="text-slate-900"><MathText text={q.topic || 'Uncategorized'} /></span>
                      {q.subtopic && <span className="ml-1">/ <MathText text={q.subtopic} /></span>}
                    </span>
                    {q.tags && q.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {q.tags.map((tag, idx) => (
                          <span key={idx} className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-md border border-indigo-100">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-lg text-slate-800 leading-relaxed font-medium">
                    <MathText text={q.questionText} block />
                  </div>

                  {q.imageUrl && (
                    <div className="my-4">
                      <img src={q.imageUrl} alt="Question" className="max-h-64 rounded-xl border border-slate-200 object-contain" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  {q.options && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-medium text-slate-600">
                          <span className="w-6 h-6 bg-white rounded-md flex items-center justify-center font-black text-[10px] text-slate-400 border border-slate-100">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <MathText text={opt} />
                        </div>
                      ))}
                    </div>
                  )}

                  {q.youtubeUrl && (
                    <div className="mt-4 flex items-center gap-2">
                      <a href={q.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors">
                        <Video size={14} /> Watch Video Solution
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="flex md:flex-col justify-end gap-2">
                  <button className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-primary transition-all">
                    <Edit2 size={20} />
                  </button>
                  <button 
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this question? This action cannot be undone.")) {
                        await deleteDoc(doc(db, 'questionBank', q.id));
                        fetchQuestions();
                      }
                    }}
                    className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-danger/10 hover:text-danger transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <Database size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No questions found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Add Question Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-2xl font-display font-black text-slate-900">Add New <span className="text-primary">Question</span></h2>
                <div className="flex items-center gap-4">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScribing}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  >
                    {isScribing ? (
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    {isScribing ? 'Extracting...' : 'AI Scribe from Image'}
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleAdd} className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</label>
                    <select 
                      value={newQuestion.subject}
                      onChange={e => setNewQuestion({...newQuestion, subject: e.target.value as Subject})}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 font-bold focus:border-primary focus:bg-white outline-none transition-all"
                    >
                      <option>Physics</option>
                      <option>Chemistry</option>
                      <option>Mathematics</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type</label>
                    <select 
                      value={newQuestion.questionType}
                      onChange={e => setNewQuestion({...newQuestion, questionType: e.target.value as QuestionType})}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 font-bold focus:border-primary focus:bg-white outline-none transition-all"
                    >
                      <option>Single MCQ</option>
                      <option>Multi MCQ</option>
                      <option>Numerical</option>
                      <option>Fill in the Blanks</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Difficulty</label>
                    <select 
                      value={newQuestion.difficulty}
                      onChange={e => setNewQuestion({...newQuestion, difficulty: e.target.value as Difficulty})}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 font-bold focus:border-primary focus:bg-white outline-none transition-all"
                    >
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Topic</label>
                    <input 
                      type="text"
                      placeholder="e.g. Thermodynamics"
                      value={newQuestion.topic}
                      onChange={e => setNewQuestion({...newQuestion, topic: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 font-bold focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subtopic</label>
                    <input 
                      type="text"
                      placeholder="e.g. First Law"
                      value={newQuestion.subtopic}
                      onChange={e => setNewQuestion({...newQuestion, subtopic: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 font-bold focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tags (Comma separated)</label>
                  <input 
                    type="text"
                    placeholder="e.g. thermodynamics, heat, energy"
                    value={newQuestion.tags?.join(', ')}
                    onChange={e => setNewQuestion({...newQuestion, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 font-bold focus:border-primary focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Question Text (LaTeX)</label>
                  <textarea 
                    value={newQuestion.questionText}
                    onChange={e => setNewQuestion({...newQuestion, questionText: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 font-mono text-sm focus:border-primary focus:bg-white outline-none transition-all min-h-[120px]"
                    placeholder="Enter LaTeX here..."
                  />
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Live Preview</p>
                    <div className="text-lg text-slate-800">
                      <MathText text={newQuestion.questionText || '\\text{Question preview will appear here...}'} block />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <ImageIcon size={14} /> Image URL (Optional)
                    </label>
                    <input 
                      type="text"
                      placeholder="https://example.com/image.png"
                      value={newQuestion.imageUrl || ''}
                      onChange={e => setNewQuestion({...newQuestion, imageUrl: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 font-medium focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Video size={14} /> Video Solution URL (Optional)
                    </label>
                    <input 
                      type="text"
                      placeholder="https://youtube.com/watch?v=..."
                      value={newQuestion.youtubeUrl || ''}
                      onChange={e => setNewQuestion({...newQuestion, youtubeUrl: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 font-medium focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                {newQuestion.questionType === 'Single MCQ' || newQuestion.questionType === 'Multi MCQ' ? (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Options (LaTeX)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {newQuestion.options?.map((opt, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-black text-xs text-slate-400">{String.fromCharCode(65 + i)}</span>
                            <input 
                              type="text"
                              value={opt}
                              onChange={e => {
                                const opts = [...(newQuestion.options || [])];
                                opts[i] = e.target.value;
                                setNewQuestion({...newQuestion, options: opts});
                              }}
                              className="flex-1 bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-2 font-medium focus:border-primary focus:bg-white outline-none transition-all"
                              placeholder="Option LaTeX..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : newQuestion.questionType === 'Numerical' ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correct Value</label>
                    <input 
                      type="number"
                      step="any"
                      value={newQuestion.correctAnswers}
                      onChange={e => setNewQuestion({...newQuestion, correctAnswers: parseFloat(e.target.value)})}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 font-bold focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>
                ) : null}

                {newQuestion.questionType !== 'Numerical' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correct Answer(s)</label>
                    <input 
                      type="text"
                      placeholder={
                        newQuestion.questionType === 'Single MCQ' ? "e.g. 0 (for A)" : 
                        newQuestion.questionType === 'Multi MCQ' ? "e.g. 0,2 (for A,C)" : 
                        "Exact text for the blank"
                      }
                      value={newQuestion.correctAnswers}
                      onChange={e => setNewQuestion({...newQuestion, correctAnswers: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 font-bold focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Explanation / Solution (LaTeX)</label>
                  <textarea 
                    value={newQuestion.explanation || ''}
                    onChange={e => setNewQuestion({...newQuestion, explanation: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 font-mono text-sm focus:border-primary focus:bg-white outline-none transition-all min-h-[120px]"
                    placeholder="Enter step-by-step solution here..."
                  />
                </div>

                <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-8 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all uppercase text-xs tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex items-center gap-3 btn-liquid px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest"
                  >
                    <Save size={18} /> Save Question
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Review Modal */}
      <AnimatePresence>
        {showBulkReview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-display font-black text-slate-900">Review <span className="text-primary">Extracted Questions</span></h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">Found {bulkQuestions.length} questions. Review and apply global settings before saving.</p>
                </div>
                <button onClick={() => setShowBulkReview(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>
              
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Global Settings Sidebar */}
                <div className="w-full md:w-80 bg-slate-50 border-r border-slate-100 p-6 overflow-y-auto custom-scrollbar flex-shrink-0">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Global Settings</h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</label>
                      <select 
                        value={bulkGlobalSettings.subject}
                        onChange={e => {
                          const val = e.target.value as Subject;
                          setBulkGlobalSettings({...bulkGlobalSettings, subject: val});
                          setBulkQuestions(bulkQuestions.map(q => ({...q, subject: val})));
                        }}
                        className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-bold focus:border-primary outline-none transition-all"
                      >
                        <option>Physics</option>
                        <option>Chemistry</option>
                        <option>Mathematics</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Difficulty</label>
                      <select 
                        value={bulkGlobalSettings.difficulty}
                        onChange={e => {
                          const val = e.target.value as Difficulty;
                          setBulkGlobalSettings({...bulkGlobalSettings, difficulty: val});
                          setBulkQuestions(bulkQuestions.map(q => ({...q, difficulty: val})));
                        }}
                        className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-bold focus:border-primary outline-none transition-all"
                      >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Topic</label>
                      <input 
                        type="text"
                        value={bulkGlobalSettings.topic}
                        onChange={e => {
                          const val = e.target.value;
                          setBulkGlobalSettings({...bulkGlobalSettings, topic: val});
                          setBulkQuestions(bulkQuestions.map(q => ({...q, topic: val})));
                        }}
                        className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-bold focus:border-primary outline-none transition-all"
                        placeholder="e.g. Mechanics"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subtopic</label>
                      <input 
                        type="text"
                        value={bulkGlobalSettings.subtopic}
                        onChange={e => {
                          const val = e.target.value;
                          setBulkGlobalSettings({...bulkGlobalSettings, subtopic: val});
                          setBulkQuestions(bulkQuestions.map(q => ({...q, subtopic: val})));
                        }}
                        className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-bold focus:border-primary outline-none transition-all"
                        placeholder="e.g. Kinematics"
                      />
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white space-y-6">
                  {bulkQuestions.map((q, index) => (
                    <div key={index} className="border border-slate-200 rounded-2xl p-6 relative group">
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                          className="p-2 bg-indigo-50 text-indigo-500 rounded-xl hover:bg-indigo-100 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setBulkQuestions(bulkQuestions.filter((_, i) => i !== index))}
                          className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="flex gap-2 mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">Q{index + 1}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-primary/10 text-primary rounded-lg">{q.questionType}</span>
                      </div>

                      {editingIndex === index ? (
                        <div className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Question Text (LaTeX)</label>
                            <textarea 
                              value={q.questionText || ''}
                              onChange={e => {
                                const newQuestions = [...bulkQuestions];
                                newQuestions[index] = { ...q, questionText: e.target.value };
                                setBulkQuestions(newQuestions);
                              }}
                              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 font-mono text-sm focus:border-primary focus:bg-white outline-none transition-all min-h-[100px]"
                            />
                          </div>
                          
                          {q.options && q.options.length > 0 && (
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Options (LaTeX)</label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {q.options.map((opt, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <span className="font-bold text-slate-400 text-xs">{String.fromCharCode(65 + i)}</span>
                                    <input 
                                      type="text"
                                      value={opt}
                                      onChange={e => {
                                        const newQuestions = [...bulkQuestions];
                                        const newOptions = [...(q.options || [])];
                                        newOptions[i] = e.target.value;
                                        newQuestions[index] = { ...q, options: newOptions };
                                        setBulkQuestions(newQuestions);
                                      }}
                                      className="flex-1 bg-slate-50 border-2 border-slate-50 rounded-xl px-3 py-2 font-mono text-sm focus:border-primary focus:bg-white outline-none transition-all"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correct Answer</label>
                            <input 
                              type="text"
                              value={q.correctAnswers || ''}
                              onChange={e => {
                                const newQuestions = [...bulkQuestions];
                                newQuestions[index] = { ...q, correctAnswers: e.target.value };
                                setBulkQuestions(newQuestions);
                              }}
                              className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl px-4 py-2 font-bold focus:border-primary focus:bg-white outline-none transition-all"
                            />
                          </div>
                          
                          <button 
                            onClick={() => setEditingIndex(null)}
                            className="w-full py-3 btn-liquid rounded-xl font-bold text-sm"
                          >
                            Done Editing
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm text-slate-800 font-medium mb-4">
                            <MathText text={q.questionText || ''} block />
                          </div>

                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              {q.options.map((opt, i) => (
                                <div key={i} className="p-2 bg-slate-50 rounded-lg text-xs flex items-center gap-2">
                                  <span className="font-bold text-slate-400">{String.fromCharCode(65 + i)}</span>
                                  <MathText text={opt} />
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg inline-flex">
                            <CheckCircle2 size={14} /> Answer: <MathText text={q.correctAnswers || ''} />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-4">
                <button 
                  onClick={() => setShowBulkReview(false)}
                  className="px-8 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all uppercase text-xs tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveBulk}
                  className="flex items-center gap-3 btn-liquid px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest"
                >
                  <Save size={18} /> Save All {bulkQuestions.length} Questions
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuestionManager;
