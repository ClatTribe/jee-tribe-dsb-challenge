import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { PsycheAnalysis } from '../services/psycheService';

interface PsycheBannerProps {
  analysis: PsycheAnalysis | null;
  onDismiss?: () => void;
}

const stateConfig: Record<string, { bg: string; border: string; textColor: string }> = {
  demotivation: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', textColor: 'text-blue-400' },
  anxiety: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', textColor: 'text-rose-400' },
  overconfidence: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', textColor: 'text-orange-400' },
  burnout: { bg: 'bg-red-500/10', border: 'border-red-500/20', textColor: 'text-red-400' },
  flow: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', textColor: 'text-emerald-400' },
};

const PsycheBanner: React.FC<PsycheBannerProps> = ({ analysis, onDismiss }) => {
  const [expanded, setExpanded] = useState(false);

  if (!analysis || !analysis.interventionNeeded) return null;

  const dominant = analysis.dominantState;
  const config = stateConfig[dominant.state] || stateConfig.flow;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`${config.bg} border ${config.border} rounded-2xl p-4 relative`}
      >
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
          >
            <X size={12} />
          </button>
        )}

        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center shrink-0 border ${config.border}`}>
            <span className="text-xl">{dominant.emoji}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-black text-sm ${config.textColor} capitalize`}>
                {dominant.state === 'flow' ? 'In the Zone!' : `${dominant.state} Detected`}
              </h4>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${config.bg} ${config.textColor} border ${config.border}`}>
                {Math.round(dominant.score * 100)}%
              </span>
            </div>

            {analysis.intervention && (
              <p className="text-sm text-slate-300 font-medium leading-relaxed">
                {analysis.intervention}
              </p>
            )}

            {/* Expandable signals */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-2 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? 'Hide signals' : `${dominant.signals.length} signals detected`}
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 space-y-1"
                >
                  {dominant.signals.map((signal, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${config.textColor.replace('text-', 'bg-')}`} />
                      <span className="text-xs text-slate-400 font-medium">{signal}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mini state bars */}
        <div className="flex gap-1 mt-3">
          {analysis.allStates
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map((state, i) => {
              const sc = stateConfig[state.state] || stateConfig.flow;
              return (
                <div key={i} className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[8px] font-bold text-slate-500 capitalize">{state.emoji} {state.state}</span>
                    <span className="text-[8px] font-bold text-slate-500">{Math.round(state.score * 100)}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${sc.textColor.replace('text-', 'bg-')}`}
                      style={{ width: `${state.score * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PsycheBanner;
