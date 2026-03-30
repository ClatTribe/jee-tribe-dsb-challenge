import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  graceDaysUsed: number;       // out of 2 per month
  graceDaysResetMonth: string;  // "2026-03" format
  streakFreezeAvailable: number; // bought with coins
  lastActiveDate: string;
  totalActiveDays: number;
}

const MAX_GRACE_DAYS_PER_MONTH = 2;
const STREAK_FREEZE_COST = 50; // coins

/**
 * Smart Streak Logic:
 * - Normal: active yesterday → streak +1
 * - Grace Day: missed 1 day but grace days available → streak preserved
 * - Streak Freeze: missed but had a freeze → streak preserved (consume freeze)
 * - Otherwise: streak resets to 1
 */
export const updateStreakSmart = async (userId: string): Promise<{
  newStreak: number;
  graceDayUsed: boolean;
  freezeUsed: boolean;
  streakReset: boolean;
}> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  if (!userData) throw new Error('User not found');

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7); // "2026-03"
  const lastActive = userData.lastActiveDate;

  // Already active today
  if (lastActive === today) {
    return { newStreak: userData.currentStreak || 1, graceDayUsed: false, freezeUsed: false, streakReset: false };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

  let graceDaysUsed = userData.graceDaysUsed || 0;
  let graceDaysResetMonth = userData.graceDaysResetMonth || currentMonth;
  let streakFreezeAvailable = userData.streakFreezeAvailable || 0;
  let currentStreak = userData.currentStreak || 0;
  let longestStreak = userData.longestStreak || 0;

  // Reset grace days counter each month
  if (graceDaysResetMonth !== currentMonth) {
    graceDaysUsed = 0;
    graceDaysResetMonth = currentMonth;
  }

  let graceDayUsed = false;
  let freezeUsed = false;
  let streakReset = false;

  if (lastActive === yesterdayStr) {
    // Normal continuation — active yesterday
    currentStreak += 1;
  } else if (lastActive === twoDaysAgoStr) {
    // Missed exactly 1 day — try grace day first, then freeze
    if (graceDaysUsed < MAX_GRACE_DAYS_PER_MONTH) {
      graceDaysUsed += 1;
      currentStreak += 1; // Preserve and increment
      graceDayUsed = true;
    } else if (streakFreezeAvailable > 0) {
      streakFreezeAvailable -= 1;
      currentStreak += 1;
      freezeUsed = true;
    } else {
      currentStreak = 1;
      streakReset = true;
    }
  } else {
    // Missed 2+ days — streak resets
    currentStreak = 1;
    streakReset = true;
  }

  // Update longest streak
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  await updateDoc(userRef, {
    currentStreak,
    longestStreak,
    graceDaysUsed,
    graceDaysResetMonth,
    streakFreezeAvailable,
    lastActiveDate: today,
    totalActiveDays: increment(1),
  });

  return { newStreak: currentStreak, graceDayUsed, freezeUsed, streakReset };
};

/**
 * Buy a streak freeze with coins
 */
export const buyStreakFreeze = async (userId: string): Promise<boolean> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  if (!userData) return false;

  const coins = userData.coins || 0;
  if (coins < STREAK_FREEZE_COST) return false;

  await updateDoc(userRef, {
    coins: increment(-STREAK_FREEZE_COST),
    streakFreezeAvailable: increment(1),
  });

  return true;
};

/**
 * Get streak info for display
 */
export const getStreakInfo = async (userId: string): Promise<StreakData> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  const currentMonth = new Date().toISOString().split('T')[0].substring(0, 7);
  let graceDaysUsed = userData?.graceDaysUsed || 0;

  // Reset if month changed
  if (userData?.graceDaysResetMonth !== currentMonth) {
    graceDaysUsed = 0;
  }

  return {
    currentStreak: userData?.currentStreak || 0,
    longestStreak: userData?.longestStreak || 0,
    graceDaysUsed,
    graceDaysResetMonth: currentMonth,
    streakFreezeAvailable: userData?.streakFreezeAvailable || 0,
    lastActiveDate: userData?.lastActiveDate || '',
    totalActiveDays: userData?.totalActiveDays || 0,
  };
};
