import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Swords,
  MonitorPlay,
  BookOpen,
  X,
  Zap,
  Target,
  SkipForward,
  Users,
  Map,
  FileBarChart,
  CalendarCheck,
  MessageCircleQuestion,
  ClipboardList,
  Crown,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  bannerVisible?: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  section?: string;
}

const navItems: NavItem[] = [
  // Main section
  { label: 'Home', path: '/', icon: <LayoutDashboard className="w-5 h-5" />, section: 'Main' },
  { label: 'Mocks & Challenges', path: '/mocks', icon: <Swords className="w-5 h-5" />, section: 'Main' },
  { label: 'Full Length Tests', path: '/full-length-tests', icon: <ClipboardList className="w-5 h-5" />, section: 'Main' },
  { label: 'LearnFlix', path: '/learnflix', icon: <MonitorPlay className="w-5 h-5" />, section: 'Main' },
  { label: 'Notes & Study', path: '/notes', icon: <BookOpen className="w-5 h-5" />, section: 'Main' },
  // Practice section
  { label: 'Flashcards', path: '/flashcards', icon: <Zap className="w-5 h-5" />, section: 'Practice' },
  { label: 'Sudden Death', path: '/sudden-death', icon: <Target className="w-5 h-5" />, section: 'Practice' },
  { label: 'Skip Strategy', path: '/skip-strategy', icon: <SkipForward className="w-5 h-5" />, section: 'Practice' },
  { label: 'Duels', path: '/duels', icon: <Users className="w-5 h-5" />, section: 'Practice' },
  // AI Coach section
  { label: 'Mastery Map', path: '/mastery-map', icon: <Map className="w-5 h-5" />, section: 'AI Coach' },
  { label: 'Meri Report', path: '/meri-report', icon: <FileBarChart className="w-5 h-5" />, section: 'AI Coach' },
  { label: 'Aaj Ka Plan', path: '/aaj-ka-plan', icon: <CalendarCheck className="w-5 h-5" />, section: 'AI Coach' },
  { label: 'Doubt Samjhao', path: '/doubt-samjhao', icon: <MessageCircleQuestion className="w-5 h-5" />, section: 'AI Coach' },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, bannerVisible }) => {
  const location = useLocation();
  const { user, profile } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  // Group nav items by section
  const groupedItems = navItems.reduce((acc, item) => {
    const section = item.section || 'Main';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const sections = ['Main', 'Practice', 'AI Coach'];

  return (
    <>
      {/* ── Desktop: Fixed sidebar, always visible ── */}
      <aside
        className="hidden lg:flex fixed left-0 w-56 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col z-30"
        style={{
          top: bannerVisible ? 'calc(4rem + 36px)' : '4rem',
          height: bannerVisible ? 'calc(100vh - 4rem - 36px)' : 'calc(100vh - 4rem)',
        }}
      >
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section} className="mb-6">
              {section !== 'Main' && (
                <div className="px-2 py-1.5 mb-2">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {section}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                {groupedItems[section]?.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm font-medium ${
                      isActive(item.path)
                        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className={isActive(item.path) ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-amber-500'}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Section */}
        {user && (
          <div className="border-t border-slate-200 dark:border-slate-800 p-3">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                profile?.isPremium
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
              }`}>
                {profile?.isPremium ? <Crown size={14} /> : (user.displayName?.charAt(0).toUpperCase() || 'U')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                  {user.displayName || 'User'}
                  {profile?.isPremium && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-black uppercase">Pro</span>
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile?.exam ? `${profile.exam} Aspirant` : 'Aspirant'}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ── Mobile: Slide-in overlay sidebar ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-screen w-72 bg-white dark:bg-slate-900 z-50 flex flex-col shadow-2xl lg:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <Link to="/" onClick={onClose} className="flex items-center">
                  <img src="/preptribe-dark.svg" alt="PrepTribe" className="h-12 w-auto object-contain dark:hidden" />
                  <img src="/preptribe-white.svg" alt="PrepTribe" className="h-12 w-auto object-contain hidden dark:block" />
                </Link>
                <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto px-4 py-6">
                {sections.map((section) => (
                  <div key={section} className="mb-6">
                    {section !== 'Main' && (
                      <div className="px-2 py-1.5 mb-2">
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          {section}
                        </p>
                      </div>
                    )}
                    <div className="space-y-1">
                      {groupedItems[section]?.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={onClose}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group text-sm font-medium ${
                            isActive(item.path)
                              ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <span className={isActive(item.path) ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-amber-500'}>
                            {item.icon}
                          </span>
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              {/* User */}
              {user && (
                <div className="border-t border-slate-200 dark:border-slate-800 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                      profile?.isPremium
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    }`}>
                      {profile?.isPremium ? <Crown size={18} /> : (user.displayName?.charAt(0).toUpperCase() || 'U')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                        {user.displayName || 'User'}
                        {profile?.isPremium && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-black uppercase">Pro</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile?.exam ? `${profile.exam} Aspirant` : 'Aspirant'}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
