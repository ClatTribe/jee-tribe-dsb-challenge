import { GoogleGenAI, Type } from "@google/genai";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Question {
  id: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  text: string;
  options: string[];
  correct: number;
  explanation: string;
  difficulty: 'Tough' | 'Very Tough';
}

export interface DailyQuestions {
  date: string;
  miniMock: Question[];
  flashcards: Question[];
  suddenDeath: Question[];
  skipOrSolve: (Question & { isTrap: boolean })[];
  duels: Question[];
}

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

export const generateQuestionsForDate = async (dateStr: string): Promise<DailyQuestions> => {
  const model = "gemini-3.1-pro-preview";
  const seed = parseInt(dateStr.replace(/-/g, ''));
  
  const prompt = `Generate a set of highly challenging JEE Mains level questions for a competitive exam platform. 
  The questions must be 'Tough' to 'Very Tough' - think JEE Mains top ranker level. 
  
  CRITICAL: Use LaTeX for ALL mathematical, scientific, and chemical notations.
  - EVERY formula, variable, equation, or chemical symbol MUST be wrapped in delimiters.
  - Use $...$ for inline math (e.g., $x^2$, $H_2O$, $\alpha$, $\omega$, $\mu$).
  - Use $$...$$ for complex formulas or equations that should be on their own line.
  - DO NOT return raw LaTeX like \\frac{1}{2} without $ delimiters.
  - DO NOT write Greek letters as words (e.g., use $\omega$ instead of "omega").
  - IMPORTANT: ALL Greek letters MUST start with a backslash (e.g., $\omega$, NOT $omega$).
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
};

// Backward-compatible wrapper
export const generateDailyQuestions = async (): Promise<DailyQuestions> => {
  const todayStr = new Date().toISOString().split('T')[0];
  return generateQuestionsForDate(todayStr);
};

let generationPromise: Promise<DailyQuestions> | null = null;

// Helper: get tomorrow's date string
function getTomorrowStr(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// Pre-generate tomorrow's questions silently in the background.
// This runs after today's questions are served, so students never wait.
async function preGenerateTomorrow(): Promise<void> {
  const tomorrowStr = getTomorrowStr();

  try {
    // Check if tomorrow's questions already exist in Firestore
    const docRef = doc(db, 'dailyQuestions', tomorrowStr);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log(`Tomorrow's questions (${tomorrowStr}) already exist. Skipping pre-generation.`);
      return;
    }

    console.log(`Pre-generating questions for tomorrow (${tomorrowStr})...`);
    const questions = await generateQuestionsForDate(tomorrowStr);

    // Save to Firestore so they're instantly available at midnight
    await setDoc(docRef, questions);
    console.log(`Pre-generated and saved tomorrow's questions (${tomorrowStr}) to Firestore.`);
  } catch (error) {
    // Silently fail — this is a background optimization, not critical
    console.warn("Pre-generation for tomorrow failed (non-critical):", error);
  }
}

export const getDailyQuestions = async (): Promise<DailyQuestions> => {
  const today = new Date().toISOString().split('T')[0];

  // 1. Try Firestore first (Fastest, shared across all users)
  try {
    const docRef = doc(db, 'dailyQuestions', today);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as DailyQuestions;

      // Kick off tomorrow's pre-generation in the background (fire-and-forget)
      preGenerateTomorrow().catch(() => {});

      return {
        date: today,
        miniMock: data.miniMock || [],
        flashcards: data.flashcards || [],
        suddenDeath: data.suddenDeath || [],
        skipOrSolve: data.skipOrSolve || [],
        duels: data.duels || [],
      };
    }
  } catch (error) {
    console.error("Error fetching from Firestore:", error);
  }

  // 2. Try LocalStorage (Fallback for single user)
  const stored = localStorage.getItem('daily_questions');
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as DailyQuestions;
      if (parsed.date === today) {
        // Kick off tomorrow's pre-generation in the background
        preGenerateTomorrow().catch(() => {});

        return {
          date: today,
          miniMock: parsed.miniMock || [],
          flashcards: parsed.flashcards || [],
          suddenDeath: parsed.suddenDeath || [],
          skipOrSolve: parsed.skipOrSolve || [],
          duels: parsed.duels || [],
        };
      }
    } catch (e) {
      console.error("Error parsing local storage questions", e);
    }
  }

  // 3. Generate and Save (First user of the day)
  // Use a promise lock to prevent parallel generation
  if (generationPromise) return generationPromise;

  generationPromise = (async () => {
    try {
      console.log("Generating new questions for today...");
      const questions = await generateDailyQuestions();

      // Save to Firestore for other users
      try {
        const docRef = doc(db, 'dailyQuestions', today);
        await setDoc(docRef, questions);
        console.log("Saved daily questions to Firestore");
      } catch (error) {
        console.error("Error saving to Firestore:", error);
      }

      // Save to LocalStorage for current user
      localStorage.setItem('daily_questions', JSON.stringify(questions));

      // Pre-generate tomorrow's questions in the background
      preGenerateTomorrow().catch(() => {});

      return questions;
    } catch (error) {
      console.error("Failed to generate daily questions:", error);
      return {
        date: today,
        miniMock: [],
        flashcards: [],
        suddenDeath: [],
        skipOrSolve: [],
        duels: [],
      };
    } finally {
      generationPromise = null;
    }
  })();

  return generationPromise;
};

export const extractQuestionFromImage = async (base64Data: string, mimeType: string) => {
  const model = "gemini-3.1-pro-preview";
  const prompt = `Extract the question from this image. Return a JSON object with:
  - subject: "Physics", "Chemistry", or "Mathematics"
  - questionType: "Single MCQ", "Multi MCQ", "Numerical", or "Fill in the Blanks"
  - difficulty: "Easy", "Medium", or "Hard"
  - topic: Broad category (e.g. Mechanics, Organic Chemistry)
  - subtopic: Specific concept (e.g. Projectile Motion, Aldehydes)
  - tags: Array of relevant keywords
  - questionText: The text of the question in LaTeX, wrapped in $ for inline and $$ for block math
  - options: Array of 4 options in LaTeX (if MCQ), wrapped in $ for inline and $$ for block math
  - correctAnswers: The correct option index (0-3) or numerical value
  - explanation: Step-by-step solution in LaTeX, wrapped in $ for inline and $$ for block math`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      { text: prompt },
      { inlineData: { data: base64Data, mimeType } }
    ],
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text || "{}");
};

export const extractMultipleQuestionsFromDocument = async (base64Data: string, mimeType: string) => {
  const model = "gemini-3.1-pro-preview";
  const prompt = `Extract all questions from this document. Return a JSON array of objects, each with:
  - subject: "Physics", "Chemistry", or "Mathematics"
  - questionType: "Single MCQ", "Multi MCQ", "Numerical", or "Fill in the Blanks"
  - difficulty: "Easy", "Medium", or "Hard"
  - topic: Broad category
  - subtopic: Specific concept
  - tags: Array of relevant keywords
  - questionText: The text of the question in LaTeX, wrapped in $ for inline and $$ for block math
  - options: Array of 4 options in LaTeX (if MCQ), wrapped in $ for inline and $$ for block math
  - correctAnswers: The correct option index (0-3) or numerical value
  - explanation: Step-by-step solution in LaTeX, wrapped in $ for inline and $$ for block math`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      { text: prompt },
      { inlineData: { data: base64Data, mimeType } }
    ],
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text || "[]");
};
