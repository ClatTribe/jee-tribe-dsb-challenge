import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LogOut, LayoutDashboard, Database, Calendar, BookOpen, User, Trophy, Moon, Sun, AlertCircle, RefreshCw, Brain, Map, Menu, X, ChevronRight, Crown } from 'lucide-react';
import NotificationCenter from './components/NotificationCenter';
import Sidebar from './components/Sidebar';
import UpgradeBanner from './components/UpgradeBanner';
import { usePaywall } from './hooks/usePaywall';
import { EXAM_CONFIGS } from './services/examConfig';

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
            <p className="text-slate-500 dark:text-slate-400 font-medium">PrepTribe encountered a glitch. Don't worry, your progress is safe.</p>
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

// Pages
const Login = React.lazy(() => import('./pages/Login'));
const ExamSelector = React.lazy(() => import('./pages/ExamSelector'));
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
const TopicMasteryMap = React.lazy(() => import('./pages/TopicMasteryMap'));
const MeriReport = React.lazy(() => import('./pages/MeriReport'));
const AajKaPlan = React.lazy(() => import('./pages/AajKaPlan'));
const DoubtSamjhao = React.lazy(() => import('./pages/DoubtSamjhao'));
const Mocks = React.lazy(() => import('./pages/Mocks'));
const LearnFlix = React.lazy(() => import('./pages/LearnFlix'));
const Notes = React.lazy(() => import('./pages/Notes'));
const FullLengthTests = React.lazy(() => import('./pages/FullLengthTests'));
const FullLengthTestEngine = React.lazy(() => import('./pages/FullLengthTestEngine'));

// ─── PRODUCT ECOSYSTEM ──────────────────────────────────────
const CURRENT_PRODUCT = "preptribe";
interface Product { id: string; label: string; url: string; }
const PRODUCTS: Product[] = [
  { id: "edunext",     label: "EduNext",     url: "https://getedunext.com" },
  { id: "preptribe",   label: "PrepTribe",   url: "https://jeetribechallenge.getedunext.com" },
  { id: "schooltribe", label: "SchoolTribe", url: "https://vidyaa-rho.vercel.app" },
];

// ─── NAV LINKS (per role) ────────────────────────────────────
interface NavLink { label: string; to: string; icon: React.ReactNode; }

const STUDENT_NAV: NavLink[] = [
  { label: "Dashboard",  to: "/",                     icon: <LayoutDashboard size={16} /> },
  { label: "Challenges", to: "/test/daily-mini-mock", icon: <Trophy size={16} /> },
];

const ADMIN_NAV: NavLink[] = [
  { label: "Dashboard",    to: "/admin",              icon: <LayoutDashboard size={16} /> },
  { label: "Question Bank", to: "/admin/questions",    icon: <Database size={16} /> },
  { label: "Challenges",   to: "/admin/challenges",   icon: <Calendar size={16} /> },
];

const Navbar = ({ onOpenSidebar, bannerVisible }: { onOpenSidebar: () => void; bannerVisible?: boolean }) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) setIsDark(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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

  const navLinks = profile.role === 'admin' ? ADMIN_NAV : STUDENT_NAV;

  return (
    <nav
      className={`fixed left-0 right-0 z-50 transition-all duration-300 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800`}
      style={{ top: bannerVisible ? '36px' : '0' }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* ── Left: Hamburger (mobile) + Logo ── */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-lg transition-all hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden text-slate-600 dark:text-slate-400"
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>
          <Link to="/" className="flex items-center flex-shrink-0">
            <img src={isDark ? "/preptribe-white.svg" : "/preptribe-dark.svg"} alt="PrepTribe Logo" className="h-36 w-auto object-contain" />
          </Link>
        </div>

        {/* ── Center: Nav Links ── */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-sm font-medium transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5"
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </div>

        {/* ── Right: Product Switcher + User Area ── */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Product Switcher — matches EduNext style */}
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            {PRODUCTS.map((product) => {
              const isActive = product.id === CURRENT_PRODUCT;
              return (
                <a
                  key={product.id}
                  href={product.url}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-b-2 border-amber-500'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {product.label}
                </a>
              );
            })}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-all hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Streak Badge */}
          {profile.role !== 'admin' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-50 dark:bg-amber-500/10">
              <span className="text-amber-500 text-sm">🔥</span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{profile.currentStreak || 0}</span>
            </div>
          )}

          {/* Notifications */}
          {profile.role !== 'admin' && <NotificationCenter />}

          {/* User + Logout */}
          <div className="flex items-center gap-2.5 pl-4 border-l border-slate-200 dark:border-slate-700">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"
              title={profile.displayName || ""}
            >
              {(profile.displayName || profile.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="hidden xl:flex flex-col items-start">
              <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                {profile.displayName}
                {profile.isPremium && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black uppercase">
                    <Crown size={9} /> Pro
                  </span>
                )}
              </span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-amber-600 dark:text-amber-400">{profile.exam || 'Student'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full transition-all text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* ── Mobile Right: Streak + Theme ── */}
        <div className="lg:hidden flex items-center gap-2">
          {profile.role !== 'admin' && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-amber-500/20 bg-amber-50 dark:bg-amber-500/10">
              <span className="text-amber-500 text-xs">🔥</span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{profile.currentStreak || 0}</span>
            </div>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

/** Redirects to ExamSelector if user hasn't chosen an exam yet */
const RequireExam: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  if (profile && !profile.exam && profile.role !== 'admin') {
    return <Navigate to="/select-exam" replace />;
  }
  return <>{children}</>;
};

const Home = () => {
  const { profile } = useAuth();
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
  return <StudentDashboard />;
};

/** Wrapper that provides sidebar state to Navbar + Sidebar */
const AppShell = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isPremium } = usePaywall();
  const bannerVisible = !isPremium;
  return (
    <>
      <UpgradeBanner />
      <Navbar onOpenSidebar={() => setSidebarOpen(true)} bannerVisible={bannerVisible} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} bannerVisible={bannerVisible} />
      {/* Desktop: push content right to make room for fixed sidebar */}
      <div className="lg:pl-56" style={{ paddingTop: bannerVisible ? '36px' : '0' }}>
        {children}
      </div>
    </>
  );
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

          <ErrorBoundary>
            <React.Suspense fallback={
              <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 animate-bounce">
                  <span className="font-display font-black text-lg">PT</span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading PrepTribe...</p>
              </div>
            }>
              <Routes>
                {/* Full-width routes — no Navbar */}
                <Route path="/login" element={<Login />} />
                <Route path="/select-exam" element={
                  <ProtectedRoute>
                    <ExamSelector />
                  </ProtectedRoute>
                } />

                {/* All other routes get the app Navbar + constrained layout */}
                <Route path="/*" element={
                  <RequireExam>
                    <AppShell>
                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 relative z-10" style={{ paddingTop: '5rem' }}>
                      <Routes>
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
                        <Route path="/mastery-map" element={
                          <ProtectedRoute allowedRole="student">
                            <TopicMasteryMap />
                          </ProtectedRoute>
                        } />
                        <Route path="/meri-report" element={
                          <ProtectedRoute allowedRole="student">
                            <MeriReport />
                          </ProtectedRoute>
                        } />
                        <Route path="/aaj-ka-plan" element={
                          <ProtectedRoute allowedRole="student">
                            <AajKaPlan />
                          </ProtectedRoute>
                        } />
                        <Route path="/doubt-samjhao" element={
                          <ProtectedRoute allowedRole="student">
                            <DoubtSamjhao />
                          </ProtectedRoute>
                        } />
                        <Route path="/mocks" element={
                          <ProtectedRoute allowedRole="student">
                            <Mocks />
                          </ProtectedRoute>
                        } />
                        <Route path="/learnflix" element={
                          <ProtectedRoute allowedRole="student">
                            <LearnFlix />
                          </ProtectedRoute>
                        } />
                        <Route path="/notes" element={
                          <ProtectedRoute allowedRole="student">
                            <Notes />
                          </ProtectedRoute>
                        } />
                        <Route path="/full-length-tests" element={
                          <ProtectedRoute allowedRole="student">
                            <FullLengthTests />
                          </ProtectedRoute>
                        } />
                        <Route path="/full-length-test/:subject/:testId" element={
                          <ProtectedRoute allowedRole="student">
                            <FullLengthTestEngine />
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
                    </main>
                    </AppShell>
                  </RequireExam>
                } />
              </Routes>
            </React.Suspense>
          </ErrorBoundary>
        </div>
      </Router>
    </AuthProvider>
  );
}
