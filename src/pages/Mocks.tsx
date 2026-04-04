import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EXAM_CONFIGS } from '../services/examConfig';
import { motion } from 'framer-motion';
import { Target, Skull, Zap, Swords, Map, ArrowRight } from 'lucide-react';

interface MockCard {
  id: string;
  emoji: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  route: string;
  theme: 'amber' | 'red' | 'orange' | 'purple' | 'green';
  featured?: boolean;
}

const Mocks = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Get exam-specific label for Daily Mini Mock
  const examConfig = profile?.exam ? EXAM_CONFIGS[profile.exam] : EXAM_CONFIGS['JEE'];
  const dailyMockLabel = examConfig.mockTitle || 'Daily Mini Mock';

  const mockCards: MockCard[] = [
    {
      id: 'daily-mini-mock',
      emoji: '🎯',
      icon: <Target size={28} />,
      title: dailyMockLabel,
      subtitle: '12 Questions • 30 Minutes',
      description: 'Your daily competitive challenge',
      route: '/test/daily-mini-mock',
      theme: 'amber',
      featured: true,
    },
    {
      id: 'sudden-death',
      emoji: '💀',
      icon: <Skull size={28} />,
      title: 'Sudden Death',
      subtitle: '1 Wrong = Game Over',
      description: 'Test your accuracy under pressure',
      route: '/sudden-death',
      theme: 'red',
    },
    {
      id: 'skip-strategy',
      emoji: '⚡',
      icon: <Zap size={28} />,
      title: 'Skip or Solve',
      subtitle: '15 Seconds per Question',
      description: 'Identify traps and save time',
      route: '/skip-strategy',
      theme: 'orange',
    },
    {
      id: 'duels',
      emoji: '⚔️',
      icon: <Swords size={28} />,
      title: 'Duels',
      subtitle: '1v1 Live Battles',
      description: 'Challenge friends or random opponents',
      route: '/duels',
      theme: 'purple',
    },
    {
      id: 'mastery-map',
      emoji: '🗺️',
      icon: <Map size={28} />,
      title: 'Topic Mastery Map',
      subtitle: 'Track your strengths',
      description: 'Visual skill tree for all subjects',
      route: '/mastery-map',
      theme: 'green',
    },
  ];

  const getThemeClasses = (theme: string) => {
    const themes: Record<string, { border: string; bg: string; glow: string; hover: string; icon: string; subtitle: string; leftBorder: string }> = {
      amber: {
        border: 'border-amber-200 dark:border-amber-500/30',
        bg: 'bg-white dark:bg-amber-500/5',
        glow: 'shadow-amber-100 dark:shadow-amber-500/20',
        hover: 'hover:border-amber-300 dark:hover:border-amber-500/50 hover:shadow-xl hover:scale-105',
        icon: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
        subtitle: 'text-amber-600 dark:text-amber-300',
        leftBorder: 'border-l-4 border-l-amber-500 dark:border-l-amber-400',
      },
      red: {
        border: 'border-red-200 dark:border-red-500/30',
        bg: 'bg-white dark:bg-red-500/5',
        glow: 'shadow-red-100 dark:shadow-red-500/20',
        hover: 'hover:border-red-300 dark:hover:border-red-500/50 hover:shadow-xl hover:scale-105',
        icon: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
        subtitle: 'text-red-600 dark:text-red-300',
        leftBorder: 'border-l-4 border-l-red-500 dark:border-l-red-400',
      },
      orange: {
        border: 'border-orange-200 dark:border-orange-500/30',
        bg: 'bg-white dark:bg-orange-500/5',
        glow: 'shadow-orange-100 dark:shadow-orange-500/20',
        hover: 'hover:border-orange-300 dark:hover:border-orange-500/50 hover:shadow-xl hover:scale-105',
        icon: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
        subtitle: 'text-orange-600 dark:text-orange-300',
        leftBorder: 'border-l-4 border-l-orange-500 dark:border-l-orange-400',
      },
      purple: {
        border: 'border-purple-200 dark:border-purple-500/30',
        bg: 'bg-white dark:bg-purple-500/5',
        glow: 'shadow-purple-100 dark:shadow-purple-500/20',
        hover: 'hover:border-purple-300 dark:hover:border-purple-500/50 hover:shadow-xl hover:scale-105',
        icon: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
        subtitle: 'text-purple-600 dark:text-purple-300',
        leftBorder: 'border-l-4 border-l-purple-500 dark:border-l-purple-400',
      },
      green: {
        border: 'border-green-200 dark:border-green-500/30',
        bg: 'bg-white dark:bg-green-500/5',
        glow: 'shadow-green-100 dark:shadow-green-500/20',
        hover: 'hover:border-green-300 dark:hover:border-green-500/50 hover:shadow-xl hover:scale-105',
        icon: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400',
        subtitle: 'text-green-600 dark:text-green-300',
        leftBorder: 'border-l-4 border-l-green-500 dark:border-l-green-400',
      },
    };
    return themes[theme];
  };

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  // Separate featured and regular cards
  const featuredCard = mockCards.find(c => c.featured);
  const regularCards = mockCards.filter(c => !c.featured);

  // Stagger animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const cardHoverVariants = {
    hover: {
      scale: 1.02,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  return (
    <div className="px-4 py-4 md:py-8">
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 md:mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            Mocks & Challenges
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Choose your battle mode and push your limits
          </p>
        </motion.div>

        {/* Featured Card - Daily Mini Mock */}
        {featuredCard && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 md:mb-8"
          >
            <motion.button
              variants={cardHoverVariants}
              whileHover="hover"
              onClick={() => handleCardClick(featuredCard.route)}
              className={`w-full p-6 md:p-8 rounded-2xl border-2 transition-all cursor-pointer group relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/5 ${getThemeClasses(featuredCard.theme).border} hover:shadow-2xl dark:hover:shadow-amber-500/10 ${getThemeClasses(featuredCard.theme).glow} hover:border-amber-300 dark:hover:border-amber-500/50`}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* TODAY Badge */}
              <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                TODAY
              </div>

              <div className="relative z-10 flex items-start gap-6 md:gap-8">
                {/* Icon */}
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center flex-shrink-0 ${getThemeClasses(featuredCard.theme).icon}`}>
                  <span className="text-4xl md:text-5xl">{featuredCard.emoji}</span>
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-1">
                    {featuredCard.title}
                  </h2>
                  <p className="text-amber-600 dark:text-amber-300 font-bold text-sm md:text-base mb-2">
                    {featuredCard.subtitle}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
                    {featuredCard.description}
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white dark:from-amber-500 dark:to-orange-600 flex-shrink-0 group-hover:shadow-lg group-hover:scale-110 transition-all">
                  <ArrowRight size={24} strokeWidth={3} />
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* Regular Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {regularCards.map((card) => {
            const themeClasses = getThemeClasses(card.theme);
            return (
              <motion.button
                key={card.id}
                variants={itemVariants}
                whileHover="hover"
                onClick={() => handleCardClick(card.route)}
                className={`p-4 md:p-5 rounded-2xl border-2 transition-all cursor-pointer group relative overflow-hidden text-left ${themeClasses.border} ${themeClasses.bg} ${themeClasses.leftBorder} hover:shadow-xl ${themeClasses.glow} ${themeClasses.hover}`}
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br from-${card.theme}-500/0 via-${card.theme}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="relative z-10 flex flex-col gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${themeClasses.icon}`}>
                    <span className="text-xl">{card.emoji}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white mb-1">
                      {card.title}
                    </h3>
                    <p className={`text-xs font-semibold mb-1 ${themeClasses.subtitle}`}>
                      {card.subtitle}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-snug">
                      {card.description}
                    </p>
                  </div>

                  {/* Arrow - visible on hover with smooth transition */}
                  <div className={`flex items-center justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center group-hover:scale-125 transition-transform ${
                      card.theme === 'amber' ? 'text-amber-500 dark:text-amber-400' :
                      card.theme === 'red' ? 'text-red-500 dark:text-red-400' :
                      card.theme === 'orange' ? 'text-orange-500 dark:text-orange-400' :
                      card.theme === 'purple' ? 'text-purple-500 dark:text-purple-400' :
                      'text-green-500 dark:text-green-400'
                    }`}>
                      <ArrowRight size={18} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Optional: Bottom stats or CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 md:mt-12 text-center text-slate-400 dark:text-slate-500 text-xs md:text-sm"
        >
          <p>Select any mode to begin. Complete mocks daily to track your progress across all subjects.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Mocks;
