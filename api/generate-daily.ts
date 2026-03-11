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
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
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

async function generateQuestionsForDate(dateStr: string, apiKey: string) {
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-2.5-flash-preview-05-20";
  const seed = parseInt(dateStr.replace(/-/g, ''));

  const prompt = `Generate a set of highly challenging JEE Mains level questions for a competitive exam platform.
  The questions must be 'Tough' to 'Very Tough' - think JEE Mains top ranker level.

  CRITICAL: Use LaTeX for ALL mathematical, scientific, and chemical notations.
  - EVERY formula, variable, equation, or chemical symbol MUST be wrapped in delimiters.
  - Use $...$ for inline math (e.g., $x^2$, $H_2O$, $\\alpha$, $\\omega$, $\\mu$).
  - Use $$...$$ for complex formulas or equations that should be on their own line.
  - DO NOT return raw LaTeX like \\\\frac{1}{2} without $ delimiters.
  - DO NOT write Greek letters as words (e.g., use $\\omega$ instead of "omega").
  - IMPORTANT: ALL Greek letters MUST start with a backslash (e.g., $\\omega$, NOT $omega$).
  - Ensure the text is readable and professional.

  Requirements:
  1. Mini Mock: 12 questions (4 Physics, 4 Chemistry, 4 Mathematics).
  2. Flashcards: 5 questions (Mix of PCM). These MUST be TITA (Type In The Answer) style. The correct answer should be a single value or formula.
  3. Sudden Death: 5 questions (Mix of PCM).
  4. Skip or Solve: 5 questions (Mix of PCM). Identify 'Traps' vs 'Solvable'.
  5. Duels: 5 questions (Mix of PCM).

  Today's date is ${dateStr}. Generate unique questions for today.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      seed: seed,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          miniMock: { type: Type.ARRAY, items: QUESTION_SCHEMA },
          flashcards: { type: Type.ARRAY, items: QUESTION_SCHEMA },
          suddenDeath: { type: Type.ARRAY, items: QUESTION_SCHEMA },
          skipOrSolve: { type: Type.ARRAY, items: SKIP_SOLVE_SCHEMA },
          duels: { type: Type.ARRAY, items: QUESTION_SCHEMA },
        },
        required: ['miniMock', 'flashcards', 'suddenDeath', 'skipOrSolve', 'duels'],
      },
    },
  });

  const data = JSON.parse(response.text || "{}");
  return {
    date: dateStr,
    miniMock: data.miniMock || [],
    flashcards: data.flashcards || [],
    suddenDeath: data.suddenDeath || [],
    skipOrSolve: data.skipOrSolve || [],
    duels: data.duels || [],
  };
}

function getDateStr(offsetDays = 0): string {
  // Use IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
  ist.setDate(ist.getDate() + offsetDays);
  return ist.toISOString().split('T')[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Optional: Verify cron secret if set
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

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
