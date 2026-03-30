/**
 * Gamification Service for PrepTribe
 * Handles Mystery Box, Streak Multiplier, and Lucky Question logic
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface MysteryBoxReward {
  type: 'coins' | 'streak_shield';
  amount: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  message: string;
}

export interface StreakMultiplierInfo {
  multiplier: number;
  label: string;
  nextTier: {
    days: number;
    multiplier: number;
  } | null;
}

export interface CoinCalculationBreakdown {
  base: number;
  streakBonus: number;
  luckyBonus: number;
  multiplierLabel: string;
}

export interface CoinCalculationResult {
  total: number;
  breakdown: CoinCalculationBreakdown;
}

// ============================================================================
// MYSTERY BOX
// ============================================================================

/**
 * Weighted reward table for Mystery Box
 * Chance values should sum to 100
 */
interface MysteryBoxRewardEntry {
  type: 'coins' | 'streak_shield';
  amount: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  chance: number;
  message: string;
}

const MYSTERY_BOX_REWARDS: MysteryBoxRewardEntry[] = [
  {
    type: 'coins',
    amount: 50,
    rarity: 'common',
    chance: 40,
    message: 'Coins mil gaye! 🪙',
  },
  {
    type: 'coins',
    amount: 100,
    rarity: 'uncommon',
    chance: 25,
    message: 'Arre waah, achha loot! 💰',
  },
  {
    type: 'coins',
    amount: 200,
    rarity: 'rare',
    chance: 15,
    message: 'Jackpot vibes! 🎉',
  },
  {
    type: 'coins',
    amount: 300,
    rarity: 'epic',
    chance: 10,
    message: 'EPIC DROP! Bahut badhiya! 🌟',
  },
  {
    type: 'coins',
    amount: 500,
    rarity: 'epic',
    chance: 8,
    message: 'EPIC DROP! Bahut badhiya! 🌟',
  },
  {
    type: 'streak_shield',
    amount: 1,
    rarity: 'legendary',
    chance: 2,
    message: 'LEGENDARY! Streak Shield mil gaya — ab streak safe hai! 🛡️🔥',
  },
];

/**
 * Checks if Mystery Box should be shown for the given question count
 * Triggers every 10th question
 */
export function shouldShowMysteryBox(totalQuestionsAttempted: number): boolean {
  return totalQuestionsAttempted > 0 && totalQuestionsAttempted % 10 === 0;
}

/**
 * Opens a Mystery Box and returns a random reward based on weighted distribution
 */
export function openMysteryBox(): MysteryBoxReward {
  const random = Math.random() * 100;
  let cumulativeChance = 0;

  for (const reward of MYSTERY_BOX_REWARDS) {
    cumulativeChance += reward.chance;
    if (random <= cumulativeChance) {
      return {
        type: reward.type,
        amount: reward.amount,
        rarity: reward.rarity,
        message: reward.message,
      };
    }
  }

  // Fallback (should never reach here if probabilities sum to 100)
  return {
    type: 'coins',
    amount: 50,
    rarity: 'common',
    message: 'Coins mil gaye! 🪙',
  };
}

// ============================================================================
// STREAK MULTIPLIER
// ============================================================================

interface StreakTier {
  minDays: number;
  maxDays: number;
  multiplier: number;
  label: string;
}

const STREAK_TIERS: StreakTier[] = [
  {
    minDays: 0,
    maxDays: 6,
    multiplier: 1,
    label: 'No Streak Bonus',
  },
  {
    minDays: 7,
    maxDays: 13,
    multiplier: 1.5,
    label: '7-Day Streak: 1.5x',
  },
  {
    minDays: 14,
    maxDays: 29,
    multiplier: 1.75,
    label: '14-Day Streak: 1.75x',
  },
  {
    minDays: 30,
    maxDays: 99,
    multiplier: 2,
    label: '30-Day Streak: 2x',
  },
  {
    minDays: 100,
    maxDays: Infinity,
    multiplier: 3,
    label: '100-Day Streak: 3x',
  },
];

/**
 * Gets the streak multiplier and info based on current streak days
 */
export function getStreakMultiplier(
  currentStreak: number
): StreakMultiplierInfo {
  // Find current tier
  let currentTier = STREAK_TIERS[0];
  for (const tier of STREAK_TIERS) {
    if (
      currentStreak >= tier.minDays &&
      currentStreak <= tier.maxDays
    ) {
      currentTier = tier;
      break;
    }
  }

  // Find next tier
  let nextTier: { days: number; multiplier: number } | null = null;
  for (const tier of STREAK_TIERS) {
    if (tier.minDays > currentStreak) {
      nextTier = {
        days: tier.minDays,
        multiplier: tier.multiplier,
      };
      break;
    }
  }

  return {
    multiplier: currentTier.multiplier,
    label: currentTier.label,
    nextTier,
  };
}

// ============================================================================
// LUCKY QUESTION
// ============================================================================

const LUCKY_QUESTION_CHANCE = 0.05; // 5%
const LUCKY_QUESTION_MULTIPLIER = 5;

/**
 * Determines if the current question is a Lucky Question
 * 5% chance to return true
 */
export function isLuckyQuestion(): boolean {
  return Math.random() < LUCKY_QUESTION_CHANCE;
}

/**
 * Gets the multiplier for Lucky Questions
 */
export function getLuckyQuestionMultiplier(): number {
  return LUCKY_QUESTION_MULTIPLIER;
}

// ============================================================================
// COIN CALCULATION
// ============================================================================

/**
 * Calculates total coins earned with streak bonus and lucky question bonus
 * Formula:
 *   1. Base coins × Streak Multiplier = Streak-boosted coins
 *   2. If Lucky: Streak-boosted coins × Lucky Multiplier = Total
 *   3. Otherwise: Streak-boosted coins = Total
 */
export function calculateCoinsEarned(
  baseCoins: number,
  currentStreak: number,
  isLucky: boolean
): CoinCalculationResult {
  // Get streak multiplier
  const streakInfo = getStreakMultiplier(currentStreak);
  const streakMultiplier = streakInfo.multiplier;

  // Calculate coins
  const streakBoostedCoins = baseCoins * streakMultiplier;
  const luckyMultiplier = isLucky ? LUCKY_QUESTION_MULTIPLIER : 1;
  const total = Math.round(streakBoostedCoins * luckyMultiplier);

  // Calculate breakdown
  const streakBonus = Math.round(
    streakBoostedCoins - baseCoins
  );
  const luckyBonus = isLucky
    ? Math.round(streakBoostedCoins * (luckyMultiplier - 1))
    : 0;

  const breakdown: CoinCalculationBreakdown = {
    base: baseCoins,
    streakBonus,
    luckyBonus,
    multiplierLabel: streakInfo.label,
  };

  return {
    total,
    breakdown,
  };
}
