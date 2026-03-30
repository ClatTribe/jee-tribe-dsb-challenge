import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';
import { PredictedAIR } from '../services/airPredictionService';

interface PredictedAIRCardProps {
  airData: PredictedAIR;
  compact?: boolean;
}

const PredictedAIRCard: React.FC<PredictedAIRCardProps> = ({ airData, compact = false }) => {
  const trendIcon = airData.trend === 'improving'
    ? <TrendingUp size={16} className="text-emerald-500" />
    : airData.trend === 'declining'
      ? <TrendingDown size={16} className="text-rose-500" />
      : <Minus size={16} className="text-slate-400" />;

  const trendColor = airData.trend === 'improving'
    ? 'text-emerald-500'
    : airData.trend === 'declining'
      ? 'text-rose-500'
      : 'text-slate-400';

  const rankFormatted = airData.predictedRank.toLocaleString('en-IN');
  const rangeLow = airData.rankRange.low.toLocaleString('en-IN');
  const rangeHigh = airData.rankRange.high.toLocaleString('en-IN');

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
            <Award size={20} className="text-violet-500" />
          </div>
          <div>
            <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Predicted AIR</p>
            <p className="text-lg font-black text-white">{rankFormatted}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400">{airData.percentile}%ile</p>
          <div className={`flex items-center gap-1 ${trendColor} text-xs font-bold`}>
            {trendIcon}
            <span>{airData.trend}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#060818] rounded-2xl p-6 border border-white/10 relative overflow-hidden"
    >
      {/* Decorative glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
              <Award size={20} className="text-violet-500" />
            </div>
            <div>
              <h4 className="font-black text-white text-sm">Predicted All India Rank</h4>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Based on your performance</p>
            </div>
          </div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
            airData.trend === 'improving' ? 'bg-emerald-500/10 text-emerald-400' :
            airData.trend === 'declining' ? 'bg-rose-500/10 text-rose-400' :
            'bg-slate-500/10 text-slate-400'
          } text-xs font-bold`}>
            {trendIcon}
            <span className="capitalize">{airData.trend}</span>
          </div>
        </div>

        {/* Main rank display */}
        <div className="text-center py-4">
          <p className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
            #{rankFormatted}
          </p>
          <p className="text-xs text-slate-500 font-bold mt-2">
            Range: {rangeLow} - {rangeHigh}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Percentile</p>
            <p className="text-lg font-black text-white">{airData.percentile}%</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Score /300</p>
            <p className="text-lg font-black text-amber-400">{airData.normalizedScore}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Category</p>
            <p className="text-sm font-black text-white">{airData.category.split(' ')[0]}</p>
          </div>
        </div>

        {/* Category badge */}
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full text-sm font-black text-violet-400">
            {airData.category}
          </span>
        </div>

        {/* Previous rank comparison */}
        {airData.previousRank && (
          <div className="mt-3 text-center">
            <p className="text-xs text-slate-500 font-bold">
              Previous: #{airData.previousRank.toLocaleString('en-IN')}
              {airData.previousRank > airData.predictedRank && (
                <span className="text-emerald-400 ml-2">
                  {(airData.previousRank - airData.predictedRank).toLocaleString('en-IN')} ranks up!
                </span>
              )}
              {airData.previousRank < airData.predictedRank && (
                <span className="text-rose-400 ml-2">
                  {(airData.predictedRank - airData.previousRank).toLocaleString('en-IN')} ranks down
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PredictedAIRCard;
