/**
 * Central Exam Configuration for PrepTribe
 * Defines subjects, prompts, labels, and all exam-specific content
 * for JEE, NEET, and CUET.
 */

export type ExamType = 'JEE' | 'NEET' | 'CUET';

export interface ExamConfig {
  id: ExamType;
  name: string;
  fullName: string;
  tagline: string;
  subjects: string[];                     // e.g. ['Physics', 'Chemistry', 'Mathematics']
  subjectShort: string;                   // e.g. 'PCM'
  eloKeys: string[];                      // lowercase keys for Elo storage
  questionDistribution: Record<string, number>; // subject → count for 12-question mock
  difficultyLabel: string;                // e.g. 'JEE Mains top 1%'
  mockTitle: string;                      // e.g. 'JEE Mains Daily Sprint'
  miniMockPrompt: string;                 // Gemini prompt for mini mock
  secondaryPrompt: string;               // Gemini prompt for flashcards/sudden death etc.
  difficultyInstructions: string;
  topicExamples: Record<string, string[]>; // subject → example topics
}

// ============================================================================
// JEE CONFIGURATION
// ============================================================================

const JEE_CONFIG: ExamConfig = {
  id: 'JEE',
  name: 'JEE',
  fullName: 'JEE Mains & Advanced',
  tagline: 'Conquer JEE with PrepTribe',
  subjects: ['Physics', 'Chemistry', 'Mathematics'],
  subjectShort: 'PCM',
  eloKeys: ['physics', 'chemistry', 'mathematics'],
  questionDistribution: { Physics: 4, Chemistry: 4, Mathematics: 4 },
  difficultyLabel: 'JEE Mains top 1% level',
  mockTitle: 'JEE Mains Daily Sprint',
  difficultyInstructions: `DIFFICULTY: ALL questions MUST be Tough or Very Tough. JEE Mains top 1% level.
Include multi-concept problems. Numerical answers should be non-trivial.
Each question must test deep understanding, not just formula recall.`,
  miniMockPrompt: `Generate 12 EXTREMELY CHALLENGING JEE Mains MCQ questions: 4 Physics, 4 Chemistry, 4 Mathematics.

REQUIREMENTS:
- All questions JEE Mains difficulty (top 1% level)
- Each question must have exactly 4 options with exactly 1 correct answer
- Include step-by-step explanation for each
- Use LaTeX for all math expressions (wrap in $ for inline, $$ for block)
- Cover different topics within each subject
- Mark difficulty as "Tough" or "Very Tough"

PHYSICS TOPICS: Mechanics, Electrodynamics, Optics, Thermodynamics, Modern Physics, Waves
CHEMISTRY TOPICS: Organic reactions, Coordination compounds, Electrochemistry, Chemical kinetics, Thermochemistry, p-block elements
MATHEMATICS TOPICS: Calculus, Coordinate geometry, Algebra, Probability, Vectors, Matrices`,

  secondaryPrompt: `Generate JEE Mains level questions:

1. flashcards: 5 questions (Mix of Physics/Chemistry/Mathematics) - conceptual one-liners with short answers
2. suddenDeath: 5 questions (Mix of PCM) - rapid-fire MCQs, moderate difficulty
3. skipOrSolve: 5 questions (Mix of PCM) - tricky questions where some are traps (isTrap: true) designed to waste time
4. duels: 5 questions (Mix of PCM) - competitive-style MCQs, clear and unambiguous`,

  topicExamples: {
    Physics: ['Mechanics', 'Electrodynamics', 'Optics', 'Thermodynamics', 'Modern Physics', 'Waves'],
    Chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Coordination Compounds', 'Electrochemistry'],
    Mathematics: ['Calculus', 'Coordinate Geometry', 'Algebra', 'Probability', 'Vectors', 'Trigonometry'],
  },
};

// ============================================================================
// NEET CONFIGURATION
// ============================================================================

const NEET_CONFIG: ExamConfig = {
  id: 'NEET',
  name: 'NEET',
  fullName: 'NEET UG',
  tagline: 'Crack NEET with PrepTribe',
  subjects: ['Physics', 'Chemistry', 'Biology'],
  subjectShort: 'PCB',
  eloKeys: ['physics', 'chemistry', 'biology'],
  questionDistribution: { Physics: 3, Chemistry: 3, Biology: 6 },
  difficultyLabel: 'NEET top 1% level',
  mockTitle: 'NEET Daily Sprint',
  difficultyInstructions: `DIFFICULTY: ALL questions MUST be Tough or Very Tough. NEET top 1% level.
Include application-based and assertion-reasoning style questions.
Questions must test conceptual clarity and NCERT mastery, not just memorization.`,
  miniMockPrompt: `Generate 12 EXTREMELY CHALLENGING NEET UG MCQ questions: 3 Physics, 3 Chemistry, 6 Biology (3 Botany + 3 Zoology).

REQUIREMENTS:
- All questions NEET difficulty (top 1% level, NCERT-based but application-oriented)
- Each question must have exactly 4 options with exactly 1 correct answer
- Include step-by-step explanation for each
- Use LaTeX for all math/science expressions (wrap in $ for inline, $$ for block)
- Cover different topics within each subject
- Mark difficulty as "Tough" or "Very Tough"

PHYSICS TOPICS: Mechanics, Electrostatics, Current Electricity, Optics, Modern Physics, Thermodynamics, Magnetism
CHEMISTRY TOPICS: Organic Chemistry (GOC, Named Reactions), Inorganic Chemistry (p-block, d-block), Physical Chemistry (Equilibrium, Electrochemistry, Kinetics)
BIOLOGY TOPICS: Human Physiology, Plant Physiology, Genetics & Evolution, Ecology, Cell Biology, Molecular Biology, Morphology of Flowering Plants, Animal Kingdom`,

  secondaryPrompt: `Generate NEET UG level questions:

1. flashcards: 5 questions (Mix of Physics/Chemistry/Biology) - conceptual one-liners with short NCERT-based answers
2. suddenDeath: 5 questions (Mix of PCB) - rapid-fire MCQs, moderate difficulty
3. skipOrSolve: 5 questions (Mix of PCB) - tricky NEET questions where some are traps (isTrap: true) designed to confuse with similar-sounding options
4. duels: 5 questions (Mix of PCB) - competitive-style MCQs, clear and unambiguous`,

  topicExamples: {
    Physics: ['Mechanics', 'Electrostatics', 'Current Electricity', 'Optics', 'Modern Physics', 'Thermodynamics'],
    Chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Chemical Bonding', 'Coordination Compounds'],
    Biology: ['Human Physiology', 'Plant Physiology', 'Genetics', 'Ecology', 'Cell Biology', 'Molecular Biology'],
  },
};

// ============================================================================
// CUET CONFIGURATION
// ============================================================================

const CUET_CONFIG: ExamConfig = {
  id: 'CUET',
  name: 'CUET',
  fullName: 'CUET UG',
  tagline: 'Ace CUET with PrepTribe',
  subjects: ['English', 'General Test', 'Domain Subject'],
  subjectShort: 'EGD',
  eloKeys: ['english', 'generaltest', 'domain'],
  questionDistribution: { English: 4, 'General Test': 4, 'Domain Subject': 4 },
  difficultyLabel: 'CUET top percentile level',
  mockTitle: 'CUET Daily Sprint',
  difficultyInstructions: `DIFFICULTY: ALL questions MUST be Tough or Very Tough. CUET UG top percentile level.
Include reading comprehension, quantitative reasoning, and current affairs.
Questions must test analytical thinking and conceptual understanding at 12th grade level.`,
  miniMockPrompt: `Generate 12 CHALLENGING CUET UG MCQ questions: 4 English, 4 General Test, 4 Domain Subject (General Awareness + Quantitative Aptitude + Logical Reasoning).

REQUIREMENTS:
- All questions CUET UG difficulty (top percentile level)
- Each question must have exactly 4 options with exactly 1 correct answer
- Include step-by-step explanation for each
- Cover different topics within each section
- Mark difficulty as "Tough" or "Very Tough"

ENGLISH TOPICS: Reading Comprehension, Vocabulary, Grammar, Para Jumbles, Error Spotting, Idioms & Phrases
GENERAL TEST TOPICS: Quantitative Aptitude (Arithmetic, Algebra, Data Interpretation), Logical Reasoning (Coding-Decoding, Blood Relations, Syllogisms), General Knowledge & Current Affairs
DOMAIN SUBJECT TOPICS: General Awareness (Indian History, Geography, Polity, Economics), Current Affairs (last 6 months), Static GK`,

  secondaryPrompt: `Generate CUET UG level questions:

1. flashcards: 5 questions (Mix of English/General Test/Domain Subject) - conceptual one-liners with short answers
2. suddenDeath: 5 questions (Mix of all sections) - rapid-fire MCQs, moderate difficulty
3. skipOrSolve: 5 questions (Mix of all sections) - tricky questions where some are traps (isTrap: true) designed to waste time with similar options
4. duels: 5 questions (Mix of all sections) - competitive-style MCQs, clear and unambiguous`,

  topicExamples: {
    English: ['Reading Comprehension', 'Vocabulary', 'Grammar', 'Para Jumbles', 'Error Spotting'],
    'General Test': ['Quantitative Aptitude', 'Logical Reasoning', 'Data Interpretation', 'General Knowledge'],
    'Domain Subject': ['Indian History', 'Geography', 'Polity', 'Economics', 'Current Affairs'],
  },
};

// ============================================================================
// CONFIG MAP & HELPERS
// ============================================================================

export const EXAM_CONFIGS: Record<ExamType, ExamConfig> = {
  JEE: JEE_CONFIG,
  NEET: NEET_CONFIG,
  CUET: CUET_CONFIG,
};

export function getExamConfig(exam: ExamType): ExamConfig {
  return EXAM_CONFIGS[exam];
}

export function getSubjectsForExam(exam: ExamType): string[] {
  return EXAM_CONFIGS[exam].subjects;
}

export function getEloKeysForExam(exam: ExamType): string[] {
  return EXAM_CONFIGS[exam].eloKeys;
}

/** Available CUET Domain Subjects */
export const CUET_DOMAIN_SUBJECTS = [
  'Economics',
  'Political Science',
  'History',
  'Geography',
  'Psychology',
  'Sociology',
  'Mathematics',
  'Computer Science',
  'Accountancy',
  'Business Studies',
  'Physics',
  'Chemistry',
  'Biology',
] as const;

export type CuetDomainSubject = typeof CUET_DOMAIN_SUBJECTS[number];

/** Get the default exam (JEE) — used as fallback */
export const DEFAULT_EXAM: ExamType = 'JEE';

/** All available exams */
export const ALL_EXAMS: ExamType[] = ['JEE', 'NEET', 'CUET'];
