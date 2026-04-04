import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, limit, orderBy, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Database, Trophy, TrendingUp, Activity, Clock, ChevronRight, RefreshCw, CheckCircle2, AlertCircle, Eye, Crown, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { seedDatabase } from '../utils/seedData';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuestions: 0,
    activeChallenges: 0,
    avgScore: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const navigate = useNavigate();

  // Premium user management
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const searchUsers = async () => {
    if (!searchEmail.trim()) {
      // Show all users if search is empty
      loadAllUsers();
      return;
    }
    setSearching(true);
    try {
      const usersRef = collection(db, 'users');
      const snap = await getDocs(usersRef);
      const results = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((u: any) =>
          u.email?.toLowerCase().includes(searchEmail.toLowerCase()) ||
          u.displayName?.toLowerCase().includes(searchEmail.toLowerCase())
        );
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllUsers(users);
      setSearchResults(users);
    } catch (err) {
      console.error('Load users error:', err);
    }
  };

  const togglePremium = async (userId: string, currentStatus: boolean) => {
    setToggleLoading(userId);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isPremium: !currentStatus,
        ...((!currentStatus) ? { premiumSince: new Date().toISOString() } : {}),
      });
      // Update local state
      setSearchResults(prev =>
        prev.map(u => u.id === userId ? { ...u, isPremium: !currentStatus } : u)
      );
      setAllUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, isPremium: !currentStatus } : u)
      );
    } catch (err) {
      console.error('Toggle premium error:', err);
    } finally {
      setToggleLoading(null);
    }
  };

  const fetchStats = async () => {
    try {
      const [usersSnap, questionsSnap, challengesSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'questionBank')),
        getDocs(collection(db, 'dailyChallenges'))
      ]);
      
      setStats({
        totalUsers: usersSnap.size,
        totalQuestions: questionsSnap.size,
        activeChallenges: challengesSnap.size,
        avgScore: 184 // Placeholder
      });

      try {
        const activitySnap = await getDocs(query(collection(db, 'attempts'), orderBy('completedAt', 'desc'), limit(5)));
        setRecentActivity(activitySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.warn("Could not fetch recent activity (likely permission issue):", err);
      }
    } catch (error: any) {
      console.error("Admin data fetch error:", error);
      // If we can't fetch stats, it's likely a permission issue
    }
  };

  useEffect(() => {
    fetchStats();
    loadAllUsers();
  }, []);

  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedStatus('idle');
    try {
      await seedDatabase();
      setSeedStatus('success');
      await fetchStats();
      setTimeout(() => setSeedStatus('idle'), 3000);
    } catch (error) {
      console.error('Seed error:', error);
      setSeedStatus('error');
    } finally {
      setIsSeeding(false);
    }
  };

  const statCards = [
    { label: 'Total Students', value: stats.totalUsers, icon: Users, color: 'text-primary', bg: 'bg-primary/10', trend: '+12% this week' },
    { label: 'Question Bank', value: stats.totalQuestions, icon: Database, color: 'text-indigo-600', bg: 'bg-indigo-600/10', trend: '24 added today' },
    { label: 'Active Challenges', value: stats.activeChallenges, icon: Trophy, color: 'text-secondary', bg: 'bg-secondary/10', trend: '3 live now' },
    { label: 'Avg. Platform Score', value: stats.avgScore, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10', trend: '+5.4% improvement' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tight text-slate-900">Admin <span className="text-primary">Command Center</span></h1>
          <p className="text-slate-500 font-medium">Real-time platform performance and student engagement metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSeed}
            disabled={isSeeding}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${
              seedStatus === 'success' ? 'bg-success text-white' : 
              seedStatus === 'error' ? 'bg-danger text-white' : 
              'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isSeeding ? <RefreshCw size={18} className="animate-spin" /> : 
             seedStatus === 'success' ? <CheckCircle2 size={18} /> :
             seedStatus === 'error' ? <AlertCircle size={18} /> :
             <Database size={18} />}
            {isSeeding ? 'Seeding...' : 
             seedStatus === 'success' ? 'Data Seeded!' :
             seedStatus === 'error' ? 'Seed Failed' :
             'Seed Demo Data'}
          </button>
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm">
            <Clock size={20} className="text-slate-400" />
            <span className="font-black text-slate-700">Live Feed Active</span>
            <div className="w-2 h-2 bg-success rounded-full animate-ping" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:border-primary/30 transition-all"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon size={28} />
              </div>
              <span className="text-[10px] font-black text-success bg-success/10 px-2 py-1 rounded-lg">{stat.trend}</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-display font-black text-slate-900 flex items-center gap-3">
              <Activity size={24} className="text-primary" /> Recent Activity
            </h3>
            <button className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline">View All Logs</button>
          </div>
          <div className="space-y-6">
            {recentActivity.length > 0 ? recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Student completed challenge</p>
                    <p className="text-xs text-slate-500">Score: <span className="font-bold text-primary">{activity.totalScore}</span> • {new Date(activity.completedAt?.seconds * 1000).toLocaleTimeString()}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
              </div>
            )) : (
              <div className="text-center py-12 text-slate-400 font-medium">No recent activity found.</div>
            )}
          </div>
        </div>

        {/* Platform Health / Quick Actions */}
        <div className="space-y-8">
          <div className="bg-dark-bg p-8 rounded-[2.5rem] text-white shadow-2xl">
            <h3 className="text-xl font-display font-black mb-6">Quick Actions</h3>
            <div className="space-y-3">
              {[
                { label: 'Preview Student View', icon: Eye, color: 'bg-emerald-500', onClick: () => navigate('/student-preview') },
                { label: 'Add New Question', icon: Database, color: 'bg-primary' },
                { label: 'Create Challenge', icon: Trophy, color: 'bg-secondary' },
                { label: 'Broadcast Message', icon: Activity, color: 'bg-indigo-500' },
                { label: 'System Settings', icon: TrendingUp, color: 'bg-slate-700' },
              ].map((action, i) => (
                <button 
                  key={i}
                  onClick={action.onClick}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                >
                  <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                    <action.icon size={20} />
                  </div>
                  <span className="text-sm font-bold">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-8">
            <h4 className="font-display font-black text-primary mb-4">Platform Tip</h4>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              "You can now use LaTeX in question explanations too. Providing detailed step-by-step solutions significantly improves student retention and platform satisfaction."
            </p>
          </div>
        </div>
      </div>

      {/* ── Premium User Management ── */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-black text-slate-900 flex items-center gap-3">
            <Crown size={24} className="text-amber-500" /> Manage Premium Users
          </h3>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {allUsers.filter((u: any) => u.isPremium).length} premium / {allUsers.length} total
          </span>
        </div>

        {/* Search bar */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>
          <button
            onClick={searchUsers}
            disabled={searching}
            className="px-6 py-3 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Users list */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {searchResults.length > 0 ? searchResults.map((user: any) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                user.isPremium
                  ? 'border-amber-200 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5'
                  : 'border-slate-100 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  user.isPremium
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {user.displayName || 'No Name'}
                    {user.isPremium && (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase dark:bg-amber-500/20 dark:text-amber-400">
                        <Crown size={10} /> Pro
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user.email} · {user.exam || 'No exam'} · Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => togglePremium(user.id, !!user.isPremium)}
                disabled={toggleLoading === user.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                  user.isPremium
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20'
                }`}
              >
                {toggleLoading === user.id ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : user.isPremium ? (
                  <><ToggleRight size={16} /> Revoke</>
                ) : (
                  <><ToggleLeft size={16} /> Make Pro</>
                )}
              </button>
            </div>
          )) : (
            <div className="text-center py-8 text-slate-400 font-medium">
              {searchEmail ? 'No users found matching your search.' : 'Loading users...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
