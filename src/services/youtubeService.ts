export interface Chapter {
  name: string;
  subject: string;
}

export interface TopicGroup {
  subject: string;
  chapters: Chapter[];
}

export interface Video {
  title: string;
  channelName: string;
  videoId: string;
}

// Cache version — bump this to invalidate all cached video data
const CACHE_VERSION = "v2";

// Our own Vercel serverless proxy for YouTube search (no CORS issues)
const YOUTUBE_SEARCH_API = "/api/youtube-search";

// ============================================================================
// TOPIC AND CHAPTER DEFINITIONS
// ============================================================================

const JEE_TOPICS: TopicGroup[] = [
  {
    subject: "Physics",
    chapters: [
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
    ],
  },
  {
    subject: "Chemistry",
    chapters: [
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
    ],
  },
  {
    subject: "Mathematics",
    chapters: [
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
    ],
  },
];

const NEET_TOPICS: TopicGroup[] = [
  {
    subject: "Physics",
    chapters: [
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
    ],
  },
  {
    subject: "Chemistry",
    chapters: [
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
    ],
  },
  {
    subject: "Biology",
    chapters: [
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
    ],
  },
];

const CUET_TOPICS: TopicGroup[] = [
  {
    subject: "English",
    chapters: [
      { name: "Reading Comprehension - Passage 1", subject: "Reading Comprehension" },
      { name: "Reading Comprehension - Passage 2", subject: "Reading Comprehension" },
      { name: "Vocabulary & Word Meanings", subject: "Vocabulary" },
      { name: "Synonyms & Antonyms", subject: "Vocabulary" },
      { name: "Grammar - Tenses", subject: "Grammar" },
      { name: "Grammar - Articles & Prepositions", subject: "Grammar" },
      { name: "Grammar - Sentence Correction", subject: "Grammar" },
      { name: "Fill in the Blanks", subject: "Vocabulary" },
      { name: "Idioms & Phrases", subject: "Vocabulary" },
    ],
  },
  {
    subject: "General Test",
    chapters: [
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
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the list of topics for a specific exam
 */
export function getTopicsForExam(
  exam: "JEE" | "NEET" | "CUET"
): TopicGroup[] {
  switch (exam) {
    case "JEE":
      return JEE_TOPICS;
    case "NEET":
      return NEET_TOPICS;
    case "CUET":
      return CUET_TOPICS;
    default:
      return [];
  }
}

/**
 * Get YouTube thumbnail URL for a video
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

/**
 * Clear old (v1) cached video data from localStorage
 * Call this once on app startup to purge Gemini-hallucinated video IDs
 */
export function clearOldVideoCache(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("learnflix-") && !key.startsWith(`learnflix-${CACHE_VERSION}-`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      console.log(`Cleared ${keysToRemove.length} old video cache entries`);
    }
  } catch (e) {
    console.warn("Error clearing old video cache:", e);
  }
}

/**
 * Timeout wrapper
 */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms / 1000}s`)),
      ms
    );
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

// ============================================================================
// YOUTUBE SEARCH VIA VERCEL SERVERLESS PROXY
// ============================================================================

/**
 * Search YouTube via our own serverless API route (no CORS, no API key needed)
 */
async function searchYouTube(query: string): Promise<Video[]> {
  try {
    const url = `${YOUTUBE_SEARCH_API}?q=${encodeURIComponent(query)}`;
    const response = await withTimeout(
      fetch(url),
      15_000,
      "YouTube search proxy"
    );

    if (!response.ok) {
      console.warn(`YouTube search proxy returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    const videos: Video[] = (data.videos || [])
      .filter((v: any) => v.videoId && v.title)
      .slice(0, 10)
      .map((v: any) => ({
        title: v.title,
        channelName: v.channelName || "Unknown Channel",
        videoId: v.videoId,
      }));

    if (videos.length > 0) {
      console.log(`Got ${videos.length} real YouTube videos`);
    }

    return videos;
  } catch (e: any) {
    console.error(`YouTube search failed: ${e.message}`);
    return [];
  }
}

// ============================================================================
// VIDEO FETCHING — PUBLIC API
// ============================================================================

/**
 * Build an optimal search query for a topic + exam
 */
function buildSearchQuery(topic: string, subject: string, exam: string): string {
  // Create a search query that targets Indian exam prep content
  const examLabel = exam === "JEE" ? "JEE" : exam === "NEET" ? "NEET" : "CUET";
  return `${topic} ${examLabel} ${subject} lecture explanation`;
}

/**
 * Fetch real YouTube videos for a topic using Invidious/Piped APIs
 * Uses localStorage caching to avoid repeated API calls
 */
export async function fetchVideosForTopic(
  topic: string,
  subject: string,
  exam: string
): Promise<Video[]> {
  const cacheKey = `learnflix-${CACHE_VERSION}-${exam}-${subject}-${topic}`
    .toLowerCase()
    .replace(/\s+/g, "-");

  // Check localStorage cache first
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`Using cached videos for ${cacheKey}`);
        return parsed as Video[];
      }
    }
  } catch (e) {
    console.warn("Error reading from localStorage cache:", e);
  }

  // Build search query
  const query = buildSearchQuery(topic, subject, exam);
  console.log(`Searching YouTube for: "${query}"`);

  // Search via our serverless proxy
  let videos = await searchYouTube(query);

  // Cache the result if we got videos
  if (videos.length > 0) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(videos));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  } else {
    console.error(`No videos found for "${query}" from any source`);
  }

  return videos;
}

export default {
  getTopicsForExam,
  getYouTubeThumbnail,
  fetchVideosForTopic,
  clearOldVideoCache,
};
