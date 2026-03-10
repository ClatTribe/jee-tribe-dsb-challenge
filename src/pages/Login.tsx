import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Zap, ShieldCheck, Trophy, ExternalLink, AlertTriangle, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const Login = () => {
  const { loginWithGoogle, user } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const navigate = useNavigate();
  
  // Check if running inside an iframe (like the AI Studio preview)
  const isIframe = window !== window.parent;

  React.useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailAuth = async (isSignUp: boolean) => {
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }
    setIsLoggingIn(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Email auth error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        alert("Email/Password sign-in is not enabled in your Firebase Console. Please enable it in Authentication -> Sign-in method.");
      } else {
        alert(`Authentication failed: ${error.message}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-12 rounded-[3rem] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 max-w-md w-full text-center relative overflow-hidden"
      >
        {/* Decorative background elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 mx-auto mb-8 cursor-default"
          >
            <span className="font-display font-black text-3xl">JT</span>
          </motion.div>
          
          <h1 className="text-4xl font-display font-black tracking-tighter text-slate-900 dark:text-white mb-3">
            Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Tribe</span> 🚀
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed text-lg">
            Master JEE Advanced with daily challenges, real-time analytics, and a community of top aspirants. Let's go! 🔥
          </p>

          {isIframe && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left flex items-start gap-3">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-800">Preview Environment Detected</p>
                <p className="text-xs text-amber-700 font-medium">
                  Google Login may be blocked inside this preview window. If login fails, please click the <strong>"Open in new tab"</strong> icon at the top right of your screen.
                </p>
              </div>
            </div>
          )}
          
          {showEmailLogin ? (
            <div className="space-y-4 mb-6 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-md border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-medium text-slate-900 dark:text-white"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-md border-2 border-slate-100 dark:border-slate-700/50 rounded-2xl focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-medium text-slate-900 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleEmailAuth(false)}
                  disabled={isLoggingIn}
                  className="flex-1 btn-liquid py-3 rounded-xl font-black text-sm active:scale-95 disabled:opacity-50"
                >
                  {isLoggingIn ? '...' : 'Login'}
                </button>
                <button
                  onClick={() => handleEmailAuth(true)}
                  disabled={isLoggingIn}
                  className="flex-1 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-700 dark:text-slate-300 py-3 rounded-xl font-black text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50 border border-slate-200/50 dark:border-slate-700/50"
                >
                  {isLoggingIn ? '...' : 'Sign Up'}
                </button>
              </div>
              <button 
                onClick={() => setShowEmailLogin(false)}
                className="w-full text-center text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 mt-4 transition-colors"
              >
                Back to Google Login
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-2 border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-500/50 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 py-5 rounded-2xl font-black text-slate-700 dark:text-slate-200 transition-all active:scale-95 shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6 group-hover:scale-110 group-hover:rotate-6 transition-transform" />
                )}
                <span className="uppercase text-xs tracking-widest">
                  {isLoggingIn ? 'Connecting...' : 'Continue with Google'}
                </span>
              </button>
              
              <button
                onClick={() => setShowEmailLogin(true)}
                className="w-full flex items-center justify-center gap-4 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-md border-2 border-slate-100 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 py-4 rounded-2xl font-black text-slate-600 dark:text-slate-300 transition-all active:scale-95"
              >
                <Mail size={18} className="text-slate-400 dark:text-slate-500" />
                <span className="uppercase text-xs tracking-widest">
                  Continue with Email
                </span>
              </button>
            </div>
          )}

          <div className="mt-12 grid grid-cols-3 gap-4 pt-8 border-t border-slate-200/50 dark:border-slate-800/50 relative z-10">
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                <Zap size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Daily</span>
            </div>
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Secure</span>
            </div>
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 dark:text-amber-400 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <Trophy size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Rank</span>
            </div>
          </div>
        </div>
      </motion.div>
      
      <p className="mt-8 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">
        Trusted by 10,000+ JEE Aspirants
      </p>
    </div>
  );
};

export default Login;
