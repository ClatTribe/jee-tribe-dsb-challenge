import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// Firebase config (same as client)
const firebaseConfig = {
  apiKey: "AIzaSyDtDqau4Oq9V2KdPyGyEnLX6nn_yUtsa-k",
  authDomain: "jee-dsb-challenge.firebaseapp.com",
  projectId: "jee-dsb-challenge",
  storageBucket: "jee-dsb-challenge.firebasestorage.app",
  messagingSenderId: "318620330667",
  appId: "1:318620330667:web:10b847cd116168a27825ee",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const QUESTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    subject: { type: Type.STRING, enum: ['Physics', 'Chemistry', 'Mathematics'] },
    text: { type: Type.STRING },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correct: { type: Type.INTEGER },
    explanation: { type: Type.STRING },
    difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
    topic: { type: Type.STRING },
    subtopic: { type: Type.STRING },
  },
  required: ['id', 'subject', 'text', 'options', 'correct', 'explanation', 'difficulty'],
};

const SKIP_SOLVE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ...QUESTION_SCHEMA.properties,
    isTrap: { type: Type.BOOLEAN },
  },
  required: [...QUESTION_SCHEMA.required, 'isTrap'],
};

const LATEX_INSTRUCTIONS = `CRITICAL: Use LaTeX for ALL mathematical, scientific, and chemical notations.
- EVERY formula, variable, equation, or chemical symbol MUST be wrapped in delimiters.
- Use $...$ for inline math (e.g., $x^2$, $H_2O$, $\\alpha$, $\\omega$, $\\mu$).
- Use $$...$$ for complex formulas or equations that should be on their own line.
- DO NOT return raw LaTeX like \\\\frac{1}{2} without $ delimiters.
- DO NOT write Greek letters as words (e.g., use $\\omega$ instead of "omega").
- ALL Greek letters MUST start with a backslash (e.g., $\\omega$, NOT $omega$).
- Keep explanations concise (2-3 sentences max).`;

// Split generation into 3 smaller API calls to avoid JSON truncation
async function generateQuestionsForDate(dateStr: string, apiKey: string) {
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-2.5-flash-lite";
  const seed = parseInt(dateStr.replace(/-/g, ''));

  // --- Call 1: Mini Mock (12 questions) ---
  const miniMockResponse = await ai.models.generateContent({
    model,
    contents: `Generate 12 highly challenging JEE Mains level MCQ questions: 4 Physics, 4 Chemistry, 4 Mathematics.
${LATEX_INSTRUCTIONS}
Date seed: ${dateStr}. Each question needs 4 options.`,
    config: {
      seed: seed,
      maxOutputTokens: 16384,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: { type: Type.ARRAY, items: QUESTION_SCHEMA },
        },
        required: ['questions'],
      },
    },
  });
  const miniMockData = JSON.parse(miniMockResponse.text || '{"questions":[]}');

  // --- Call 2: Flashcards + Sudden Death (10 questions) ---
  const batch2Response = await ai.models.generateContent({
    model,
    contents: `Generate JEE Mains level questions for two categories:
1. "flashcards": 5 TITA (Type In The Answer) questions, mix of Physics/Chemistry/Mathematics. The correct answer should be a single number or short formula.
2. "suddenDeath": 5 MCQ questions, mix of PCM. Each needs 4 options.
${LATEX_INSTRUCTIONS}
Date seed: ${dateStr}.`,
    config: {
      seed: seed + 1,
      maxOutputTokens: 16384,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          flashcards: { type: Type.ARRAY, items: QUESTION_SCHEMA },
          suddenDeath: { type: Type.ARRAY, items: QUESTION_SCHEMA },
        },
        required: ['flashcards', 'suddenDeath'],
      },
    },
  });
  const batch2Data = JSON.parse(batch2Response.text || '{"flashcards":[],"suddenDeath":[]}');

  // --- Call 3: Skip or Solve + Duels (10 questions) ---
  const batch3Response = await ai.models.generateContent({
    model,
    contents: `Generate JEE Mains level questions for two categories:
1. "skipOrSolve": 5 MCQ questions, mix of PCM. Each needs 4 options. Mark each as isTrap=true (misleading/trap question) or isTrap=false (straightforward solvable).
2. "duels": 5 MCQ questions, mix of PCM. Each needs 4 options.
${LATEX_INSTRUCTIONS}
Date seed: ${dateStr}.`,
    config: {
      seed: seed + 2,
      maxOutputTokens: 16384,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          skipOrSolve: { type: Type.ARRAY, items: SKIP_SOLVE_SCHEMA },
          duels: { type: Type.ARRAY, items: QUESTION_SCHEMA },
        },
        required: ['skipOrSolve', 'duels'],
      },
    },
  });
  const batch3Data = JSON.parse(batch3Response.text || '{"skipOrSolve":[],"duels":[]}');

  return {
    date: dateStr,
    miniMock: miniMockData.questions || [],
    flashcards: batch2Data.flashcards || [],
    suddenDeath: batch2Data.suddenDeath || [],
    skipOrSolve: batch3Data.skipOrSolve || [],
    duels: batch3Data.duels || [],
  };
}

function getDateStr(offsetDays = 0): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
  ist.setDate(ist.getDate() + offsetDays);
  return ist.toISOString().split('T')[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  const results: string[] = [];

  try {
    // Generate for today (IST)
    const todayStr = getDateStr(0);
    const todayRef = doc(db, 'dailyQuestions', todayStr);
    const todaySnap = await getDoc(todayRef);

    if (todaySnap.exists()) {
      results.push(`Today (${todayStr}): Already exists, skipped.`);
    } else {
      console.log(`Generating questions for today: ${todayStr}`);
      const todayQuestions = await generateQuestionsForDate(todayStr, apiKey);
      await setDoc(todayRef, todayQuestions);
      results.push(`Today (${todayStr}): Generated and saved ${todayQuestions.miniMock.length} mini-mock + other modes.`);
    }

    // Also pre-generate for tomorrow
    const tomorrowStr = getDateStr(1);
    const tomorrowRef = doc(db, 'dailyQuestions', tomorrowStr);
    const tomorrowSnap = await getDoc(tomorrowRef);

    if (tomorrowSnap.exists()) {
      results.push(`Tomorrow (${tomorrowStr}): Already exists, skipped.`);
    } else {
      console.log(`Pre-generating questions for tomorrow: ${tomorrowStr}`);
      const tomorrowQuestions = await generateQuestionsForDate(tomorrowStr, apiKey);
      await setDoc(tomorrowRef, tomorrowQuestions);
      results.push(`Tomorrow (${tomorrowStr}): Generated and saved ${tomorrowQuestions.miniMock.length} mini-mock + other modes.`);
    }

    return res.status(200).json({ success: true, results });
  } catch (error: any) {
    console.error('Generation failed:', error);
    return res.status(500).json({ error: error.message || 'Generation failed', results });
  }
}
