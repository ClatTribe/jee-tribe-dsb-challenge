import { GoogleGenAI, Type } from "@google/genai";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ExamType, getExamConfig, DEFAULT_EXAM } from './examConfig';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });
// console.log('API KEY:', import.meta.env.VITE_GEMINI_API_KEY);

export interface Question {
  id: string;
  subject: string;
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

/**
 * Safely parse JSON from Gemini, with multiple fallback strategies.
 * Strategy 1: Direct JSON.parse (structured output is usually valid JSON)
 * Strategy 2: Strip markdown code fences and retry
 * Strategy 3: Fix unescaped backslashes (LaTeX) and retry
 */
function safeParseGeminiJSON(raw: string): any {
  const text = (raw || '').trim();

  // Strategy 1: Direct parse — structured output should be valid JSON
  try {
    return JSON.parse(text);
  } catch (_e1) {
    // continue to fallbacks
  }

  // Strategy 2: Strip markdown code fences (```json ... ```)
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(stripped);
  } catch (_e2) {
    // continue
  }

  // Strategy 3: Aggressive repair — fix backslashes, control chars, and unescaped quotes.
  // State machine walks character-by-character through the raw JSON.
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
        // Inside a JSON string
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
            // Invalid escape (LaTeX like \theta, \vec) — double the backslash
            fixed += '\\\\';
            i++;
          }
        } else if (ch === '"') {
          // Could be closing quote OR unescaped quote inside LaTeX/text.
          // Heuristic: if next non-whitespace char is valid JSON after a string
          // (: , ] }), treat as closing quote. Otherwise escape it.
          const rest = stripped.substring(i + 1).trimStart();
          const nextStructural = rest[0];
          if (!nextStructural || ':,]}'.includes(nextStructural)) {
            fixed += ch;
            inString = false;
          } else {
            // Unescaped quote inside string value — escape it
            fixed += '\\"';
          }
          i++;
        } else if (code < 0x20) {
          // Raw control character inside string (newline, tab, etc.) — escape it
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
    console.error("All JSON parse strategies failed. Raw text (first 500 chars):", text.substring(0, 500));
    throw new Error("Failed to parse Gemini response as JSON: " + (e3 as Error).message);
  }
}

/**
 * Repair LaTeX in already-parsed question data that was stored with mangled backslashes.
 * Detects common patterns like tab+"heta" (from \theta), form-feed+"rac" (from \frac), etc.
 * and restores them to proper LaTeX commands.
 */
const MANGLED_LATEX: [RegExp, string][] = [
  [/\t(heta)/g, '\\theta'],
  [/\t(an)/g, '\\tan'],
  [/\t(imes)/g, '\\times'],
  [/\t(ext)/g, '\\text'],
  [/\t(o)/g, '\\to'],
  [/\f(rac)/g, '\\frac'],
  [/\n(eq)/g, '\\neq'],
  [/\n(ot)/g, '\\not'],
  [/\r(ight)/g, '\\right'],
  [/\b(egin)/g, '\\begin'],
  [/\b(ig)/g, '\\big'],
];

function repairMangledLatex(s: string): string {
  let result = s;
  for (const [pattern, replacement] of MANGLED_LATEX) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function repairQuestion(q: Question): Question {
  return {
    ...q,
    text: repairMangledLatex(q.text),
    options: q.options.map(o => repairMangledLatex(o)),
    explanation: repairMangledLatex(q.explanation),
  };
}

function repairQuestions<T extends Question>(questions: T[]): T[] {
  return questions.map(q => ({ ...repairQuestion(q), ...q, text: repairMangledLatex(q.text), options: q.options.map(o => repairMangledLatex(o)), explanation: repairMangledLatex(q.explanation) } as T));
}

const QUESTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    subject: { type: Type.STRING },
    text: { type: Type.STRING },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correct: { type: Type.INTEGER },
    explanation: { type: Type.STRING },
    difficulty: { type: Type.STRING, enum: ['Tough', 'Very Tough'] },
    topic: { type: Type.STRING },
    subtopic: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['id', 'subject', 'text', 'options', 'correct', 'explanation', 'difficulty'],
};

// Skip or Solve allows mixed difficulty — some easy traps, some tough solvable
const SKIP_SOLVE_QUESTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    subject: { type: Type.STRING },
    text: { type: Type.STRING },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correct: { type: Type.INTEGER },
    explanation: { type: Type.STRING },
    difficulty: { type: Type.STRING, enum: ['Medium', 'Tough', 'Very Tough'] },
    topic: { type: Type.STRING },
    subtopic: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    isTrap: { type: Type.BOOLEAN },
  },
  required: ['id', 'subject', 'text', 'options', 'correct', 'explanation', 'difficulty', 'isTrap'],
};


const LATEX_INSTRUCTIONS = `CRITICAL JSON + MATH FORMATTING RULES:
  - EVERY math expression MUST be wrapped in $...$ delimiters. No exceptions.
  - This includes: variables (like $v$, $m$, $F$), equations ($F = ma$), fractions ($\\frac{1}{2}mv^2$), Greek letters ($\\alpha$, $\\theta$), subscripts ($H_2O$, $v_0$), superscripts ($x^2$), and operators ($\\Rightarrow$, $\\times$).
  - WRONG: "velocity v = sqrt(2gL)" or "F = \\frac{1}{2}mv^2"
  - CORRECT: "velocity $v = \\sqrt{2gL}$" or "$F = \\frac{1}{2}mv^2$"
  - In explanations, wrap the ENTIRE math expression in ONE pair of $...$, not each symbol separately. Write $F = \\frac{1}{2}mv^2$ NOT $F$ = $\\frac{1}{2}$$mv^2$.
  - NEVER leave \\frac, \\sqrt, \\Rightarrow, \\times, \\alpha, or ANY LaTeX command outside of $ delimiters.
  - NEVER use double quotes inside math expressions. Use single quotes if needed.
  - All backslashes in LaTeX MUST be properly escaped for JSON (use \\\\theta not \\theta).
  - Keep question text clean and concise.

EXPLANATION FORMAT RULES:
  - Write the explanation as STEP-BY-STEP, with each step on a NEW LINE (use \\n between steps).
  - Each step should be one clear logical thought or calculation.
  - Example: "Step 1: Identify the given values.\\nWe have $m = 2$ kg and $v = 5$ m/s.\\nStep 2: Apply conservation of energy.\\n$\\frac{1}{2}mv^2 = mgh$\\nStep 3: Solve for $h$.\\n$h = \\frac{v^2}{2g} = \\frac{25}{20} = 1.25$ m"
  - DO NOT write the entire explanation as one long paragraph.`;

const MODEL = "gemini-2.5-flash";

// Retry wrapper — retries with different seed on parse failure
async function withRetry<T>(fn: (seed: number) => Promise<T>, baseSeed: number, maxRetries = 2): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn(baseSeed + (attempt * 100));
    } catch (e: any) {
      lastError = e;
      console.warn(`Attempt ${attempt + 1} failed: ${e.message}. ${attempt < maxRetries ? 'Retrying...' : 'No more retries.'}`);
    }
  }
  throw lastError;
}

// Generate Mini Mock questions (12 questions) — the critical path
async function generateMiniMock(dateStr: string, seed: number, exam: ExamType, cuetDomain?: string): Promise<Question[]> {
  const config = getExamConfig(exam);
  let basePrompt = config.miniMockPrompt;
  // If CUET with a specific domain, replace generic "Domain Subject" references
  if (exam === 'CUET' && cuetDomain) {
    basePrompt = basePrompt.replace(/Domain Subject/g, cuetDomain);
    basePrompt += `\n\nIMPORTANT: The Domain Subject for this student is "${cuetDomain}". All 4 domain questions MUST be from ${cuetDomain} specifically.`;
  }
  const prompt = `${basePrompt}
  ${LATEX_INSTRUCTIONS}
  Today's date is ${dateStr}. Generate unique questions.`;

  const response = await withTimeout(
    ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        seed: seed,
        maxOutputTokens: 65536,
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: { type: Type.ARRAY, items: QUESTION_SCHEMA },
          },
          required: ['questions'],
        },
      },
    }),
    120_000,
    'Mini Mock generation'
  );

  const data = safeParseGeminiJSON(response.text || "{}");
  return data.questions || [];
}

// Generate secondary mode questions (flashcards, sudden death, skip/solve, duels)
async function generateSecondaryQuestions(dateStr: string, seed: number, exam: ExamType, cuetDomain?: string): Promise<{
  flashcards: Question[];
  suddenDeath: Question[];
  skipOrSolve: (Question & { isTrap: boolean })[];
  duels: Question[];
}> {
  const config = getExamConfig(exam);
  let secondaryBase = config.secondaryPrompt;
  if (exam === 'CUET' && cuetDomain) {
    secondaryBase = secondaryBase.replace(/Domain Subject/g, cuetDomain);
    secondaryBase += `\nIMPORTANT: The Domain Subject is "${cuetDomain}". All domain questions must be from ${cuetDomain}.`;
  }
  const prompt = `${secondaryBase}
  ${config.difficultyInstructions}
  Exception: Skip or Solve can have Medium difficulty trap questions.
  ${LATEX_INSTRUCTIONS}
  Today's date is ${dateStr}. Generate unique questions.`;

  const response = await withTimeout(
    ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        seed: seed + 1,
        maxOutputTokens: 65536,
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flashcards: { type: Type.ARRAY, items: QUESTION_SCHEMA },
            suddenDeath: { type: Type.ARRAY, items: QUESTION_SCHEMA },
            skipOrSolve: { type: Type.ARRAY, items: SKIP_SOLVE_QUESTION_SCHEMA },
            duels: { type: Type.ARRAY, items: QUESTION_SCHEMA },
          },
          required: ['flashcards', 'suddenDeath', 'skipOrSolve', 'duels'],
        },
      },
    }),
    120_000,
    'Secondary questions generation'
  );

  const data = safeParseGeminiJSON(response.text || "{}");
  return {
    flashcards: data.flashcards || [],
    suddenDeath: data.suddenDeath || [],
    skipOrSolve: data.skipOrSolve || [],
    duels: data.duels || [],
  };
}

export const generateQuestionsForDate = async (dateStr: string, exam: ExamType = DEFAULT_EXAM, cuetDomain?: string): Promise<DailyQuestions> => {
  const seed = parseInt(dateStr.replace(/-/g, ''));

  // Run both calls in parallel with retry logic
  const [miniMock, secondary] = await Promise.all([
    withRetry((s) => generateMiniMock(dateStr, s, exam, cuetDomain), seed),
    withRetry((s) => generateSecondaryQuestions(dateStr, s, exam, cuetDomain), seed),
  ]);

  return {
    date: dateStr,
    miniMock,
    flashcards: secondary.flashcards,
    suddenDeath: secondary.suddenDeath,
    skipOrSolve: secondary.skipOrSolve,
    duels: secondary.duels,
  };
};

// Backward-compatible wrapper
export const generateDailyQuestions = async (exam: ExamType = DEFAULT_EXAM, cuetDomain?: string): Promise<DailyQuestions> => {
  const todayStr = new Date().toISOString().split('T')[0];
  return generateQuestionsForDate(todayStr, exam, cuetDomain);
};

// Map of exam-keyed generation promises to prevent parallel generation PER EXAM
const generationPromises: Record<string, Promise<DailyQuestions>> = {};

// Timeout wrapper — ensures we never hang forever waiting for Gemini
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    promise.then(
      val => { clearTimeout(timer); resolve(val); },
      err => { clearTimeout(timer); reject(err); }
    );
  });
}

// Helper: get tomorrow's date string
function getTomorrowStr(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// Pre-generate tomorrow's questions silently in the background.
// This runs after today's questions are served, so students never wait.
async function preGenerateTomorrow(exam: ExamType = DEFAULT_EXAM): Promise<void> {
  const tomorrowStr = getTomorrowStr();
  const docKey = `${tomorrowStr}-${exam}`;

  try {
    // Check if tomorrow's questions already exist in Firestore
    const docRef = doc(db, 'dailyQuestions', docKey);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log(`Tomorrow's questions (${docKey}) already exist. Skipping pre-generation.`);
      return;
    }

    console.log(`Pre-generating questions for tomorrow (${docKey})...`);
    const questions = await generateQuestionsForDate(tomorrowStr, exam);

    // Save to Firestore so they're instantly available at midnight
    await setDoc(docRef, questions);
    console.log(`Pre-generated and saved tomorrow's questions (${docKey}) to Firestore.`);
  } catch (error) {
    // Silently fail — this is a background optimization, not critical
    console.warn("Pre-generation for tomorrow failed (non-critical):", error);
  }
}

// Cache version — bump this to invalidate old localStorage entries
const DAILY_Q_CACHE_VERSION = 'v2';

export const getDailyQuestions = async (exam: ExamType = DEFAULT_EXAM, cuetDomain?: string): Promise<DailyQuestions> => {
  const today = new Date().toISOString().split('T')[0];
  // Include domain in key for CUET so different domains get different questions
  const domainSuffix = exam === 'CUET' && cuetDomain ? `-${cuetDomain.replace(/\s+/g, '')}` : '';
  const docKey = `${today}-${exam}${domainSuffix}`;
  const lsKey = `${DAILY_Q_CACHE_VERSION}_daily_questions_${exam}${domainSuffix}`;

  // Clean up old cache entries (pre-v2) on first run
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('daily_questions_') && !key.startsWith(DAILY_Q_CACHE_VERSION)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (_) {}

  // 1. Try Firestore first (Fastest, shared across all users)
  try {
    const docRef = doc(db, 'dailyQuestions', docKey);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as DailyQuestions;

      // Kick off tomorrow's pre-generation in the background (fire-and-forget)
      preGenerateTomorrow(exam).catch(() => {});

      return {
        date: today,
        miniMock: repairQuestions(data.miniMock || []),
        flashcards: repairQuestions(data.flashcards || []),
        suddenDeath: repairQuestions(data.suddenDeath || []),
        skipOrSolve: repairQuestions(data.skipOrSolve || []),
        duels: repairQuestions(data.duels || []),
      };
    }
  } catch (error) {
    console.error("Error fetching from Firestore:", error);
  }

  // 2. Try LocalStorage (Fallback for single user)
  const stored = localStorage.getItem(lsKey);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as DailyQuestions;
      if (parsed.date === today) {
        // Kick off tomorrow's pre-generation in the background
        preGenerateTomorrow(exam).catch(() => {});

        return {
          date: today,
          miniMock: repairQuestions(parsed.miniMock || []),
          flashcards: repairQuestions(parsed.flashcards || []),
          suddenDeath: repairQuestions(parsed.suddenDeath || []),
          skipOrSolve: repairQuestions(parsed.skipOrSolve || []),
          duels: repairQuestions(parsed.duels || []),
        };
      }
    } catch (e) {
      console.error("Error parsing local storage questions", e);
    }
  }

  // 3. Generate and Save (First user of the day)
  // Use a per-exam promise lock to prevent parallel generation
  const promiseKey = docKey; // exam-specific key so JEE/NEET/CUET don't share
  if (promiseKey in generationPromises) {
    try {
      return await withTimeout(generationPromises[promiseKey], 100_000, 'Pending generation wait');
    } catch (e) {
      console.warn("Pending generation failed or timed out, retrying fresh:", e);
      delete generationPromises[promiseKey];
    }
  }

  generationPromises[promiseKey] = (async () => {
    try {
      console.log(`Generating new questions for ${docKey}...`);
      const questions = await generateDailyQuestions(exam, cuetDomain);

      // Validate that we actually got questions
      if (!questions.miniMock || questions.miniMock.length === 0) {
        throw new Error("Generation returned empty miniMock");
      }

      // Save to Firestore for other users
      try {
        const docRef = doc(db, 'dailyQuestions', docKey);
        await setDoc(docRef, questions);
        console.log(`Saved daily questions to Firestore (${docKey})`);
      } catch (error) {
        console.error("Error saving to Firestore:", error);
      }

      // Save to LocalStorage for current user
      localStorage.setItem(lsKey, JSON.stringify(questions));

      // Pre-generate tomorrow's questions in the background
      preGenerateTomorrow(exam).catch(() => {});

      return questions;
    } catch (error) {
      console.error("Failed to generate daily questions:", error);
      throw error;
    } finally {
      delete generationPromises[promiseKey];
    }
  })();

  return await generationPromises[promiseKey];
};

export const extractQuestionFromImage = async (base64Data: string, mimeType: string) => {
  const model = MODEL;
  const prompt = `Extract the question from this image. Return a JSON object with:
  - subject: Identify the subject of the question (e.g., Physics, Chemistry, Mathematics, Biology, English, etc.)
  - questionType: "Single MCQ", "Multi MCQ", "Numerical", or "Fill in the Blanks"
  - difficulty: "Easy", "Medium", or "Hard"
  - topic: Broad category (e.g. Mechanics, Organic Chemistry)
  - subtopic: Specific concept (e.g. Projectile Motion, Aldehydes)
  - tags: Array of relevant keywords
  - questionText: The text of the question. ALL math expressions MUST be wrapped in $...$ delimiters (e.g., $x^2 + y^2 = r^2$). Never leave LaTeX commands like \\frac, \\sqrt outside $ delimiters.
  - options: Array of 4 options. ALL math MUST be in $...$ delimiters.
  - correctAnswers: The correct option index (0-3) or numerical value
  - explanation: Step-by-step solution. ALL math expressions MUST be wrapped in $...$ delimiters. Wrap entire equations in one pair: $F = \\frac{1}{2}mv^2$, not each symbol separately.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      { text: prompt },
      { inlineData: { data: base64Data, mimeType } }
    ],
    config: { responseMimeType: "application/json" }
  });

  return safeParseGeminiJSON(response.text || "{}");
};

export const extractMultipleQuestionsFromDocument = async (base64Data: string, mimeType: string) => {
  const model = MODEL;
  const prompt = `Extract all questions from this document. Return a JSON array of objects, each with:
  - subject: Identify the subject of the question (e.g., Physics, Chemistry, Mathematics, Biology, English, etc.)
  - questionType: "Single MCQ", "Multi MCQ", "Numerical", or "Fill in the Blanks"
  - difficulty: "Easy", "Medium", or "Hard"
  - topic: Broad category
  - subtopic: Specific concept
  - tags: Array of relevant keywords
  - questionText: The text of the question. ALL math expressions MUST be wrapped in $...$ delimiters (e.g., $x^2 + y^2 = r^2$). Never leave LaTeX commands like \\frac, \\sqrt outside $ delimiters.
  - options: Array of 4 options. ALL math MUST be in $...$ delimiters.
  - correctAnswers: The correct option index (0-3) or numerical value
  - explanation: Step-by-step solution. ALL math expressions MUST be wrapped in $...$ delimiters. Wrap entire equations in one pair: $F = \\frac{1}{2}mv^2$, not each symbol separately.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      { text: prompt },
      { inlineData: { data: base64Data, mimeType } }
    ],
    config: { responseMimeType: "application/json" }
  });

  return safeParseGeminiJSON(response.text || "[]");
};
