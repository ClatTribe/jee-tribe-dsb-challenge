import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

const RAZORPAY_LINK = 'https://pages.razorpay.com/preptribe';
const FREE_TRIAL_DAYS = 2;

export function usePaywall() {
  const { profile } = useAuth();

  const { isLocked, daysLeft, isPremium, trialExpired } = useMemo(() => {
    if (!profile) return { isLocked: false, daysLeft: 0, isPremium: false, trialExpired: false };

    // Premium users are never locked
    if (profile.isPremium) return { isLocked: false, daysLeft: 0, isPremium: true, trialExpired: false };

    // Admin users are never locked
    if (profile.role === 'admin') return { isLocked: false, daysLeft: 0, isPremium: true, trialExpired: false };

    // Calculate days since signup
    const createdAt = profile.createdAt ? new Date(profile.createdAt) : new Date();
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const daysSinceSignup = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, FREE_TRIAL_DAYS - daysSinceSignup);
    const trialExpired = daysSinceSignup >= FREE_TRIAL_DAYS;

    return { isLocked: trialExpired, daysLeft, isPremium: false, trialExpired };
  }, [profile]);

  return { isLocked, daysLeft, isPremium, trialExpired, RAZORPAY_LINK };
}
