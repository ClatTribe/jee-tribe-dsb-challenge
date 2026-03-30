import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Swords,
  MonitorPlay,
  BookOpen,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Home', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Mocks', path: '/mocks', icon: <Swords className="w-5 h-5" /> },
  { label: 'LearnFlix', path: '/learnflix', icon: <MonitorPlay className="w-5 h-5" /> },
  { label: 'Notes', path: '/notes', icon: <BookOpen className="w-5 h-5" /> },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* ── Desktop: Fixed sidebar, always visible ── */}
      <aside className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-56 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col z-30">
        <nav className="flex-1 px-3 py-6">
          <div className="space-y-1">
            {navItems.map((item) => (
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
        </nav>

        {user && (
          <div className="border-t border-slate-200 dark:border-slate-800 p-3">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name || 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.examType || 'JEE Aspirant'}</p>
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
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">PT</span>
                  </div>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">PrepTribe</span>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 px-4 py-6">
                <div className="space-y-1">
                  {navItems.map((item) => (
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
                      <span className={isActive(item.path) ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 group-hover:text-amber-500'}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </nav>

              {/* User */}
              {user && (
                <div className="border-t border-slate-200 dark:border-slate-800 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold flex-shrink-0">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user.examType || 'JEE Aspirant'}</p>
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
