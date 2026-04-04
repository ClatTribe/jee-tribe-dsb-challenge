import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Crown, ArrowRight } from 'lucide-react';
import { usePaywall } from '../hooks/usePaywall';

export default function PaywallOverlay() {
  const { isLocked, RAZORPAY_LINK } = usePaywall();

  if (!isLocked) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 25 }}
        className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-slate-200 dark:border-slate-700"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
          <Lock size={36} className="text-white" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
          Upgrade to PrepTribe Pro
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Your 2-day free trial has ended. Unlock all features — unlimited practice, duels, flashcards, and more.
        </p>

        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 mb-6 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Crown size={20} className="text-amber-500" />
            <span className="text-3xl font-black text-slate-900 dark:text-white">₹99</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">One-time payment • Lifetime access</p>
        </div>

        <a
          href={RAZORPAY_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-lg uppercase tracking-wider hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
        >
          <Crown size={20} /> Upgrade Now <ArrowRight size={20} />
        </a>
      </motion.div>
    </motion.div>
  );
}
