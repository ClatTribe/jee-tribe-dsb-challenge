#!/usr/bin/env node
/**
 * LearnFlix Video Seeder
 * Pre-fetches YouTube videos for all exam topics and stores them in Firestore
 * so all users get the same curated set instantly.
 *
 * Usage: node scripts/seedLearnflixVideos.mjs [exam] [subject]
 *   - No args: seeds ALL exams (JEE, NEET, CUET) and all subjects
 *   - exam: seed only that exam (e.g., "CUET")
 *   - exam + subject: seed only that subject (e.g., "CUET" "Economics")
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

const COLLECTION = 'learnflixVideos';

// --- YouTube Search (same logic as api/youtube-search.ts) ---
async function searchYouTube(query) {
  const url = "https://www.youtube.com/youtubei/v1/search";
  const body = {
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20240101.00.00",
        hl: "en",
        gl: "IN",
      },
    },
    query,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`YouTube API returned ${response.status}`);
  }

  const data = await response.json();
  const videos = [];

  try {
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!contents) return [];

    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents;
      if (!items) continue;

      for (const item of items) {
        const renderer = item?.videoRenderer;
        if (!renderer) continue;

        const videoId = renderer.videoId;
        const title = renderer.title?.runs?.map(r => r.text).join("") || "";
        const channelName = renderer.ownerText?.runs?.[0]?.text || renderer.longBylineText?.runs?.[0]?.text || "Unknown Channel";

        if (videoId && title) {
          videos.push({ title, channelName, videoId });
        }
        if (videos.length >= 10) break;
      }
      if (videos.length >= 10) break;
    }
  } catch (e) {
    console.error("Error parsing YouTube response:", e);
  }

  return videos;
}

// --- Topic Definitions (mirrors youtubeService.ts) ---
const ALL_TOPICS = {
  JEE: [
    { subject: "Physics", chapters: [
      { name: "Laws of Motion", subject: "Mechanics" },
      { name: "Work, Energy & Power", subject: "Mechanics" },
      { name: "Projectile Motion", subject: "Mechanics" },
      { name: "Circular Motion", subject: "Mechanics" },
      { name: "Rotational Motion", subject: "Mechanics" },
      { name: "Simple Harmonic Motion", subject: "Waves" },
      { name: "Waves & Oscillations", subject: "Waves" },
      { name: "Doppler Effect", subject: "Waves" },
      { name: "Heat & Thermodynamics", subject: "Thermodynamics" },
      { name: "Laws of Thermodynamics", subject: "Thermodynamics" },
      { name: "Kinetic Theory of Gases", subject: "Thermodynamics" },
      { name: "Electric Field", subject: "Electrodynamics" },
      { name: "Electric Potential", subject: "Electrodynamics" },
      { name: "Capacitance", subject: "Electrodynamics" },
      { name: "Current & Resistance", subject: "Electrodynamics" },
      { name: "Magnetic Field", subject: "Magnetism" },
      { name: "Electromagnetic Induction", subject: "Magnetism" },
      { name: "Alternating Current", subject: "Magnetism" },
      { name: "Reflection of Light", subject: "Optics" },
      { name: "Refraction of Light", subject: "Optics" },
      { name: "Lenses & Optical Instruments", subject: "Optics" },
      { name: "Wave Optics", subject: "Optics" },
      { name: "Photoelectric Effect", subject: "Modern Physics" },
      { name: "Atomic Structure", subject: "Modern Physics" },
      { name: "Nuclear Physics", subject: "Modern Physics" },
    ]},
    { subject: "Chemistry", chapters: [
      { name: "Atomic Structure & Bonding", subject: "Inorganic Chemistry" },
      { name: "Periodic Table", subject: "Inorganic Chemistry" },
      { name: "Hydrogen & Its Compounds", subject: "Inorganic Chemistry" },
      { name: "Alkali & Alkaline Earth Metals", subject: "Inorganic Chemistry" },
      { name: "Transition Elements", subject: "Inorganic Chemistry" },
      { name: "P-Block Elements", subject: "Inorganic Chemistry" },
      { name: "Coordination Compounds", subject: "Inorganic Chemistry" },
      { name: "States of Matter", subject: "Physical Chemistry" },
      { name: "Thermodynamics", subject: "Physical Chemistry" },
      { name: "Equilibrium", subject: "Physical Chemistry" },
      { name: "Redox Reactions", subject: "Physical Chemistry" },
      { name: "Electrochemistry", subject: "Electrochemistry" },
      { name: "Chemical Kinetics", subject: "Physical Chemistry" },
      { name: "Surface Chemistry", subject: "Physical Chemistry" },
      { name: "Chemical Bonding & Molecular Structure", subject: "Chemical Bonding" },
      { name: "Hydrocarbons", subject: "Organic Chemistry" },
      { name: "Alkanes, Alkenes & Alkynes", subject: "Organic Chemistry" },
      { name: "Aromatic Compounds", subject: "Organic Chemistry" },
      { name: "Alcohols, Phenols & Ethers", subject: "Organic Chemistry" },
      { name: "Aldehydes, Ketones & Carboxylic Acids", subject: "Organic Chemistry" },
      { name: "Amines & Amino Acids", subject: "Organic Chemistry" },
      { name: "Polymers", subject: "Organic Chemistry" },
      { name: "Biomolecules", subject: "Organic Chemistry" },
    ]},
    { subject: "Mathematics", chapters: [
      { name: "Limits & Continuity", subject: "Calculus" },
      { name: "Derivatives", subject: "Calculus" },
      { name: "Applications of Derivatives", subject: "Calculus" },
      { name: "Integrals", subject: "Calculus" },
      { name: "Definite Integrals", subject: "Calculus" },
      { name: "Areas & Volumes", subject: "Calculus" },
      { name: "Differential Equations", subject: "Calculus" },
      { name: "Straight Lines", subject: "Coordinate Geometry" },
      { name: "Circles", subject: "Coordinate Geometry" },
      { name: "Parabola", subject: "Coordinate Geometry" },
      { name: "Ellipse & Hyperbola", subject: "Coordinate Geometry" },
      { name: "3D Geometry", subject: "Coordinate Geometry" },
      { name: "Complex Numbers", subject: "Algebra" },
      { name: "Quadratic Equations", subject: "Algebra" },
      { name: "Sequences & Series", subject: "Algebra" },
      { name: "Permutation & Combination", subject: "Probability" },
      { name: "Probability", subject: "Probability" },
      { name: "Binomial Theorem", subject: "Algebra" },
      { name: "Vectors & 3D", subject: "Vectors" },
      { name: "Trigonometric Ratios", subject: "Trigonometry" },
      { name: "Trigonometric Equations", subject: "Trigonometry" },
      { name: "Inverse Trigonometry", subject: "Trigonometry" },
      { name: "Matrices & Determinants", subject: "Matrices" },
      { name: "Linear Programming", subject: "Algebra" },
      { name: "Sets & Relations", subject: "Algebra" },
    ]},
  ],
  NEET: [
    { subject: "Physics", chapters: [
      { name: "Laws of Motion", subject: "Mechanics" },
      { name: "Work, Energy & Power", subject: "Mechanics" },
      { name: "Projectile Motion", subject: "Mechanics" },
      { name: "Circular Motion", subject: "Mechanics" },
      { name: "Rotational Motion", subject: "Mechanics" },
      { name: "Waves & Sound", subject: "Waves" },
      { name: "Simple Harmonic Motion", subject: "Waves" },
      { name: "Heat & Thermodynamics", subject: "Thermodynamics" },
      { name: "Kinetic Theory", subject: "Thermodynamics" },
      { name: "Electric Field & Force", subject: "Electrodynamics" },
      { name: "Electric Potential", subject: "Electrodynamics" },
      { name: "Capacitance", subject: "Electrodynamics" },
      { name: "Current & Resistance", subject: "Electrodynamics" },
      { name: "Magnetic Effects of Current", subject: "Magnetism" },
      { name: "Electromagnetic Induction", subject: "Magnetism" },
      { name: "Reflection of Light", subject: "Optics" },
      { name: "Refraction of Light", subject: "Optics" },
      { name: "Lenses & Optical Instruments", subject: "Optics" },
      { name: "Photoelectric Effect", subject: "Modern Physics" },
      { name: "Atomic Structure", subject: "Modern Physics" },
      { name: "Nuclear Physics", subject: "Modern Physics" },
      { name: "Semiconductors", subject: "Modern Physics" },
    ]},
    { subject: "Chemistry", chapters: [
      { name: "Atomic Structure", subject: "Inorganic Chemistry" },
      { name: "Chemical Bonding", subject: "Chemical Bonding" },
      { name: "Molecular Weight & Mole Concept", subject: "Physical Chemistry" },
      { name: "Periodic Classification", subject: "Inorganic Chemistry" },
      { name: "Hydrogen", subject: "Inorganic Chemistry" },
      { name: "S-Block Elements", subject: "Inorganic Chemistry" },
      { name: "P-Block Elements", subject: "Inorganic Chemistry" },
      { name: "D-Block & Transition Elements", subject: "Inorganic Chemistry" },
      { name: "Coordination Compounds", subject: "Inorganic Chemistry" },
      { name: "Gaseous State", subject: "Physical Chemistry" },
      { name: "Liquid State", subject: "Physical Chemistry" },
      { name: "Solid State", subject: "Physical Chemistry" },
      { name: "Solutions & Colligative Properties", subject: "Physical Chemistry" },
      { name: "Thermodynamics & Thermochemistry", subject: "Physical Chemistry" },
      { name: "Chemical Equilibrium", subject: "Physical Chemistry" },
      { name: "Ionic Equilibrium", subject: "Physical Chemistry" },
      { name: "Redox Reactions", subject: "Physical Chemistry" },
      { name: "Electrochemistry", subject: "Electrochemistry" },
      { name: "Chemical Kinetics", subject: "Physical Chemistry" },
      { name: "Surface Chemistry", subject: "Physical Chemistry" },
      { name: "General Organic Chemistry", subject: "Organic Chemistry" },
      { name: "Hydrocarbons", subject: "Organic Chemistry" },
      { name: "Halogenated Hydrocarbons", subject: "Organic Chemistry" },
      { name: "Alcohols & Ethers", subject: "Organic Chemistry" },
      { name: "Carbonyl Compounds", subject: "Organic Chemistry" },
      { name: "Carboxylic Acids", subject: "Organic Chemistry" },
      { name: "Amines & Diazonium Salts", subject: "Organic Chemistry" },
      { name: "Biomolecules", subject: "Organic Chemistry" },
      { name: "Polymers", subject: "Organic Chemistry" },
    ]},
    { subject: "Biology", chapters: [
      { name: "Cell Structure & Function", subject: "Cell Biology" },
      { name: "Cell Division", subject: "Cell Biology" },
      { name: "Photosynthesis", subject: "Plant Physiology" },
      { name: "Respiration", subject: "Cell Biology" },
      { name: "Plant Growth & Development", subject: "Plant Physiology" },
      { name: "Reproduction in Plants", subject: "Plant Physiology" },
      { name: "Genetics & Heredity", subject: "Genetics" },
      { name: "Molecular Biology", subject: "Molecular Biology" },
      { name: "Evolution", subject: "Ecology" },
      { name: "Ecology & Organisms", subject: "Ecology" },
      { name: "Biodiversity", subject: "Ecology" },
      { name: "Plant Kingdom", subject: "Morphology" },
      { name: "Animal Kingdom", subject: "Animal Kingdom" },
      { name: "Human Physiology - Digestion & Nutrition", subject: "Human Physiology" },
      { name: "Human Physiology - Respiration & Circulation", subject: "Human Physiology" },
      { name: "Human Physiology - Nervous System", subject: "Human Physiology" },
      { name: "Human Physiology - Hormones & Reproduction", subject: "Human Physiology" },
      { name: "Excretion & Osmoregulation", subject: "Human Physiology" },
      { name: "Movement & Locomotion", subject: "Human Physiology" },
      { name: "Immunity", subject: "Human Physiology" },
    ]},
  ],
  CUET: [
    { subject: "English", chapters: [
      { name: "Reading Comprehension - Passage 1", subject: "Reading Comprehension" },
      { name: "Reading Comprehension - Passage 2", subject: "Reading Comprehension" },
      { name: "Vocabulary & Word Meanings", subject: "Vocabulary" },
      { name: "Synonyms & Antonyms", subject: "Vocabulary" },
      { name: "Grammar - Tenses", subject: "Grammar" },
      { name: "Grammar - Articles & Prepositions", subject: "Grammar" },
      { name: "Grammar - Sentence Correction", subject: "Grammar" },
      { name: "Fill in the Blanks", subject: "Vocabulary" },
      { name: "Idioms & Phrases", subject: "Vocabulary" },
    ]},
    { subject: "General Test", chapters: [
      { name: "Arithmetic", subject: "Quantitative Aptitude" },
      { name: "Algebra", subject: "Quantitative Aptitude" },
      { name: "Geometry & Mensuration", subject: "Quantitative Aptitude" },
      { name: "Percentage & Profit Loss", subject: "Quantitative Aptitude" },
      { name: "Time & Work", subject: "Quantitative Aptitude" },
      { name: "Speed & Distance", subject: "Quantitative Aptitude" },
      { name: "Analogy", subject: "Logical Reasoning" },
      { name: "Classification", subject: "Logical Reasoning" },
      { name: "Series Completion", subject: "Logical Reasoning" },
      { name: "Coding & Decoding", subject: "Logical Reasoning" },
      { name: "Blood Relations", subject: "Logical Reasoning" },
      { name: "Syllogism", subject: "Logical Reasoning" },
      { name: "Direction Sense", subject: "Logical Reasoning" },
      { name: "General Knowledge - History", subject: "GK" },
      { name: "General Knowledge - Geography", subject: "GK" },
      { name: "General Knowledge - Science", subject: "GK" },
      { name: "Current Affairs", subject: "GK" },
      { name: "Indian Constitution", subject: "GK" },
    ]},
    { subject: "Physics", chapters: [
      { name: "Newton's Laws of Motion", subject: "Mechanics" },
      { name: "Work, Energy & Power", subject: "Mechanics" },
      { name: "Rotational Motion", subject: "Mechanics" },
      { name: "Gravitation", subject: "Mechanics" },
      { name: "Properties of Matter", subject: "Matter" },
      { name: "Thermodynamics", subject: "Thermodynamics" },
      { name: "Kinetic Theory of Gases", subject: "Thermodynamics" },
      { name: "Waves & Oscillations", subject: "Waves" },
      { name: "Electrostatics", subject: "Electrodynamics" },
      { name: "Current Electricity", subject: "Electrodynamics" },
      { name: "Magnetic Effects of Current", subject: "Magnetism" },
      { name: "Electromagnetic Induction", subject: "Magnetism" },
      { name: "Optics - Ray Optics", subject: "Optics" },
      { name: "Optics - Wave Optics", subject: "Optics" },
      { name: "Dual Nature of Radiation", subject: "Modern Physics" },
      { name: "Atoms & Nuclei", subject: "Modern Physics" },
      { name: "Semiconductors", subject: "Modern Physics" },
    ]},
    { subject: "Chemistry", chapters: [
      { name: "Atomic Structure", subject: "Inorganic Chemistry" },
      { name: "Chemical Bonding", subject: "Chemical Bonding" },
      { name: "States of Matter", subject: "Physical Chemistry" },
      { name: "Thermodynamics & Thermochemistry", subject: "Physical Chemistry" },
      { name: "Equilibrium", subject: "Physical Chemistry" },
      { name: "Redox Reactions", subject: "Physical Chemistry" },
      { name: "Solutions & Colligative Properties", subject: "Physical Chemistry" },
      { name: "Electrochemistry", subject: "Electrochemistry" },
      { name: "Chemical Kinetics", subject: "Physical Chemistry" },
      { name: "Surface Chemistry", subject: "Physical Chemistry" },
      { name: "P-Block Elements", subject: "Inorganic Chemistry" },
      { name: "D-Block & Transition Elements", subject: "Inorganic Chemistry" },
      { name: "Coordination Compounds", subject: "Inorganic Chemistry" },
      { name: "Hydrocarbons", subject: "Organic Chemistry" },
      { name: "Organic Compounds - Haloalkanes & Alcohols", subject: "Organic Chemistry" },
      { name: "Aldehydes, Ketones & Carboxylic Acids", subject: "Organic Chemistry" },
      { name: "Amines & Amino Acids", subject: "Organic Chemistry" },
      { name: "Polymers & Biomolecules", subject: "Organic Chemistry" },
    ]},
    { subject: "Mathematics", chapters: [
      { name: "Relations & Functions", subject: "Algebra" },
      { name: "Inverse Trigonometric Functions", subject: "Trigonometry" },
      { name: "Matrices & Determinants", subject: "Linear Algebra" },
      { name: "Continuity & Differentiability", subject: "Calculus" },
      { name: "Applications of Derivatives", subject: "Calculus" },
      { name: "Integrals & Definite Integrals", subject: "Calculus" },
      { name: "Differential Equations", subject: "Calculus" },
      { name: "Vectors", subject: "Vector Algebra" },
      { name: "3D Geometry", subject: "Coordinate Geometry" },
      { name: "Linear Programming", subject: "Optimization" },
      { name: "Probability", subject: "Statistics & Probability" },
      { name: "Sequences & Series", subject: "Algebra" },
      { name: "Complex Numbers", subject: "Algebra" },
      { name: "Permutations & Combinations", subject: "Combinatorics" },
    ]},
    { subject: "Economics", chapters: [
      { name: "Introduction to Microeconomics", subject: "Microeconomics" },
      { name: "Consumer Behaviour & Demand", subject: "Microeconomics" },
      { name: "Producer Behaviour & Supply", subject: "Microeconomics" },
      { name: "Market Equilibrium & Price Mechanism", subject: "Microeconomics" },
      { name: "National Income Accounting", subject: "Macroeconomics" },
      { name: "Money & Banking", subject: "Macroeconomics" },
      { name: "Government Budget & Fiscal Policy", subject: "Macroeconomics" },
      { name: "Balance of Payments", subject: "International Economics" },
      { name: "Indian Economy - Liberalisation & Reforms", subject: "Indian Economy" },
      { name: "Planning in India", subject: "Indian Economy" },
      { name: "Development & Poverty Issues", subject: "Development Economics" },
      { name: "Current Economic Issues & Challenges", subject: "Contemporary Economics" },
    ]},
    { subject: "Business Studies", chapters: [
      { name: "Nature & Scope of Management", subject: "Management Fundamentals" },
      { name: "Principles of Management", subject: "Management Fundamentals" },
      { name: "Business Environment", subject: "Business Environment" },
      { name: "Planning", subject: "Management Functions" },
      { name: "Organising", subject: "Management Functions" },
      { name: "Staffing & Human Resource Management", subject: "Management Functions" },
      { name: "Directing & Leadership", subject: "Management Functions" },
      { name: "Controlling & Performance Evaluation", subject: "Management Functions" },
      { name: "Financial Management & Capital Structure", subject: "Finance" },
      { name: "Financial Markets & Institutions", subject: "Finance" },
      { name: "Marketing Management", subject: "Marketing" },
      { name: "Consumer Protection & Rights", subject: "Consumer Protection" },
    ]},
    { subject: "Accountancy", chapters: [
      { name: "Partnership Fundamentals", subject: "Partnership Accounting" },
      { name: "Goodwill & Partner Admission", subject: "Partnership Accounting" },
      { name: "Retirement & Death of Partner", subject: "Partnership Accounting" },
      { name: "Dissolution of Partnership", subject: "Partnership Accounting" },
      { name: "Share Capital & Issue of Debentures", subject: "Company Accounting" },
      { name: "Redemption & Buyback of Shares", subject: "Company Accounting" },
      { name: "Depreciation Methods", subject: "Financial Accounting" },
      { name: "Financial Statements Analysis", subject: "Financial Analysis" },
      { name: "Cash Flow Statement", subject: "Financial Analysis" },
      { name: "Ratio Analysis", subject: "Financial Analysis" },
      { name: "Fund Flow Statement", subject: "Financial Analysis" },
      { name: "Inventory Valuation Methods", subject: "Financial Accounting" },
    ]},
    { subject: "Political Science", chapters: [
      { name: "Indian Constitution - Preamble & Articles", subject: "Constitutional Law" },
      { name: "Fundamental Rights & Fundamental Duties", subject: "Constitutional Law" },
      { name: "Directive Principles of State Policy", subject: "Constitutional Law" },
      { name: "Parliament - Structure & Functions", subject: "Indian Polity" },
      { name: "State Legislature - Structure & Functions", subject: "Indian Polity" },
      { name: "Executive - President, PM & Council of Ministers", subject: "Indian Polity" },
      { name: "Judiciary - Structure & Powers", subject: "Indian Polity" },
      { name: "Federalism in India", subject: "Indian Polity" },
      { name: "Local Government - Panchayati Raj & Municipalities", subject: "Indian Polity" },
      { name: "Political Parties & Electoral System", subject: "Indian Polity" },
      { name: "India's Foreign Policy & Diplomacy", subject: "International Relations" },
      { name: "Contemporary World Politics", subject: "International Relations" },
    ]},
    { subject: "Psychology", chapters: [
      { name: "Introduction to Psychology & Approaches", subject: "Foundations" },
      { name: "Methods of Enquiry in Psychology", subject: "Research Methods" },
      { name: "Biological Bases of Behaviour", subject: "Neuroscience" },
      { name: "Human Development - Childhood to Adulthood", subject: "Development Psychology" },
      { name: "Sensation & Perception", subject: "Sensory Processes" },
      { name: "Attention & Memory", subject: "Cognitive Psychology" },
      { name: "Learning - Classical & Operant Conditioning", subject: "Learning" },
      { name: "Thinking, Problem Solving & Creativity", subject: "Cognitive Psychology" },
      { name: "Intelligence & Aptitude", subject: "Individual Differences" },
      { name: "Motivation & Emotion", subject: "Motivation & Emotion" },
      { name: "Personality - Theories & Assessment", subject: "Personality Psychology" },
      { name: "Psychological Disorders & Mental Health", subject: "Abnormal Psychology" },
      { name: "Therapeutic Approaches & Counselling", subject: "Clinical Psychology" },
      { name: "Attitudes & Social Cognition", subject: "Social Psychology" },
    ]},
  ],
};

// --- Helpers ---
function buildDocId(exam, subject, topic) {
  return `${exam}-${subject}-${topic}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildSearchQuery(topic, subject, exam) {
  return `${topic} ${exam} ${subject} lecture explanation`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Main Seeder ---
async function seedVideos(filterExam, filterSubject) {
  const exams = filterExam ? [filterExam] : Object.keys(ALL_TOPICS);

  let totalTopics = 0;
  let seeded = 0;
  let skipped = 0;
  let failed = 0;

  // Count total
  for (const exam of exams) {
    const subjects = ALL_TOPICS[exam] || [];
    for (const subjectGroup of subjects) {
      if (filterSubject && subjectGroup.subject !== filterSubject) continue;
      totalTopics += subjectGroup.chapters.length;
    }
  }

  console.log(`\n🎬 LearnFlix Video Seeder`);
  console.log(`📊 Total topics to seed: ${totalTopics}`);
  console.log(`📁 Firestore collection: ${COLLECTION}\n`);

  for (const exam of exams) {
    const subjects = ALL_TOPICS[exam] || [];

    for (const subjectGroup of subjects) {
      if (filterSubject && subjectGroup.subject !== filterSubject) continue;

      console.log(`\n📚 ${exam} > ${subjectGroup.subject} (${subjectGroup.chapters.length} chapters)`);

      for (const chapter of subjectGroup.chapters) {
        const docId = buildDocId(exam, subjectGroup.subject, chapter.name);

        // Check if already seeded
        const existing = await db.collection(COLLECTION).doc(docId).get();
        if (existing.exists && existing.data().videos?.length > 0) {
          console.log(`  ⏭️  ${chapter.name} — already seeded (${existing.data().videos.length} videos)`);
          skipped++;
          continue;
        }

        // Search YouTube
        const query = buildSearchQuery(chapter.name, subjectGroup.subject, exam);
        try {
          const videos = await searchYouTube(query);

          if (videos.length > 0) {
            await db.collection(COLLECTION).doc(docId).set({
              exam,
              subject: subjectGroup.subject,
              topic: chapter.name,
              category: chapter.subject,
              videos,
              videoCount: videos.length,
              searchQuery: query,
              seededAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            seeded++;
            console.log(`  ✅ ${chapter.name} — ${videos.length} videos stored`);
          } else {
            failed++;
            console.log(`  ❌ ${chapter.name} — no videos found`);
          }
        } catch (err) {
          failed++;
          console.error(`  ❌ ${chapter.name} — error: ${err.message}`);
        }

        // Rate limit: 1 second between YouTube requests to avoid blocking
        await sleep(1000);
      }
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   Seeded: ${seeded}`);
  console.log(`   Skipped (already done): ${skipped}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${seeded + skipped + failed} / ${totalTopics}\n`);
}

// --- CLI ---
const [,, filterExam, filterSubject] = process.argv;
seedVideos(filterExam, filterSubject)
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal:', err); process.exit(1); });
