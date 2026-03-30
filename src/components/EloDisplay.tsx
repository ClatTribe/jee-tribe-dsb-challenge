import React from 'react';
import { motion } from 'framer-motion';
import { EloRatings, eloToTier, getWeaknessDetection } from '../services/eloService';

interface EloDisplayProps {
  ratings: EloRatings;
  compact?: boolean;
}

const EloDisplay: React.FC<EloDisplayProps> = ({ ratings, compact = false }) => {
  const subjects = Object.entries(ratings)
    .filter(([key]) => key !== 'overall')
    .map(([key, elo]) => ({
      key,
      label: key === 'generaltest' ? 'General Test' : key.charAt(0).toUpperCase() + key.slice(1),
      elo,
    }));

  const overallTier = eloToTier(ratings.overall);
  const weakness = getWeaknessDetection(ratings);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-lg">{overallTier.emoji}</span>
        <div>
          <p className="text-xs font-black text-white">{overallTier.tier}</p>
          <p className="text-[9px] font-bold text-slate-500">{Math.round(ratings.overall)} Elo</p>
        </div>
      </div>
    );
  }

  const isDefault = subjects.every(s => s.elo === 1200);

  return (
    <div className="bg-[#060818] rounded-2xl p-5 border border-amber-500/10">
      {/* Overall */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{overallTier.emoji}</span>
          <div>
            <h4 className="font-black text-white text-sm">Skill Rating</h4>
            <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest">{overallTier.tier} Tier</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-amber-500">
            {Math.round(ratings.overall)}
          </p>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Overall Elo</p>
        </div>
      </div>

      {/* Subject bars */}
      <div className="space-y-3">
        {subjects.map((subj, i) => {
          const tier = eloToTier(subj.elo);
          const progress = Math.min((subj.elo / 2000) * 100, 100);

          return (
            <motion.div
              key={subj.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-400">{tier.emoji} {subj.label}</span>
                <span className="text-xs font-black text-white">{Math.round(subj.elo)}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Weakness insight / New user prompt */}
      <div className="mt-4 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
        {isDefault ? (
          <p className="text-xs text-amber-400 font-medium">Take your first Daily Mock to calibrate your Skill Rating across all subjects!</p>
        ) : (
          <>
            <p className="text-xs text-slate-400 font-medium">{weakness.recommendation}</p>
            {weakness.gap > 50 && (
              <p className="text-[10px] text-slate-500 font-bold mt-1">
                Gap: {Math.round(weakness.gap)} Elo between {weakness.strongest} and {weakness.weakest}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EloDisplay;
