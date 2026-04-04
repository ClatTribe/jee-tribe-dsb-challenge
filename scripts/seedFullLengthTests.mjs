#!/usr/bin/env node
/**
 * Full Length Test Seeder for CUET Domain Subjects
 * Generates 5 tests × 8 subjects = 40 tests, each with 50 MCQs
 * Uses Gemini API for question generation + Firebase Admin SDK for storage
 *
 * Usage: node scripts/seedFullLengthTests.mjs [subject] [testNumber]
 *   - No args: seeds ALL subjects and tests
 *   - subject: seed only that subject (e.g., "Physics")
 *   - subject + testNumber: seed only that specific test (e.g., "Physics" "1")
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const admin = require('firebase-admin');
const path = require('path');
const os = require('os');

// --- Firebase Admin Setup ---
const serviceAccountPath = path.join(os.homedir(), 'Downloads', 'jee-dsb-challenge-firebase-adminsdk-fbsvc-670c4d011f.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// --- Gemini API Setup ---
// Read from environment variable or .env.local
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || (() => {
  try {
    const fs = require('fs');
    const envPath = path.join(os.homedir(), 'Downloads', 'jee-tribe-dsb-challenge', '.env.local');
    const env = fs.readFileSync(envPath, 'utf8');
    const match = env.match(/GEMINI_API_KEY="?([^"\n]+)"?/);
    return match ? match[1] : '';
  } catch { return ''; }
})();

if (!GEMINI_API_KEY) {
  console.error('❌ No GEMINI_API_KEY found. Set it as environment variable or in .env.local');
  process.exit(1);
}
const GEMINI_MODEL = "gemini-2.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// --- Subject Configurations ---
const SUBJECTS = {
  Physics: {
    topics: [
      'Mechanics (Newton\'s Laws, Work-Energy, Rotational Motion)',
      'Electrostatics & Current Electricity',
      'Magnetism & Electromagnetic Induction',
      'Optics (Ray + Wave)',
      'Thermodynamics & Kinetic Theory',
      'Modern Physics (Atomic, Nuclear, Dual Nature)',
      'Waves & Oscillations',
      'Semiconductors & Electronic Devices',
    ],
  },
  Chemistry: {
    topics: [
      'Organic Chemistry: GOC, Isomerism, Named Reactions',
      'Organic Chemistry: Hydrocarbons, Polymers, Biomolecules',
      'Inorganic Chemistry: p-block & d-block Elements',
      'Inorganic Chemistry: Coordination Compounds, Metallurgy',
      'Physical Chemistry: Equilibrium, Ionic Equilibrium',
      'Physical Chemistry: Electrochemistry, Chemical Kinetics',
      'Physical Chemistry: Thermodynamics, Solutions',
      'Surface Chemistry, Solid State, Nuclear Chemistry',
    ],
  },
  Mathematics: {
    topics: [
      'Calculus: Differentiation & Integration',
      'Calculus: Definite Integrals, Differential Equations',
      'Algebra: Matrices, Determinants, Complex Numbers',
      'Algebra: Sequences & Series, Binomial Theorem',
      'Coordinate Geometry: Straight Lines, Circles, Conics',
      'Probability & Statistics',
      'Vectors & 3D Geometry',
      'Trigonometry & Relations & Functions',
    ],
  },
  Economics: {
    topics: [
      'Microeconomics: Demand, Supply, Market Equilibrium',
      'Microeconomics: Production, Cost, Revenue',
      'Microeconomics: Market Structures (Perfect Competition, Monopoly)',
      'Macroeconomics: National Income, Money & Banking',
      'Macroeconomics: Government Budget, Balance of Payments',
      'Indian Economy: Planning, Liberalisation, Current Issues',
      'Statistics: Measures of Central Tendency, Dispersion',
      'Development Economics: Poverty, Employment, Infrastructure',
    ],
  },
  'Business Studies': {
    topics: [
      'Nature & Significance of Management, Principles of Management',
      'Business Environment & Planning',
      'Organising, Staffing & Directing',
      'Controlling & Business Finance',
      'Financial Markets: Money Market, Capital Market',
      'Marketing Management: Product, Price, Place, Promotion',
      'Consumer Protection & Business Ethics',
      'Entrepreneurship & Small Business',
    ],
  },
  Accountancy: {
    topics: [
      'Partnership: Fundamentals, Goodwill, Admission',
      'Partnership: Retirement, Death, Dissolution',
      'Company Accounts: Share Capital, Debentures',
      'Financial Statements: Cash Flow, Ratio Analysis',
      'Analysis of Financial Statements',
      'Accounting for Not-for-Profit Organisations',
      'Computerised Accounting Systems',
      'Accounting Standards & Conceptual Framework',
    ],
  },
  'Political Science': {
    topics: [
      'Indian Constitution: Preamble, Fundamental Rights & Duties',
      'Indian Constitution: Federal Structure, Amendments',
      'Indian Government: Parliament, Executive, Judiciary',
      'State Government: Governor, CM, Legislature',
      'Local Self Government: Panchayats, Municipalities',
      'Political Parties & Electoral System in India',
      'International Relations: UN, India\'s Foreign Policy',
      'Contemporary World Politics: Cold War, Globalisation',
    ],
  },
  Psychology: {
    topics: [
      'Introduction to Psychology: Methods, Approaches',
      'Human Development: Cognitive, Social, Emotional',
      'Sensation, Attention & Perception',
      'Learning & Memory',
      'Thinking, Intelligence & Creativity',
      'Motivation & Emotion',
      'Personality: Theories & Assessment',
      'Psychological Disorders & Therapeutic Approaches',
    ],
  },
};

/**
 * Safely parse JSON from Gemini — fixes common LaTeX escape issues
 * Uses aggressive character-by-character string processing to handle
 * unescaped backslashes from LaTeX content in Gemini responses
 */
function safeParseJSON(text) {
  // First try direct parse
  try { return JSON.parse(text); } catch {}

  // Remove control characters except \n, \r, \t
  let cleaned = text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');

  // Strip markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '');

  try { return JSON.parse(cleaned); } catch {}

  // Character-by-character approach: walk through the string,
  // track whether we're inside a JSON string value, and escape
  // any unescaped backslashes inside strings
  let result = '';
  let inString = false;
  let i = 0;
  while (i < cleaned.length) {
    const ch = cleaned[i];

    if (ch === '"') {
      // Check if this quote is escaped
      let numBackslashes = 0;
      let j = result.length - 1;
      while (j >= 0 && result[j] === '\\') { numBackslashes++; j--; }

      if (numBackslashes % 2 === 0) {
        // Unescaped quote — toggles string state
        inString = !inString;
      }
      result += ch;
      i++;
    } else if (inString && ch === '\\') {
      // We're inside a JSON string and hit a backslash
      const next = cleaned[i + 1];

      // Valid JSON escape sequences: " \ / b f n r t u
      if (next && '"\\\/bfnrtu'.includes(next)) {
        // Valid JSON escape — keep as is
        result += ch + next;
        i += 2;
      } else if (next && /[a-zA-Z]/.test(next)) {
        // LaTeX command like \frac, \sqrt, \alpha etc — double-escape
        result += '\\\\';
        i++;
      } else if (next === '{' || next === '}' || next === '(' || next === ')' || next === '[' || next === ']' || next === ',' || next === ' ' || next === '^' || next === '_' || next === '!' || next === '|' || next === '.' || next === ';' || next === ':' || next === '\'' || next === '`' || next === '~' || next === '#' || next === '%' || next === '&' || next === '+' || next === '-' || next === '=' || next === '<' || next === '>') {
        // Escape sequences like \{, \}, \(, \) etc from LaTeX — double-escape
        result += '\\\\';
        i++;
      } else if (next === '\n' || next === undefined) {
        // Stray backslash at end of line or string — escape it
        result += '\\\\';
        i++;
      } else {
        // Unknown — double-escape to be safe
        result += '\\\\';
        i++;
      }
    } else if (inString && ch === '\n') {
      result += '\\n';
      i++;
    } else if (inString && ch === '\r') {
      result += '\\r';
      i++;
    } else if (inString && ch === '\t') {
      result += '\\t';
      i++;
    } else {
      result += ch;
      i++;
    }
  }

  try { return JSON.parse(result); } catch {}

  // Try to extract just the JSON array from the result
  const arrayStart = result.indexOf('[');
  const arrayEnd = result.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    try { return JSON.parse(result.substring(arrayStart, arrayEnd + 1)); } catch {}
  }

  // Try to extract JSON object
  const objStart = result.indexOf('{');
  const objEnd = result.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) {
    try { return JSON.parse(result.substring(objStart, objEnd + 1)); } catch {}
  }

  throw new Error('Failed to parse JSON after all fix attempts');
}

/**
 * Call Gemini API to generate questions
 */
async function callGemini(prompt, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 65536,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errText.substring(0, 200)}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty Gemini response');

      return safeParseJSON(text);
    } catch (err) {
      console.error(`  Attempt ${attempt + 1} failed: ${err.message}`);
      if (attempt === retries - 1) throw err;
      // Wait before retry
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
}

/**
 * Generate a batch of questions for a subject+topic combo
 */
async function generateBatch(subject, topics, batchNum, questionsNeeded) {
  // Pick a subset of topics for this batch
  const topicSubset = topics.slice(
    (batchNum * 2) % topics.length,
    ((batchNum * 2) % topics.length) + 3
  ).join(', ');

  const prompt = `Generate exactly ${questionsNeeded} CHALLENGING ${subject} MCQ questions for CUET UG exam.

TOPICS TO COVER: ${topicSubset}

REQUIREMENTS:
- Each question MUST have exactly 4 options with exactly 1 correct answer (index 0-3).
- Difficulty: Mix of "Tough" and "Very Tough". Questions should test deep conceptual understanding.
- EVERY math/science expression MUST be wrapped in $...$ delimiters. Example: $F = ma$, $\\frac{1}{2}mv^2$, $H_2O$. NEVER leave any LaTeX command like \\frac, \\sqrt, \\Rightarrow outside of $ delimiters. Wrap ENTIRE expressions in one pair of $...$, NOT each symbol separately.
- Write the explanation as STEP-BY-STEP with each step on a NEW LINE (use \\n between steps). Each step should be one clear logical thought.
- Keep question text clear and unambiguous.
- All backslashes in LaTeX MUST be escaped for JSON (use \\\\frac not \\frac).

Return a JSON array of objects with these fields:
- "id": unique string like "${subject.replace(/\s/g, '')}_batch${batchNum}_q1"
- "questionText": the question text with proper $...$ LaTeX delimiters
- "options": array of exactly 4 option strings with $...$ for any math
- "correctAnswer": integer 0-3 (index of correct option)
- "explanation": step-by-step solution with \\n between steps and $...$ for math
- "topic": broad topic name
- "subtopic": specific subtopic
- "difficulty": "Tough" or "Very Tough"

Return ONLY the JSON array, nothing else.`;

  const result = await callGemini(prompt);

  // Handle both array and object with questions key
  const questions = Array.isArray(result) ? result : (result.questions || []);

  // Validate and clean
  return questions.filter(q =>
    q.questionText && q.options?.length === 4 &&
    typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3
  ).map(q => ({
    id: q.id || `${subject}_b${batchNum}_q${Math.random().toString(36).slice(2, 8)}`,
    questionText: q.questionText,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation || '',
    topic: q.topic || subject,
    subtopic: q.subtopic || '',
    difficulty: q.difficulty || 'Tough',
  }));
}

/**
 * Seed one full-length test (50 questions) for a subject
 */
async function seedOneTest(subject, testNumber) {
  const subjectKey = subject.replace(/\s+/g, '');
  const docId = `FLT-${subjectKey}-${testNumber}`;

  console.log(`\n📝 Generating: ${subject} — Test ${testNumber} (${docId})`);

  // Check if already exists
  const existing = await db.collection('fullLengthTests').doc(docId).get();
  if (existing.exists && existing.data()?.questions?.length >= 45) {
    console.log(`  ✅ Already exists with ${existing.data().questions.length} questions. Skipping.`);
    return;
  }

  const topics = SUBJECTS[subject].topics;
  const allQuestions = [];

  // Generate in 5 batches of 10-12 questions each
  for (let batch = 0; batch < 5; batch++) {
    const needed = batch < 4 ? 10 : (50 - allQuestions.length);
    if (needed <= 0) break;

    console.log(`  Batch ${batch + 1}/5 — generating ${needed} questions...`);
    try {
      const questions = await generateBatch(subject, topics, batch + (testNumber * 5), Math.min(needed + 2, 13));
      allQuestions.push(...questions);
      console.log(`  Got ${questions.length} questions (total: ${allQuestions.length})`);
    } catch (err) {
      console.error(`  ❌ Batch ${batch + 1} failed: ${err.message}`);
    }

    // Rate limit pause between batches
    if (batch < 4) await new Promise(r => setTimeout(r, 2000));
  }

  // Trim to exactly 50
  const finalQuestions = allQuestions.slice(0, 50);

  if (finalQuestions.length < 40) {
    console.error(`  ❌ Only got ${finalQuestions.length} questions. Need at least 40. Skipping save.`);
    return;
  }

  // Save to Firestore
  const testDoc = {
    id: docId,
    subject,
    testNumber,
    title: `${subject} Full Length Test ${testNumber}`,
    questions: finalQuestions,
    questionCount: finalQuestions.length,
    duration: 60,
    difficulty: 'Tough to Very Tough',
    createdAt: new Date().toISOString(),
  };

  await db.collection('fullLengthTests').doc(docId).set(testDoc);
  console.log(`  ✅ Saved ${docId} with ${finalQuestions.length} questions to Firestore!`);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const targetSubject = args[0] || null;
  const targetTest = args[1] ? parseInt(args[1]) : null;

  console.log('🚀 Full Length Test Seeder for CUET');
  console.log('=====================================');

  const subjectsToSeed = targetSubject ? [targetSubject] : Object.keys(SUBJECTS);

  for (const subject of subjectsToSeed) {
    if (!SUBJECTS[subject]) {
      console.error(`❌ Unknown subject: ${subject}`);
      continue;
    }

    const testsToSeed = targetTest ? [targetTest] : [1, 2, 3, 4, 5];

    for (const testNum of testsToSeed) {
      await seedOneTest(subject, testNum);
      // Pause between tests to avoid rate limits
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log('\n🎉 Done! All tests seeded.');
}

main().catch(console.error);
