/**
 * Elo Rating System Service for PrepTribe
 * Manages adaptive difficulty and student skill tracking across dynamic subjects
 */

import { ExamType } from './examConfig';

// Elo keys per exam — avoids circular dependency on full examConfig
const EXAM_ELO_KEYS: Record<ExamType, string[]> = {
  JEE: ['physics', 'chemistry', 'mathematics'],
  NEET: ['physics', 'chemistry', 'biology'],
  CUET: ['english', 'generaltest', 'domain'],
};

// ============================================================================
// INTERFACES
// ============================================================================

export type EloRatings = Record<string, number>;
// Always has 'overall' key plus subject keys like 'physics', 'chemistry', etc.

export interface EloUpdate {
  previousElo: number;
  newElo: number;
  change: number;
  subject: string;
}

export interface DifficultyTarget {
  targetElo: number;
  recommendedDifficulty: 'Easy' | 'Medium' | 'Tough' | 'Very Tough';
  subject: string;
}

export interface WeaknessAnalysis {
  weakest: string;
  strongest: string;
  gap: number;
  recommendation: string;
}

export interface TierInfo {
  tier: string;
  color: string;
  emoji: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_ELO = 1200;
const K_FACTOR = 32;
const TARGET_SUCCESS_RATE = 0.7;
const ELO_OFFSET_FOR_TARGET = 146; // ~70% success probability

const DIFFICULTY_ELO_MAP: Record<string, number> = {
  Easy: 900,
  Medium: 1100,
  Tough: 1300,
  'Very Tough': 1500,
};

const TIER_BOUNDARIES = [
  { min: 1600, tier: 'Diamond', color: '#F59E0B', emoji: '👑' },
  { min: 1400, tier: 'Platinum', color: '#D97706', emoji: '💎' },
  { min: 1200, tier: 'Gold', color: '#F59E0B', emoji: '🥇' },
  { min: 1000, tier: 'Silver', color: '#B45309', emoji: '🥈' },
  { min: 0, tier: 'Bronze', color: '#92400E', emoji: '🥉' },
];

// ============================================================================
// CORE ELO CALCULATION
// ============================================================================

/**
 * Calculate expected probability of winning (getting answer correct)
 * Based on Elo rating difference
 * Formula: E = 1 / (1 + 10^((opponent_rating - player_rating) / 400))
 */
function calculateExpectedScore(
  studentElo: number,
  questionDifficulty: number
): number {
  const ratingDifference = questionDifficulty - studentElo;
  const exponent = ratingDifference / 400;
  return 1 / (1 + Math.pow(10, exponent));
}

/**
 * Calculate new Elo rating after a single answer
 * Formula: New = Old + K * (S - E)
 * Where S = 1 if correct, 0 if wrong; E = expected score
 */
export function calculateNewElo(
  studentElo: number,
  questionDifficulty: number,
  isCorrect: boolean,
  K: number = K_FACTOR
): number {
  const expectedScore = calculateExpectedScore(studentElo, questionDifficulty);
  const actualScore = isCorrect ? 1 : 0;
  const eloChange = K * (actualScore - expectedScore);
  const newElo = studentElo + eloChange;

  // Ensure Elo never goes below 0
  return Math.max(0, Math.round(newElo * 100) / 100);
}

// ============================================================================
// STUDENT ELO MANAGEMENT
// ============================================================================

/**
 * Get default Elo ratings for a new student
 * Can accept an exam type to determine which subjects to initialize
 */
export function getDefaultEloRatings(
  examOrSubjects?: ExamType | string[]
): EloRatings {
  let keys: string[];
  if (Array.isArray(examOrSubjects)) {
    keys = examOrSubjects.map(s => s.toLowerCase().replace(/\s+/g, ''));
  } else if (examOrSubjects && EXAM_ELO_KEYS[examOrSubjects]) {
    keys = EXAM_ELO_KEYS[examOrSubjects];
  } else {
    keys = ['physics', 'chemistry', 'mathematics'];
  }
  const ratings: EloRatings = { overall: DEFAULT_ELO };
  for (const key of keys) {
    ratings[key] = DEFAULT_ELO;
  }
  return ratings;
}

/**
 * Calculate weighted average of subject Elos
 * Equal weights for all subjects (excluding overall)
 */
function calculateOverallElo(ratings: EloRatings): number {
  const keys = Object.keys(ratings).filter(k => k !== 'overall');
  if (keys.length === 0) return DEFAULT_ELO;
  const sum = keys.reduce((s, k) => s + ratings[k], 0);
  return Math.round((sum / keys.length) * 100) / 100;
}

/**
 * Update a student's Elo rating for a specific subject
 * Returns new ratings and the change information
 */
export function updateStudentElo(
  currentRatings: EloRatings,
  subject: string,
  questionDifficulty: number,
  isCorrect: boolean
): { ratings: EloRatings; update: EloUpdate } {
  const subjectKey = subject.toLowerCase().replace(/\s+/g, '');

  const previousElo = currentRatings[subjectKey] ?? DEFAULT_ELO;
  const newElo = calculateNewElo(previousElo, questionDifficulty, isCorrect);
  const change = Math.round((newElo - previousElo) * 100) / 100;

  const updatedRatings: EloRatings = {
    ...currentRatings,
    [subjectKey]: newElo,
  };
  updatedRatings.overall = calculateOverallElo(updatedRatings);

  const update: EloUpdate = {
    previousElo,
    newElo,
    change,
    subject: subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase(),
  };

  return { ratings: updatedRatings, update };
}

// ============================================================================
// DIFFICULTY TARGETING
// ============================================================================

/**
 * Convert difficulty level to Elo rating
 */
export function difficultyToElo(difficulty: string): number {
  const normalizedDifficulty =
    difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
  const elo = DIFFICULTY_ELO_MAP[normalizedDifficulty];

  if (elo === undefined) {
    throw new Error(
      `Invalid difficulty: ${difficulty}. Must be Easy, Medium, Tough, or Very Tough.`
    );
  }

  return elo;
}

/**
 * Get target difficulty for a student to achieve 70% success rate
 * Target Elo = Student Elo - 146 (empirically derived for 70% success)
 */
export function getTargetDifficulty(studentElo: number): DifficultyTarget {
  const targetElo = studentElo - ELO_OFFSET_FOR_TARGET;

  // Map target Elo to difficulty level
  let recommendedDifficulty: 'Easy' | 'Medium' | 'Tough' | 'Very Tough';

  if (targetElo < 950) {
    recommendedDifficulty = 'Easy';
  } else if (targetElo < 1150) {
    recommendedDifficulty = 'Medium';
  } else if (targetElo < 1350) {
    recommendedDifficulty = 'Tough';
  } else {
    recommendedDifficulty = 'Very Tough';
  }

  return {
    targetElo: Math.round(targetElo * 100) / 100,
    recommendedDifficulty,
    subject: 'General',
  };
}

/**
 * Get target difficulty for a specific subject
 */
export function getTargetDifficultyBySubject(
  studentRatings: EloRatings,
  subject: string
): DifficultyTarget {
  const subjectKey = subject.toLowerCase().replace(/\s+/g, '');
  const subjectElo = studentRatings[subjectKey] ?? DEFAULT_ELO;
  const target = getTargetDifficulty(subjectElo);

  return {
    ...target,
    subject: subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase(),
  };
}

// ============================================================================
// WEAKNESS DETECTION & ANALYTICS
// ============================================================================

/**
 * Analyze student strengths and weaknesses across subjects
 * Provides actionable recommendations based on Elo gaps
 */
export function getWeaknessDetection(ratings: EloRatings): WeaknessAnalysis {
  const subjectElos = Object.entries(ratings)
    .filter(([key]) => key !== 'overall')
    .map(([subject, elo]) => ({
      subject: subject.charAt(0).toUpperCase() + subject.slice(1),
      elo,
    }));

  if (subjectElos.length === 0) {
    return { weakest: 'N/A', strongest: 'N/A', gap: 0, recommendation: 'Take your first test to calibrate!' };
  }

  subjectElos.sort((a, b) => b.elo - a.elo);
  const strongest = subjectElos[0];
  const weakest = subjectElos[subjectElos.length - 1];
  const gap = Math.round((strongest.elo - weakest.elo) * 100) / 100;

  let recommendation: string;
  if (gap > 200) {
    recommendation = `Focus heavily on ${weakest.subject}! There's a significant gap between your skills.`;
  } else if (gap > 100) {
    recommendation = `Spend extra time on ${weakest.subject} to bridge the gap with your stronger subjects.`;
  } else {
    recommendation = 'Well balanced! Keep it up and continue improving across all subjects.';
  }

  return {
    weakest: weakest.subject,
    strongest: strongest.subject,
    gap,
    recommendation,
  };
}

/**
 * Get proficiency level and color coding for an Elo rating
 */
export function eloToTier(elo: number): TierInfo {
  for (const boundary of TIER_BOUNDARIES) {
    if (elo >= boundary.min) {
      return {
        tier: boundary.tier,
        color: boundary.color,
        emoji: boundary.emoji,
      };
    }
  }

  // Fallback (shouldn't reach here)
  return {
    tier: 'Bronze',
    color: '#CD7F32',
    emoji: '🥉',
  };
}

/**
 * Get tier information for all subjects in a rating set
 */
export function getTiersForAllSubjects(
  ratings: EloRatings
): Record<string, TierInfo> {
  const result: Record<string, TierInfo> = {};
  for (const [key, elo] of Object.entries(ratings)) {
    result[key] = eloToTier(elo);
  }
  return result;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate expected probability of getting next question correct
 * based on current Elo and question difficulty
 */
export function getSuccessProbability(
  studentElo: number,
  questionDifficulty: number
): number {
  return Math.round(calculateExpectedScore(studentElo, questionDifficulty) * 10000) / 100;
}

/**
 * Validate if an Elo rating is within reasonable bounds
 */
export function isValidElo(elo: number): boolean {
  return typeof elo === 'number' && elo >= 0 && elo <= 3000;
}

/**
 * Validate EloRatings object structure
 */
export function isValidEloRatings(ratings: unknown): ratings is EloRatings {
  if (typeof ratings !== 'object' || ratings === null) return false;
  const obj = ratings as Record<string, unknown>;
  if (typeof obj.overall !== 'number') return false;
  return Object.values(obj).every(v => typeof v === 'number' && isValidElo(v as number));
}

/**
 * Calculate Elo rating progression estimate
 * How many questions at target difficulty needed to reach a goal
 */
export function estimateQuestionsNeeded(
  currentElo: number,
  targetElo: number,
  successRate: number = TARGET_SUCCESS_RATE,
  K: number = K_FACTOR
): number {
  if (currentElo === targetElo) return 0;

  const direction = targetElo > currentElo ? 1 : -1;
  const eloGap = Math.abs(targetElo - currentElo);

  // Estimate based on average Elo change per question
  const expectedChangePerQuestion = K * (successRate - 0.5);

  if (expectedChangePerQuestion === 0) return Infinity;

  return Math.ceil(eloGap / expectedChangePerQuestion);
}
