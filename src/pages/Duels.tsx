import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, User, Shield, Zap, Trophy, Clock, Search, Loader2, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { findOpenDuel, createDuel, joinDuel, listenToDuel, Duel, getOpenDuels } from '../services/db';
import { getDailyQuestions } from '../services/geminiService';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const Duels = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [opponent, setOpponent] = useState<any>(null);
  const [activeDuelId, setActiveDuelId] = useState<string | null>(null);
  const [openDuels, setOpenDuels] = useState<Duel[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Bot logic
  useEffect(() => {
    let botTimer: any;
    if (searching && !matchFound && activeDuelId) {
      botTimer = setTimeout(async () => {
        try {
          const duelRef = doc(db, 'duels', activeDuelId);
          const snap = await getDoc(duelRef);
          if (snap.exists() && snap.data().status === 'waiting') {
            const botNames = ['Aryan_IITB', 'Ishita_JEE', 'Rahul_NIT', 'Sneha_AIIMS', 'Vikram_BITS', 'Priya_IITD', 'Ankit_IITK'];
            const randomBot = botNames[Math.floor(Math.random() * botNames.length)];
            const botId = 'bot_' + Math.random().toString(36).substr(2, 9);
            
            await updateDoc(duelRef, {
              [`players.${botId}`]: {
                displayName: randomBot + ' (Demo)',
                score: 0,
                currentIndex: 0,
                completed: false,
                lastActive: serverTimestamp(),
                isBot: true
              },
              status: 'active',
              startTime: serverTimestamp()
            });
          }
        } catch (e) {
          console.error("Bot join error:", e);
        }
      }, 5000); // 5 seconds wait for real opponent
    }
    return () => clearTimeout(botTimer);
  }, [searching, matchFound, activeDuelId]);

  useEffect(() => {
    if (!profile) return;
    
    const fetchOpenDuels = async () => {
      try {
        const duels = await getOpenDuels();
        setOpenDuels(duels);
        setError(null);
      } catch (err: any) {
        console.error("Fetch duels error:", err);
        // Only set error if it's a permission issue and we don't have any duels yet
        if (err.message?.includes('permission') || err.code === 'permission-denied') {
          setError(`Matchmaking permissions error (${err.code || 'unknown'}). Please ensure you are signed in.`);
        } else {
          setError(`Failed to fetch duels: ${err.message || 'Unknown error'}`);
        }
      }
    };
    fetchOpenDuels();
    const interval = setInterval(fetchOpenDuels, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [profile]);

  useEffect(() => {
    if (!activeDuelId) return;

    const unsubscribe = listenToDuel(activeDuelId, (duel) => {
      if (duel.status === 'active') {
        const opponentId = Object.keys(duel.players).find(id => id !== profile?.uid);
        if (opponentId) {
          setOpponent({
            name: duel.players[opponentId].displayName,
            avatar: duel.players[opponentId].displayName.substring(0, 2).toUpperCase(),
            rank: 'Elite'
          });
          setMatchFound(true);
          setSearching(false);
        }
      }
    });

    return () => unsubscribe();
  }, [activeDuelId, profile?.uid]);

  const startSearch = async () => {
    if (!profile) return;
    setSearching(true);
    
    try {
      setError(null);
      const openDuel = await findOpenDuel(profile.uid);
      if (openDuel) {
        await joinDuel(openDuel.id, profile.uid, profile.displayName);
        setActiveDuelId(openDuel.id);
      } else {
        const daily = await getDailyQuestions();
        const duelId = await createDuel(profile.uid, profile.displayName, daily.duels);
        setActiveDuelId(duelId);
      }
    } catch (error: any) {
      console.error("Matchmaking error:", error);
      setError(error.message?.includes('permission') 
        ? "Permission Denied: Matchmaking is restricted by Firestore rules." 
        : "Matchmaking failed. Please try again.");
      setSearching(false);
    }
  };

  const joinSpecificDuel = async (duelId: string) => {
    if (!profile) return;
    setSearching(true);
    setError(null);
    try {
      await joinDuel(duelId, profile.uid, profile.displayName);
      setActiveDuelId(duelId);
    } catch (error: any) {
      console.error("Join error:", error);
      setError(error.message?.includes('permission') 
        ? "Permission Denied: You don't have access to join this duel." 
        : "Failed to join duel.");
      setSearching(false);
    }
  };

  const enterArena = () => {
    if (activeDuelId) {
      navigate(`/duel/${activeDuelId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12">
      <div className="text-center space-y-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20"
        >
          <Swords size={14} /> 1v1 Live Battles
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-display font-black tracking-tighter text-slate-900 dark:text-white">
          Ranked <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Duels</span> ⚔️
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Challenge a random opponent to a 5-question sprint. Winner takes the XP.</p>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-500 text-sm font-bold flex items-center gap-3 max-w-md mx-auto"
          >
            <Shield size={20} className="shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!searching && !matchFound ? (
          <motion.div 
            key="lobby"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white/80 dark:bg-white/5 backdrop-blur-xl p-12 rounded-[3rem] border border-slate-200/50 dark:border-white/5 shadow-2xl shadow-slate-200/20 dark:shadow-none text-center space-y-8 max-w-2xl mx-auto relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 w-32 h-32 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-[2rem] flex items-center justify-center mx-auto border-4 border-white dark:border-white/5 shadow-xl rotate-3 hover:rotate-6 transition-transform duration-300">
              <Swords size={48} className="text-amber-500" />
            </div>
            
            <div className="space-y-2 relative z-10">
              <h2 className="text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight">Ready to Brawl?</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Entry fee: 20 Coins. Winner takes 40 Coins + 100 XP.</p>
            </div>

            <div className="flex justify-center gap-8 py-8 border-y border-slate-200/50 dark:border-white/5 relative z-10">
              <div className="text-center">
                <p className="text-4xl font-black text-slate-900 dark:text-white">14</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Wins</p>
              </div>
              <div className="w-px bg-slate-200/50 dark:bg-white/5" />
              <div className="text-center">
                <p className="text-4xl font-black text-slate-900 dark:text-white">54%</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Win Rate</p>
              </div>
              <div className="w-px bg-slate-200/50 dark:bg-white/5" />
              <div className="text-center">
                <p className="text-4xl font-black text-amber-500">Gold III</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Division</p>
              </div>
            </div>

            <button 
              onClick={startSearch}
              className="w-full py-5 btn-liquid-secondary rounded-2xl font-black text-xl uppercase tracking-widest active:scale-95 relative z-10"
            >
              Find Random Opponent
            </button>

            {/* Open Challenges List */}
            {openDuels.length > 0 && (
              <div className="pt-8 space-y-4 relative z-10">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Open Challenges</h3>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {openDuels.map((duel) => {
                    const hostId = Object.keys(duel.players)[0];
                    const host = duel.players[hostId];
                    if (hostId === profile?.uid) return null;
                    
                    return (
                      <motion.div 
                        key={duel.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between group hover:border-amber-500/30 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center font-black">
                            {host.displayName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-slate-900 dark:text-white">{host.displayName}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waiting for opponent...</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => joinSpecificDuel(duel.id)}
                          className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-600 transition-colors flex items-center gap-2"
                        >
                          <Play size={12} fill="currentColor" /> Join
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        ) : searching ? (
          <motion.div 
            key="searching"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900/90 backdrop-blur-xl p-12 rounded-[3rem] shadow-2xl text-center space-y-8 max-w-2xl mx-auto text-white border border-slate-800/50 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />
            <div className="relative w-32 h-32 mx-auto z-10">
              <div className="absolute inset-0 border-4 border-amber-500/30 rounded-full animate-ping" />
              <div className="absolute inset-0 border-4 border-amber-500 rounded-full flex items-center justify-center bg-slate-900 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                <Zap size={48} className="text-amber-500 animate-pulse" />
              </div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-4xl font-display font-black text-white mb-2 tracking-tight">Searching...</h2>
              <p className="text-slate-400 font-medium text-lg">Looking for an opponent near your skill level.</p>
            </div>
            
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-500/80 pt-8 relative z-10 animate-pulse">
              Estimated wait: 00:04
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="found"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center max-w-4xl mx-auto relative z-10"
          >
            {/* Player */}
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border-2 border-amber-500/20 shadow-xl text-center space-y-6 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 to-orange-500" />
              <div className="w-28 h-28 bg-amber-500/10 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto text-3xl font-black border-4 border-white dark:border-white/5 shadow-lg group-hover:rotate-3 transition-transform">
                {profile?.displayName?.substring(0, 2).toUpperCase() || 'YOU'}
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{profile?.displayName?.split(' ')[0] || 'You'}</h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Gold III</p>
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-amber-500/30 z-10 rotate-12"
              >
                <Swords size={40} />
              </motion.div>
              <div className="text-center">
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">VS</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Match Found</p>
              </div>
            </div>

            {/* Opponent */}
            <div className="bg-[#060818]/90 backdrop-blur-xl p-8 rounded-[2.5rem] border-2 border-orange-500/20 shadow-xl text-center space-y-6 relative overflow-hidden text-white group hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-amber-500" />
              <div className="w-28 h-28 bg-orange-500/20 text-orange-400 rounded-[2rem] flex items-center justify-center mx-auto text-3xl font-black border-4 border-white/5 shadow-lg group-hover:-rotate-3 transition-transform">
                {opponent.avatar}
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">{opponent.name}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Rank #{opponent.rank}</p>
              </div>
            </div>

            <div className="md:col-span-3 text-center pt-8">
              <button 
                onClick={enterArena}
                className="px-12 py-5 btn-liquid rounded-2xl font-black text-xl uppercase tracking-widest shadow-xl"
              >
                Enter Arena
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Duels;
