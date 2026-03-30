import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, orderBy, limit as fbLimit } from 'firebase/firestore';
import { db } from '../firebase';
import { generateSmartNotifications, SmartNotification } from '../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!profile?.uid) return;

    // Load read IDs from localStorage
    const savedReadIds = localStorage.getItem(`notif_read_${profile.uid}`);
    if (savedReadIds) {
      setReadIds(new Set(JSON.parse(savedReadIds)));
    }

    const fetchAndGenerate = async () => {
      try {
        // Get recent history for context
        const historyRef = collection(db, 'users', profile.uid, 'history');
        const q = query(historyRef, orderBy('timestamp', 'desc'), fbLimit(5));
        const snap = await getDocs(q);
        const recentHistory = snap.docs.map(doc => doc.data());

        const notifs = generateSmartNotifications(
          profile,
          recentHistory,
          (profile as any).lastActiveDate
        );

        setNotifications(notifs);
      } catch (error) {
        console.error('Error generating notifications:', error);
      }
    };

    fetchAndGenerate();
  }, [profile]);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const markAsRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      if (profile?.uid) {
        localStorage.setItem(`notif_read_${profile.uid}`, JSON.stringify([...next]));
      }
      return next;
    });
  };

  const handleNotifClick = (notif: SmartNotification) => {
    markAsRead(notif.id);
    if (notif.action) {
      setIsOpen(false);
      navigate(notif.action);
    }
  };

  const NOTIF_COLORS: Record<string, string> = {
    amber: 'bg-amber-500/10 border-amber-500/20',
    rose: 'bg-rose-500/10 border-rose-500/20',
    blue: 'bg-blue-500/10 border-blue-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/20',
    violet: 'bg-violet-500/10 border-violet-500/20',
  };

  if (!profile || profile.role === 'admin') return null;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full bg-slate-100/80 dark:bg-white/5 backdrop-blur-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-amber-500 dark:hover:text-amber-400 transition-all hover:scale-110 active:scale-95 border border-slate-200/50 dark:border-white/5"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-12 w-80 md:w-96 max-h-[70vh] overflow-y-auto bg-white dark:bg-[#0a0c20] border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-2xl z-50"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white dark:bg-[#0a0c20] z-10 rounded-t-2xl">
                <h3 className="font-black text-slate-900 dark:text-white text-sm">Notifications</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {/* Notifications */}
              {notifications.length > 0 ? (
                <div className="p-2 space-y-1">
                  {notifications.map((notif, i) => (
                    <motion.button
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full text-left p-3 rounded-xl border transition-all hover:shadow-md ${
                        readIds.has(notif.id)
                          ? 'bg-slate-50 dark:bg-white/[0.02] border-transparent opacity-60'
                          : `${NOTIF_COLORS[notif.color] || NOTIF_COLORS.amber}`
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl shrink-0">{notif.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 dark:text-white">{notif.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-2">{notif.message}</p>
                        </div>
                        {notif.action && <ChevronRight size={14} className="text-slate-400 shrink-0 mt-1" />}
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <Bell size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold">All caught up! No new notifications.</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
