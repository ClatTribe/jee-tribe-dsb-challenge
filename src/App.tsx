import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LogOut, LayoutDashboard, Database, Calendar, BookOpen, User, Trophy, Moon, Sun, AlertCircle, RefreshCw } from 'lucide-react';

// Error Boundary Component
class ErrorBoundary extends React.Component<any, any> {
  public state: { hasError: boolean };

  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-6">
          <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white">Something went wrong</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">The Tribe's servers encountered a glitch. Don't worry, your progress is safe.</p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all"
          >
            <RefreshCw size={20} /> Reset Application
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// Pages (to be created)
const Login = React.lazy(() => import('./pages/Login'));
const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const QuestionManager = React.lazy(() => import('./pages/QuestionManager'));
const ChallengeBuilder = React.lazy(() => import('./pages/ChallengeBuilder'));
import TestEngine from './pages/TestEngine';
const Flashcards = React.lazy(() => import('./pages/Flashcards'));
const SuddenDeath = React.lazy(() => import('./pages/SuddenDeath'));
const SkipStrategy = React.lazy(() => import('./pages/SkipStrategy'));
const Duels = React.lazy(() => import('./pages/Duels'));
const DuelArena = React.lazy(() => import('./pages/DuelArena'));

const Navbar = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!profile) return null;

  return (
    <div className="px-4 py-4 sticky top-0 z-50">
      <nav className="bg-white/80 dark:bg-[#060818]/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 px-6 py-3 flex items-center justify-between rounded-full shadow-lg shadow-slate-200/20 dark:shadow-none transition-all duration-300 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-[#060818] shadow-lg shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <span className="font-display font-black text-lg">JT</span>
            </div>
            <div className="flex flex-col hidden sm:flex">
              <span className="text-xl font-display font-black tracking-tighter text-slate-900 dark:text-white leading-none transition-colors">JEE Tribe</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Master the Exam</span>
            </div>
          </Link>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-500 dark:text-slate-400">
            {profile.role === 'admin' ? (
              <>
                <Link to="/admin" className="hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-2 transition-colors">
                  <LayoutDashboard size={18} /> Dashboard
                </Link>
                <Link to="/admin/questions" className="hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-2 transition-colors">
                  <Database size={18} /> Question Bank
                </Link>
                <Link to="/admin/challenges" className="hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-2 transition-colors">
                  <Calendar size={18} /> Challenges
                </Link>
              </>
            ) : (
              <>
                <Link to="/" className="hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-2 transition-colors">
                  <LayoutDashboard size={18} /> Dashboard
                </Link>
                <Link to="/challenges" className="hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-2 transition-colors">
                  <Trophy size={18} /> Challenges
                </Link>
                <Link to="/flashcards" className="hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-2 transition-colors">
                  <BookOpen size={18} /> Flashcards
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-slate-100/80 dark:bg-white/5 backdrop-blur-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-amber-500 dark:hover:text-amber-400 transition-all hover:scale-110 active:scale-95 border border-slate-200/50 dark:border-white/5"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {!profile.role && (
            <div className="flex items-center gap-2 bg-amber-500/10 dark:bg-amber-500/20 px-4 py-2 rounded-full hidden sm:flex border border-amber-500/20">
              <span className="text-amber-500 dark:text-amber-400 streak-flame">🔥</span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400">{profile.currentStreak || 0}</span>
            </div>
          )}
          
          <div className="flex items-center gap-3 pl-4 sm:pl-6 border-l border-slate-200/50 dark:border-white/5">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-black text-slate-900 dark:text-white">{profile.displayName}</span>
              <span className="text-[10px] uppercase tracking-widest text-amber-500 dark:text-amber-400 font-black">{profile.role || 'Student'}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center hover:bg-rose-500/10 rounded-full text-slate-400 hover:text-rose-500 transition-all hover:scale-110 active:scale-95"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

const Home = () => {
  const { profile } = useAuth();
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
  return <StudentDashboard />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 dark:bg-[#060818] font-sans text-slate-900 dark:text-white transition-colors duration-300 relative overflow-hidden">
          {/* Subtle Background Gradients */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 dark:bg-amber-500/10 blur-[120px]" />
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-orange-500/5 dark:bg-orange-500/10 blur-[120px]" />
            <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-amber-500/5 dark:bg-amber-500/5 blur-[120px]" />
          </div>
          
          <Navbar />
          <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
            <ErrorBoundary>
              <React.Suspense fallback={
              <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 animate-bounce">
                  <span className="font-display font-black text-lg">JT</span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading Tribe Assets...</p>
              </div>
            }>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                {/* Root Route */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } />
                <Route path="/test/:challengeId" element={
                  <ProtectedRoute allowedRole="student">
                    <TestEngine />
                  </ProtectedRoute>
                } />
                <Route path="/flashcards" element={
                  <ProtectedRoute allowedRole="student">
                    <Flashcards />
                  </ProtectedRoute>
                } />
                <Route path="/sudden-death" element={
                  <ProtectedRoute allowedRole="student">
                    <SuddenDeath />
                  </ProtectedRoute>
                } />
                <Route path="/skip-strategy" element={
                  <ProtectedRoute allowedRole="student">
                    <SkipStrategy />
                  </ProtectedRoute>
                } />
                <Route path="/duels" element={
                  <ProtectedRoute allowedRole="student">
                    <Duels />
                  </ProtectedRoute>
                } />
                <Route path="/duel/:duelId" element={
                  <ProtectedRoute allowedRole="student">
                    <DuelArena />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/student-preview" element={
                  <ProtectedRoute allowedRole="admin">
                    <StudentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/questions" element={
                  <ProtectedRoute allowedRole="admin">
                    <QuestionManager />
                  </ProtectedRoute>
                } />
                <Route path="/admin/challenges" element={
                  <ProtectedRoute allowedRole="admin">
                    <ChallengeBuilder />
                  </ProtectedRoute>
                } />
              </Routes>
            </React.Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
