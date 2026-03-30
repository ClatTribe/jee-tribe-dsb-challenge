import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LogOut, LayoutDashboard, Database, Calendar, BookOpen, User, Trophy, Moon, Sun, AlertCircle, RefreshCw, Brain, Map, Menu, X, ChevronRight } from 'lucide-react';
import NotificationCenter from './components/NotificationCenter';
import Sidebar from './components/Sidebar';
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

// ─── BRAND COLORS ────────────────────────────────────────────
const BRAND = {
  primary: "#F59E0B",
  darkBg: "rgba(2, 6, 23, 0.95)",
  borderSubtle: "rgba(99, 102, 241, 0.1)",
  textMuted: "#94a3b8",
  textBright: "#f8fafc",
};

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

const Navbar = ({ onOpenSidebar }: { onOpenSidebar: () => void }) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false);
    navigate('/login');
  };

  if (!profile) return null;

  const navLinks = profile.role === 'admin' ? ADMIN_NAV : STUDENT_NAV;
  const examLabel = profile.exam ? EXAM_CONFIGS[profile.exam]?.name : '';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || mobileMenuOpen ? "backdrop-blur-md border-b" : "bg-transparent"
      }`}
      style={{
        backgroundColor: isScrolled || mobileMenuOpen ? BRAND.darkBg : "transparent",
        borderColor: isScrolled || mobileMenuOpen ? BRAND.borderSubtle : "transparent",
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between max-w-7xl h-16">
        {/* ── Sidebar Toggle + Logo ── */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-lg transition-all hover:bg-white/10 lg:hidden"
            style={{ color: BRAND.textMuted }}
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>
          <Link to="/" className="flex items-center flex-shrink-0">
            <img src={isDark ? "/preptribe-white.svg" : "/preptribe-dark.svg"} alt="PrepTribe Logo" className="h-36 w-auto object-contain" />
          </Link>
        </div>

        {/* ── Desktop: Nav Links ── */}
        <div className="hidden lg:flex items-center gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-sm font-semibold transition-colors hover:text-white flex items-center gap-1.5"
              style={{ color: BRAND.textMuted }}
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </div>

        {/* ── Desktop: Product Switcher + Theme + Auth ── */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Product Tabs */}
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{ border: `1px solid ${BRAND.borderSubtle}` }}
          >
            {PRODUCTS.map((product) => {
              const isActive = product.id === CURRENT_PRODUCT;
              return (
                <a
                  key={product.id}
                  href={product.url}
                  className="px-4 py-2 text-xs font-bold tracking-wide transition-all duration-200"
                  style={{
                    color: isActive ? BRAND.primary : BRAND.textMuted,
                    backgroundColor: isActive ? "rgba(245, 158, 11, 0.1)" : "transparent",
                    borderBottom: isActive ? `2px solid ${BRAND.primary}` : "2px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = BRAND.textBright;
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = BRAND.textMuted;
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {product.label}
                </a>
              );
            })}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-all hover:scale-110 active:scale-95"
            style={{ color: BRAND.textMuted }}
            aria-label="Toggle Dark Mode"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Streak Badge */}
          {profile.role !== 'admin' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/20" style={{ backgroundColor: "rgba(245, 158, 11, 0.08)" }}>
              <span className="text-amber-500 streak-flame text-sm">🔥</span>
              <span className="text-sm font-black text-amber-500">{profile.currentStreak || 0}</span>
            </div>
          )}

          {/* Notification Center */}
          {profile.role !== 'admin' && <NotificationCenter />}

          {/* User Area + Logout */}
          <div className="flex items-center gap-2.5 ml-1 pl-3 border-l" style={{ borderColor: BRAND.borderSubtle }}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                color: BRAND.primary,
                border: "1px solid rgba(245, 158, 11, 0.3)",
              }}
              title={profile.displayName || ""}
            >
              {(profile.displayName || profile.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="hidden xl:flex flex-col items-start">
              <span className="text-sm font-bold" style={{ color: BRAND.textBright }}>{profile.displayName}</span>
              <span className="text-[10px] uppercase tracking-widest font-black" style={{ color: BRAND.primary }}>{profile.exam || 'Student'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full transition-all"
              style={{ color: BRAND.textMuted }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = BRAND.textMuted; e.currentTarget.style.backgroundColor = "transparent"; }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* ── Mobile: Toggle ── */}
        <div className="lg:hidden flex items-center gap-3">
          {/* Mobile streak badge */}
          {profile.role !== 'admin' && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-amber-500/20" style={{ backgroundColor: "rgba(245, 158, 11, 0.08)" }}>
              <span className="text-amber-500 text-xs">🔥</span>
              <span className="text-[10px] font-black text-amber-500">{profile.currentStreak || 0}</span>
            </div>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full"
            style={{ color: BRAND.textMuted }}
            aria-label="Toggle Dark Mode"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2"
            style={{ color: BRAND.textMuted }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden absolute top-full left-0 right-0 border-b p-5 flex flex-col gap-3 shadow-xl"
          style={{ backgroundColor: BRAND.darkBg, borderColor: BRAND.borderSubtle }}
        >
          {/* User badge */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl mb-1"
            style={{ backgroundColor: "rgba(245, 158, 11, 0.08)" }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: BRAND.primary }}
            >
              {(profile.displayName || profile.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate" style={{ color: BRAND.textBright }}>{profile.displayName}</span>
              <span className="text-[10px] uppercase tracking-widest font-black" style={{ color: BRAND.primary }}>{examLabel || 'Student'}</span>
            </div>
          </div>

          {/* Nav Links */}
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-xs font-bold tracking-wider py-2 flex items-center gap-2"
              style={{ color: BRAND.textBright }}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.icon} {link.label}
            </Link>
          ))}

          <hr style={{ borderColor: BRAND.borderSubtle }} />

          {/* Product Switcher — horizontal row */}
          <div className="flex gap-2">
            {PRODUCTS.map((product) => {
              const isActive = product.id === CURRENT_PRODUCT;
              return (
                <a
                  key={product.id}
                  href={product.url}
                  className="flex-1 py-2.5 text-center text-xs font-bold tracking-wide rounded-lg transition-all"
                  style={{
                    color: isActive ? BRAND.primary : BRAND.textMuted,
                    backgroundColor: isActive ? "rgba(245, 158, 11, 0.1)" : "transparent",
                    border: isActive ? `1px solid ${BRAND.primary}` : `1px solid ${BRAND.borderSubtle}`,
                  }}
                >
                  {product.label}
                </a>
              );
            })}
          </div>

          <hr style={{ borderColor: BRAND.borderSubtle }} />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full py-2.5 text-center font-medium text-white rounded-xl flex items-center justify-center gap-2"
            style={{ backgroundColor: "#d32f2f" }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
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
  return (
    <>
      <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Desktop: push content right to make room for fixed sidebar */}
      <div className="lg:pl-56">
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
