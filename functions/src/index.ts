import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI, Type } from "@google/genai";

admin.initializeApp();
const db = admin.firestore();

// ─── Schema Definitions (mirrors your frontend geminiService.ts) ───

const QUESTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    subject: { type: Type.STRING, enum: ["Physics", "Chemistry", "Mathematics"] },
    text: { type: Type.STRING },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correct: { type: Type.INTEGER },
    explanation: { type: Type.STRING },
    difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
    topic: { type: Type.STRING },
    subtopic: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "id", "subject", "text", "options", "correct", "explanation", "difficulty",
  ],
};

const SKIP_SOLVE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ...QUESTION_SCHEMA.properties,
    isTrap: { type: Type.BOOLEAN },
  },
  required: [...QUESTION_SCHEMA.required, "isTrap"],
};

// ─── Question Generation Logic ───

async function generateAndSave(): Promise<string> {
  // Get the Gemini API key from Firebase environment config
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Run: firebase functions:secrets:set GEMINI_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Use IST (UTC+5:30) to determine "today" so questions flip at midnight India time
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST = UTC + 5:30
  const istDate = new Date(now.getTime() + istOffset);
  const todayStr = istDate.toISOString().split("T")[0];

  // Check if already generated for today
  const existing = await db.collection("dailyQuestions").doc(todayStr).get();
  if (existing.exists) {
    return `Questions already exist for ${todayStr}. Skipping.`;
  }

  const seed = parseInt(todayStr.replace(/-/g, ""));

  const prompt = `Generate a set of highly challenging JEE Mains level questions for a competitive exam platform.
  The questions must be 'Tough' to 'Very Tough' - think JEE Mains top ranker level.

  CRITICAL: Use LaTeX for ALL mathematical, scientific, and chemical notations.
  - EVERY formula, variable, equation, or chemical symbol MUST be wrapped in delimiters.
  - Use $...$ for inline math (e.g., $x^2$, $H_2O$, $\\alpha$, $\\omega$, $\\mu$).
  - Use $$...$$ for complex formulas or equations that should be on their own line.
  - DO NOT return raw LaTeX like \\frac{1}{2} without $ delimiters.
  - DO NOT write Greek letters as words (e.g., use $\\omega$ instead of "omega").
  - IMPORTANT: ALL Greek letters MUST start with a backslash (e.g., $\\omega$, NOT $omega$).
  - Ensure the text is readable and professional.

  Requirements:
  1. Mini Mock: 12 questions (4 Physics, 4 Chemistry, 4 Mathematics).
  2. Flashcards: 5 questions (Mix of PCM). These MUST be TITA (Type In The Answer) style.
  3. Sudden Death: 5 questions (Mix of PCM).
  4. Skip or Solve: 5 questions (Mix of PCM). Identify 'Traps' vs 'Solvable'.
  5. Duels: 5 questions (Mix of PCM).

  Today's date is ${todayStr}. Generate unique questions for today.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      seed,
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
        required: ["miniMock", "flashcards", "suddenDeath", "skipOrSolve", "duels"],
      },
    },
  });

  const data = JSON.parse(response.text || "{}");

  const dailyQuestions = {
    date: todayStr,
    miniMock: data.miniMock || [],
    flashcards: data.flashcards || [],
    suddenDeath: data.suddenDeath || [],
    skipOrSolve: data.skipOrSolve || [],
    duels: data.duels || [],
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection("dailyQuestions").doc(todayStr).set(dailyQuestions);

  const totalQ =
    dailyQuestions.miniMock.length +
    dailyQuestions.flashcards.length +
    dailyQuestions.suddenDeath.length +
    dailyQuestions.skipOrSolve.length +
    dailyQuestions.duels.length;

  return `Generated ${totalQ} questions for ${todayStr} and saved to Firestore.`;
}

// ─── Scheduled Function: Runs at 12:01 AM IST every day ───

export const generateDailyQuestionsScheduled = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "512MB",
    secrets: ["GEMINI_API_KEY"],
  })
  .pubsub.schedule("1 0 * * *")      // 12:01 AM
  .timeZone("Asia/Kolkata")           // IST
  .onRun(async () => {
    try {
      const result = await generateAndSave();
      functions.logger.info(result);
    } catch (error) {
      functions.logger.error("Failed to generate daily questions:", error);
      throw error; // Re-throw so Cloud Functions marks it as failed
    }
  });

// ─── HTTP Trigger: Manual fallback to generate questions on-demand ───

export const generateDailyQuestionsHttp = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "512MB",
    secrets: ["GEMINI_API_KEY"],
  })
  .https.onRequest(async (req, res) => {
    try {
      const result = await generateAndSave();
      res.status(200).json({ success: true, message: result });
    } catch (error: any) {
      functions.logger.error("HTTP trigger failed:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
