import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Coins, Shield, X, Sparkles } from 'lucide-react';
import { MysteryBoxReward, openMysteryBox } from '../services/gamificationService';

interface MysteryBoxModalProps {
  isOpen: boolean;
  onClose: (reward: MysteryBoxReward | null) => void;
}

const rarityColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: 'bg-slate-500/20', border: 'border-slate-400/30', text: 'text-slate-300', glow: '' },
  uncommon: { bg: 'bg-emerald-500/20', border: 'border-emerald-400/30', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
  rare: { bg: 'bg-blue-500/20', border: 'border-blue-400/30', text: 'text-blue-400', glow: 'shadow-blue-500/30' },
  epic: { bg: 'bg-purple-500/20', border: 'border-purple-400/30', text: 'text-purple-400', glow: 'shadow-purple-500/30' },
  legendary: { bg: 'bg-amber-500/20', border: 'border-amber-400/30', text: 'text-amber-400', glow: 'shadow-amber-500/40' },
};

const MysteryBoxModal: React.FC<MysteryBoxModalProps> = ({ isOpen, onClose }) => {
  const [phase, setPhase] = useState<'opening' | 'revealed'>('opening');
  const [reward, setReward] = useState<MysteryBoxReward | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPhase('opening');
      setReward(null);
      // Reveal after animation
      const timer = setTimeout(() => {
        const r = openMysteryBox();
        setReward(r);
        setPhase('revealed');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const colors = reward ? rarityColors[reward.rarity] : rarityColors.common;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={() => phase === 'revealed' && onClose(reward)}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="relative w-full max-w-sm"
          onClick={e => e.stopPropagation()}
        >
          {/* Opening Phase */}
          {phase === 'opening' && (
            <motion.div
              className="bg-[#060818] rounded-3xl p-8 text-center border border-white/10"
              animate={{ rotate: [0, -2, 2, -2, 0], scale: [1, 1.05, 1, 1.05, 1] }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            >
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/30 mb-6"
              >
                <Gift size={48} className="text-white" />
              </motion.div>
              <h3 className="text-2xl font-display font-black text-white mb-2">Mystery Box!</h3>
              <p className="text-sm text-slate-400 font-bold">Opening...</p>
              <div className="flex justify-center gap-1 mt-4">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}

          {/* Revealed Phase */}
          {phase === 'revealed' && reward && (
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={`bg-[#060818] rounded-3xl p-8 text-center border ${colors.border} shadow-2xl ${colors.glow}`}
            >
              <button
                onClick={() => onClose(reward)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              {/* Sparkles */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute top-6 left-6 text-amber-500/30"
              >
                <Sparkles size={20} />
              </motion.div>

              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className={`w-20 h-20 mx-auto ${colors.bg} rounded-3xl flex items-center justify-center mb-4 border ${colors.border}`}
              >
                {reward.type === 'coins' ? (
                  <Coins size={40} className={colors.text} />
                ) : (
                  <Shield size={40} className={colors.text} />
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className={`text-[10px] font-black uppercase tracking-widest ${colors.text} mb-2`}>
                  {reward.rarity}
                </p>
                <h3 className="text-3xl font-display font-black text-white mb-1">
                  {reward.type === 'coins' ? `+${reward.amount}` : 'Streak Shield'}
                </h3>
                <p className="text-sm text-slate-400 font-bold mb-1">
                  {reward.type === 'coins' ? 'Coins' : 'Free Streak Freeze'}
                </p>
                <p className="text-base font-bold text-white/80 mt-4">
                  {reward.message}
                </p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => onClose(reward)}
                className="mt-6 px-8 py-3 bg-amber-500 text-white rounded-xl font-black text-sm hover:bg-amber-600 transition-colors active:scale-95"
              >
                Collect!
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MysteryBoxModal;
