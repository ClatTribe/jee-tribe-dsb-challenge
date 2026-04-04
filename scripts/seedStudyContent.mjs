#!/usr/bin/env node
/**
 * Firestore Seeder — Pre-generates infographics + slides for every topic
 * across JEE, NEET and CUET, and writes them to the `studyContent` collection.
 *
 * Usage: node scripts/seedStudyContent.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// ── Firebase config (same as src/firebase.ts) ──
const firebaseConfig = {
  apiKey: "AIzaSyDtDqau4Oq9V2KdPyGyEnLX6nn_yUtsa-k",
  authDomain: "jee-dsb-challenge.firebaseapp.com",
  projectId: "jee-dsb-challenge",
  storageBucket: "jee-dsb-challenge.firebasestorage.app",
  messagingSenderId: "318620330667",
  appId: "1:318620330667:web:10b847cd116168a27825ee",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Gemini API ──
const GEMINI_API_KEY = "AIzaSyASihqx48z4Gl5fhUT9iS5zm0vx8XJpfM0";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(prompt, schema) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  };

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText.substring(0, 300)}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return JSON.parse(text);
}

// ── Topic map (from examConfig.ts) ──
const EXAM_TOPICS = {
  JEE: {
    Physics: ['Mechanics', 'Electrodynamics', 'Optics', 'Thermodynamics', 'Modern Physics', 'Waves'],
    Chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Coordination Compounds', 'Electrochemistry'],
    Mathematics: ['Calculus', 'Coordinate Geometry', 'Algebra', 'Probability', 'Vectors', 'Trigonometry'],
  },
  NEET: {
    Physics: ['Mechanics', 'Electrostatics', 'Current Electricity', 'Optics', 'Modern Physics', 'Thermodynamics'],
    Chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Chemical Bonding', 'Coordination Compounds'],
    Biology: ['Human Physiology', 'Plant Physiology', 'Genetics', 'Ecology', 'Cell Biology', 'Molecular Biology'],
  },
  CUET: {
    English: ['Reading Comprehension', 'Vocabulary', 'Grammar', 'Para Jumbles', 'Error Spotting'],
    'General Test': ['Quantitative Aptitude', 'Logical Reasoning', 'Data Interpretation', 'General Knowledge'],
    'Domain Subject': ['Indian History', 'Geography', 'Polity', 'Economics', 'Current Affairs'],
  },
};

// ── Schemas ──
const infographicSchema = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    sections: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          heading: { type: 'STRING' },
          points: { type: 'ARRAY', items: { type: 'STRING' } },
          keyFormula: { type: 'STRING' },
        },
        required: ['heading', 'points'],
      },
    },
  },
  required: ['title', 'sections'],
};

const slidesSchema = {
  type: 'OBJECT',
  properties: {
    slides: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          slideNumber: { type: 'INTEGER' },
          title: { type: 'STRING' },
          bulletPoints: { type: 'ARRAY', items: { type: 'STRING' } },
          speakerNotes: { type: 'STRING' },
        },
        required: ['slideNumber', 'title', 'bulletPoints', 'speakerNotes'],
      },
    },
  },
  required: ['slides'],
};

// ── Helpers ──
function docId(mode, exam, subject, topic) {
  return `${mode}_${exam}_${subject}_${topic}`.replace(/[\/\s]+/g, '_');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Main seeder ──
async function seed() {
  const modes = ['infographics', 'slides'];
  let total = 0;
  let created = 0;
  let skipped = 0;
  let failed = 0;

  // Count total tasks
  for (const exam of Object.keys(EXAM_TOPICS)) {
    for (const subject of Object.keys(EXAM_TOPICS[exam])) {
      total += EXAM_TOPICS[exam][subject].length * modes.length;
    }
  }

  console.log(`\n🚀 Seeding ${total} documents across JEE, NEET, CUET...\n`);

  for (const exam of Object.keys(EXAM_TOPICS)) {
    for (const subject of Object.keys(EXAM_TOPICS[exam])) {
      for (const topic of EXAM_TOPICS[exam][subject]) {
        for (const mode of modes) {
          const id = docId(mode, exam, subject, topic);
          const progress = `[${created + skipped + failed + 1}/${total}]`;

          // Check if already exists
          try {
            const existing = await getDoc(doc(db, 'studyContent', id));
            if (existing.exists()) {
              console.log(`${progress} ⏩ SKIP ${exam}/${subject}/${topic} (${mode}) — already exists`);
              skipped++;
              continue;
            }
          } catch (e) {
            // Continue to generate if check fails
          }

          console.log(`${progress} 🔄 Generating ${mode} for ${exam} > ${subject} > ${topic}...`);

          try {
            let data;
            if (mode === 'infographics') {
              const prompt = `Generate a comprehensive infographic-style summary for ${topic} (${subject}) for ${exam} exam preparation.
Return a JSON object with:
- title (string)
- sections (array of objects with: heading, points (array of strings), keyFormula (optional string))
Include 4-6 sections covering all key concepts. Use LaTeX for math expressions wrapped in $.`;

              data = await callGemini(prompt, infographicSchema);
            } else {
              const prompt = `Generate a presentation with 8-10 slides for ${topic} (${subject}) for ${exam} exam preparation.
Each slide has: slideNumber (starting from 1), title, bulletPoints (array of 3-5 strings), speakerNotes (1 line).
Cover the topic comprehensively. Use LaTeX for math expressions wrapped in $.
Return a JSON object with a 'slides' array.`;

              const raw = await callGemini(prompt, slidesSchema);
              data = raw.slides || [];
            }

            // Write to Firestore
            await setDoc(doc(db, 'studyContent', id), {
              content: data,
              mode,
              exam,
              subject,
              topic,
              createdAt: new Date().toISOString(),
            });

            console.log(`${progress} ✅ Saved ${exam}/${subject}/${topic} (${mode})`);
            created++;

            // Rate limit: wait 1.5s between Gemini calls
            await sleep(1500);
          } catch (err) {
            console.error(`${progress} ❌ FAILED ${exam}/${subject}/${topic} (${mode}):`, err.message);
            failed++;
            // Wait longer on error (likely rate limit)
            await sleep(3000);
          }
        }
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Created: ${created}`);
  console.log(`⏩ Skipped: ${skipped}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`📊 Total:   ${total}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
