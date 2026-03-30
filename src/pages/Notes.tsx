import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EXAM_CONFIGS, ExamType } from '../services/examConfig';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Image,
  Layers,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Brain,
  ArrowLeft,
  X,
} from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const MODEL = 'gemini-2.5-flash';

// Types
interface Flashcard {
  front: string;
  back: string;
}

interface InfographicSection {
  heading: string;
  points: string[];
  keyFormula?: string;
}

interface Infographic {
  title: string;
  sections: InfographicSection[];
}

interface Slide {
  slideNumber: number;
  title: string;
  bulletPoints: string[];
  speakerNotes: string;
}

type ContentMode = 'flashcards' | 'infographics' | 'slides';

const Notes: React.FC = () => {
  const { profile } = useAuth();
  const [activeMode, setActiveMode] = useState<ContentMode>('flashcards');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const selectedExam = profile?.exam as ExamType;
  const examConfig = selectedExam ? EXAM_CONFIGS[selectedExam] : null;

  // Initialize selected subject
  useEffect(() => {
    if (examConfig && !selectedSubject) {
      setSelectedSubject(examConfig.subjects[0]);
    }
  }, [selectedExam, examConfig, selectedSubject]);

  // Reset state when mode changes
  useEffect(() => {
    setSelectedTopic(null);
    setContent(null);
    setCurrentIndex(0);
    setIsFlipped(false);
    setError(null);
  }, [activeMode]);

  // Parse JSON from Gemini response
  const safeParseGeminiJSON = (raw: string): any => {
    const text = (raw || '').trim();

    try {
      return JSON.parse(text);
    } catch (_e1) {
      // Try stripping markdown fences
    }

    const stripped = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '');
    try {
      return JSON.parse(stripped);
    } catch (_e2) {
      // Try aggressive repair
    }

    try {
      let fixed = '';
      let inString = false;
      let i = 0;
      while (i < stripped.length) {
        const ch = stripped[i];
        const code = stripped.charCodeAt(i);

        if (!inString) {
          fixed += ch;
          if (ch === '"') inString = true;
          i++;
        } else {
          if (ch === '\\') {
            const next = stripped[i + 1];
            if (next === undefined) {
              fixed += '\\\\';
              i++;
            } else if (next === 'u') {
              const hex = stripped.substring(i + 2, i + 6);
              if (/^[0-9a-fA-F]{4}$/.test(hex)) {
                fixed += stripped.substring(i, i + 6);
                i += 6;
              } else {
                fixed += '\\\\';
                i++;
              }
            } else if ('"\\\/bfnrt'.includes(next)) {
              fixed += ch + next;
              i += 2;
            } else {
              fixed += '\\\\';
              i++;
            }
          } else if (ch === '"') {
            const rest = stripped.substring(i + 1).trimStart();
            const nextStructural = rest[0];
            if (!nextStructural || ':,]}'.includes(nextStructural)) {
              fixed += ch;
              inString = false;
            } else {
              fixed += '\\"';
            }
            i++;
          } else if (code < 0x20) {
            if (ch === '\n') fixed += '\\n';
            else if (ch === '\r') fixed += '\\r';
            else if (ch === '\t') fixed += '\\t';
            else fixed += '\\u' + code.toString(16).padStart(4, '0');
            i++;
          } else {
            fixed += ch;
            i++;
          }
        }
      }
      return JSON.parse(fixed);
    } catch (e3) {
      console.error(
        'All JSON parse strategies failed. Raw text (first 500 chars):',
        text.substring(0, 500)
      );
      throw new Error(
        'Failed to parse Gemini response as JSON: ' +
          ((e3 as Error).message || 'unknown error')
      );
    }
  };

  // Generate flashcards
  const generateFlashcards = async (topic: string, subject: string) => {
    setLoading(true);
    setError(null);

    const cacheKey = `notes-flashcards-${selectedExam}-${subject}-${topic}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setContent(JSON.parse(cached));
        setLoading(false);
        return;
      } catch (e) {
        console.warn('Failed to parse cached flashcards:', e);
      }
    }

    try {
      const prompt = `Generate 10 flashcards for ${topic} (${subject}) for ${selectedExam} preparation.
Each flashcard should have a 'front' (question/concept) and 'back' (answer/explanation).
Keep answers concise (2-3 lines).
Use LaTeX for math expressions wrapped in $.
Return a JSON object with a 'flashcards' array where each item has 'front' and 'back' fields.`;

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          maxOutputTokens: 8192,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    front: { type: Type.STRING },
                    back: { type: Type.STRING },
                  },
                  required: ['front', 'back'],
                },
              },
            },
            required: ['flashcards'],
          },
        },
      });

      const data = safeParseGeminiJSON(response.text || '{}');
      const flashcards = data.flashcards || [];

      localStorage.setItem(cacheKey, JSON.stringify(flashcards));
      setContent(flashcards);
    } catch (err) {
      setError(
        (err as Error).message ||
          'Failed to generate flashcards. Please try again.'
      );
      console.error('Flashcard generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate infographics
  const generateInfographics = async (topic: string, subject: string) => {
    setLoading(true);
    setError(null);

    const cacheKey = `notes-infographics-${selectedExam}-${subject}-${topic}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setContent(JSON.parse(cached));
        setLoading(false);
        return;
      } catch (e) {
        console.warn('Failed to parse cached infographic:', e);
      }
    }

    try {
      const prompt = `Generate a comprehensive infographic-style summary for ${topic} (${subject}) for ${selectedExam}.
Return a JSON object with:
- title (string)
- sections (array of objects with: heading, points (array of strings), keyFormula (optional string))
Include 4-6 sections covering all key concepts.`;

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          maxOutputTokens: 8192,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    heading: { type: Type.STRING },
                    points: { type: Type.ARRAY, items: { type: Type.STRING } },
                    keyFormula: { type: Type.STRING },
                  },
                  required: ['heading', 'points'],
                },
              },
            },
            required: ['title', 'sections'],
          },
        },
      });

      const data = safeParseGeminiJSON(response.text || '{}');

      localStorage.setItem(cacheKey, JSON.stringify(data));
      setContent(data);
    } catch (err) {
      setError(
        (err as Error).message ||
          'Failed to generate infographic. Please try again.'
      );
      console.error('Infographic generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate slides
  const generateSlides = async (topic: string, subject: string) => {
    setLoading(true);
    setError(null);

    const cacheKey = `notes-slides-${selectedExam}-${subject}-${topic}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setContent(JSON.parse(cached));
        setLoading(false);
        return;
      } catch (e) {
        console.warn('Failed to parse cached slides:', e);
      }
    }

    try {
      const prompt = `Generate a presentation with 8-10 slides for ${topic} (${subject}) for ${selectedExam}.
Each slide has: slideNumber (starting from 1), title, bulletPoints (array of 3-5 strings), speakerNotes (1 line).
Cover the topic comprehensively.
Return a JSON object with a 'slides' array.`;

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          maxOutputTokens: 8192,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    slideNumber: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    bulletPoints: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    speakerNotes: { type: Type.STRING },
                  },
                  required: ['slideNumber', 'title', 'bulletPoints', 'speakerNotes'],
                },
              },
            },
            required: ['slides'],
          },
        },
      });

      const data = safeParseGeminiJSON(response.text || '{}');
      const slides = data.slides || [];

      localStorage.setItem(cacheKey, JSON.stringify(slides));
      setContent(slides);
    } catch (err) {
      setError(
        (err as Error).message ||
          'Failed to generate slides. Please try again.'
      );
      console.error('Slides generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
    setCurrentIndex(0);
    setIsFlipped(false);

    switch (activeMode) {
      case 'flashcards':
        generateFlashcards(topic, selectedSubject);
        break;
      case 'infographics':
        generateInfographics(topic, selectedSubject);
        break;
      case 'slides':
        generateSlides(topic, selectedSubject);
        break;
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleNext = () => {
    if (content && currentIndex < content.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const topics = selectedSubject && examConfig ? examConfig.topicExamples[selectedSubject] || [] : [];

  // Color palette for infographic sections
  const sectionColors = [
    'from-amber-500 to-amber-600',
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-purple-500 to-purple-600',
    'from-rose-500 to-rose-600',
    'from-cyan-500 to-cyan-600',
  ];

  if (!examConfig) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-500 dark:text-slate-400">Select an exam to continue</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Brain className="w-7 h-7 text-amber-500" />
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Notes & Study Material</h1>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Master every concept with flashcards, infographics, and slides
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
          {[
            { id: 'flashcards', icon: BookOpen, label: 'Flashcards', desc: 'Quick revision cards' },
            { id: 'infographics', icon: Image, label: 'Infographics', desc: 'Visual summaries' },
            { id: 'slides', icon: Layers, label: 'Slides', desc: 'Topic presentations' },
          ].map((mode) => {
            const Icon = mode.icon;
            const isModeActive = activeMode === mode.id;
            return (
              <motion.button
                key={mode.id}
                onClick={() => setActiveMode(mode.id as ContentMode)}
                className={`p-4 md:p-6 rounded-xl border-2 transition-all ${
                  isModeActive
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-400 dark:border-amber-500 shadow-md shadow-amber-100 dark:shadow-amber-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className={`w-7 h-7 mx-auto mb-2 ${isModeActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <div className={`font-semibold text-sm ${isModeActive ? 'text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-white'}`}>{mode.label}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">{mode.desc}</div>
              </motion.button>
            );
          })}
        </div>

        {/* Subject Pills */}
        {!selectedTopic && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Select Subject</h2>
            <div className="flex flex-wrap gap-2">
              {(examConfig?.subjects || []).map((subject) => (
                <motion.button
                  key={subject}
                  onClick={() => {
                    setSelectedSubject(subject);
                    setCurrentIndex(0);
                  }}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                    selectedSubject === subject
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-200 dark:shadow-amber-500/30'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {subject}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Topic List or Content View */}
        <AnimatePresence mode="wait">
          {!selectedTopic ? (
            // Topic Selection
            <motion.div
              key="topics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {topics.map((topic) => (
                <motion.button
                  key={topic}
                  onClick={() => handleTopicClick(topic)}
                  className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-amber-400 dark:hover:border-amber-500 transition-all text-left hover:shadow-md"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{topic}</h3>
                    <ChevronRight className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                    Click to generate {activeMode}
                  </p>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            // Content View
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Back Button */}
              <button
                onClick={() => {
                  setSelectedTopic(null);
                  setContent(null);
                  setCurrentIndex(0);
                  setError(null);
                }}
                className="mb-6 flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Topics
              </button>

              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-12 h-12 border-4 border-slate-200 dark:border-slate-600 border-t-amber-500 rounded-full mb-4"
                  />
                  <p className="text-slate-500 dark:text-slate-300">
                    Generating {activeMode} for {selectedTopic}...
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-red-700 dark:text-red-200 mb-2">Error</h3>
                      <p className="text-red-600 dark:text-red-100 text-sm">{error}</p>
                    </div>
                    <button
                      onClick={() => {
                        setError(null);
                        handleTopicClick(selectedTopic);
                      }}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all whitespace-nowrap ml-4 text-sm font-medium"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {content && !loading && (
                <>
                  {activeMode === 'flashcards' && (
                    <div>
                      {/* Flashcard */}
                      <div className="mb-8">
                        <div
                          onClick={() => setIsFlipped(!isFlipped)}
                          className="relative h-80 md:h-96 cursor-pointer"
                          style={{ perspective: '1000px' }}
                        >
                          <motion.div
                            className="relative w-full h-full"
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            transition={{ duration: 0.6 }}
                            style={{ transformStyle: 'preserve-3d' }}
                          >
                            {/* Front */}
                            <div
                              className="absolute w-full h-full bg-white dark:bg-slate-800 rounded-2xl border-2 border-amber-300 dark:border-amber-500/50 p-8 flex flex-col justify-center items-center shadow-lg"
                              style={{ backfaceVisibility: 'hidden' }}
                            >
                              <p className="text-sm text-amber-600 dark:text-amber-400 mb-4 font-semibold">QUESTION</p>
                              <p className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white leading-relaxed text-center">
                                {content[currentIndex]?.front}
                              </p>
                              <p className="absolute bottom-4 right-4 text-xs text-slate-400">Click to flip</p>
                            </div>
                            {/* Back */}
                            <div
                              className="absolute w-full h-full bg-amber-50 dark:bg-amber-900/20 rounded-2xl border-2 border-amber-300 dark:border-amber-500/50 p-8 flex flex-col justify-center items-center shadow-lg"
                              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                            >
                              <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-4 font-semibold">ANSWER</p>
                              <p className="text-lg md:text-xl font-medium text-slate-800 dark:text-white leading-relaxed text-center">
                                {content[currentIndex]?.back}
                              </p>
                              <p className="absolute bottom-4 right-4 text-xs text-slate-400">Click to flip back</p>
                            </div>
                          </motion.div>
                        </div>
                      </div>

                      {/* Navigation */}
                      <div className="flex items-center justify-between mb-6">
                        <motion.button
                          onClick={handlePrevious}
                          disabled={currentIndex === 0}
                          className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                            currentIndex === 0
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200 dark:shadow-amber-500/20'
                          }`}
                          whileHover={currentIndex > 0 ? { scale: 1.05 } : {}}
                        >
                          Previous
                        </motion.button>

                        <div className="text-center">
                          <p className="text-lg font-bold text-slate-900 dark:text-white">
                            {currentIndex + 1} / {content.length}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{selectedTopic}</p>
                        </div>

                        <motion.button
                          onClick={handleNext}
                          disabled={currentIndex === content.length - 1}
                          className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                            currentIndex === content.length - 1
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200 dark:shadow-amber-500/20'
                          }`}
                          whileHover={currentIndex < content.length - 1 ? { scale: 1.05 } : {}}
                        >
                          Next
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {activeMode === 'infographics' && (
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-amber-600 dark:text-amber-400">
                        {content.title}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {content.sections?.map(
                          (section: InfographicSection, idx: number) => {
                            const colorClass =
                              sectionColors[idx % sectionColors.length];
                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`bg-gradient-to-br ${colorClass} rounded-xl p-6 shadow-lg`}
                              >
                                <h3 className="text-xl font-bold text-white mb-4">
                                  {section.heading}
                                </h3>
                                <ul className="space-y-2 mb-4">
                                  {section.points?.map((point, pidx) => (
                                    <li
                                      key={pidx}
                                      className="flex items-start gap-2 text-white/90"
                                    >
                                      <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0" />
                                      <span>{point}</span>
                                    </li>
                                  ))}
                                </ul>
                                {section.keyFormula && (
                                  <div className="bg-black/20 rounded-lg p-4 mt-4">
                                    <p className="text-xs text-white/70 mb-1">
                                      Key Formula
                                    </p>
                                    <p className="font-mono text-white font-bold">
                                      {section.keyFormula}
                                    </p>
                                  </div>
                                )}
                              </motion.div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                  {activeMode === 'slides' && (
                    <div>
                      {/* Slide */}
                      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 md:p-12 mb-8 min-h-80 md:min-h-96 flex flex-col justify-center shadow-lg">
                        <h2 className="text-2xl md:text-4xl font-bold text-amber-600 dark:text-amber-400 mb-6 md:mb-8">
                          {content[currentIndex]?.title}
                        </h2>
                        <ul className="space-y-3 md:space-y-4 text-base md:text-lg text-slate-700 dark:text-white/90 mb-6 md:mb-8">
                          {content[currentIndex]?.bulletPoints?.map(
                            (point: string, idx: number) => (
                              <motion.li
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-start gap-3"
                              >
                                <span className="text-amber-500 font-bold mt-1">•</span>
                                <span>{point}</span>
                              </motion.li>
                            )
                          )}
                        </ul>
                        {content[currentIndex]?.speakerNotes && (
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Speaker Notes</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{content[currentIndex]?.speakerNotes}</p>
                          </div>
                        )}
                      </div>

                      {/* Navigation */}
                      <div className="flex items-center justify-between mb-6">
                        <motion.button
                          onClick={handlePrevious}
                          disabled={currentIndex === 0}
                          className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                            currentIndex === 0
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
                          }`}
                          whileHover={currentIndex > 0 ? { scale: 1.05 } : {}}
                        >
                          Previous
                        </motion.button>

                        <div className="text-center">
                          <p className="text-lg font-bold text-slate-900 dark:text-white">
                            Slide {currentIndex + 1} / {content.length}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{selectedTopic}</p>
                        </div>

                        <motion.button
                          onClick={handleNext}
                          disabled={currentIndex === content.length - 1}
                          className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                            currentIndex === content.length - 1
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
                          }`}
                          whileHover={currentIndex < content.length - 1 ? { scale: 1.05 } : {}}
                        >
                          Next
                        </motion.button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Notes;
