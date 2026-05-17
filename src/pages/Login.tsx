"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, CheckCircle2, BarChart3, Target, Users, BookOpen, Menu, X, PlayCircle, GraduationCap, Sparkles, Users2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';

const RotatingText = ({ words, className = "" }: { words: string[], className?: string }) => {
  const [index, setIndex] = useState(0);
  const longestWord = [...words].sort((a, b) => b.length - a.length)[0];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span className={`inline-grid ${className}`}>
      <span className="col-start-1 row-start-1 invisible">{longestWord}</span>
      <AnimatePresence>
        <motion.span
          key={index}
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -15, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="col-start-1 row-start-1"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

// Sub-components as individual constants to keep App clean
const Hero = ({ onJoin, onExplore, loading }: { onJoin: () => void, onExplore: () => void, loading: boolean }) => {
  return (
    <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center min-h-[90vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FE9900]/10 text-[#FE9900] text-sm font-semibold mb-8 border border-[#FE9900]/20">
          <span className="w-2 h-2 rounded-full bg-[#FE9900] animate-pulse"></span>
          India's Premium Prep Circle
        </div>
        
        <p className="text-2xl md:text-3xl font-medium text-gray-300 mb-3">Ab Sapne Honge Sach.</p>
        <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight">
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">Ambition से</span>
          <span className="block text-[#FE9900]">Admission तक</span>
        </h1>
        
        <p className="text-xl text-gray-400 mb-10 max-w-lg leading-relaxed">
          Crack <RotatingText words={['JEE', 'NEET', 'CUET']} className="text-white font-bold" /> for just <strong className="text-white font-bold">₹999</strong>. Supercharge your prep with <RotatingText words={['Best mocks', '24/7 AI Tutor', 'Peer Learning']} className="text-[#FE9900] font-bold" />.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4"> 
          <button 
            onClick={onJoin}
            disabled={loading}
            className="px-8 py-4 rounded-xl bg-[#FE9900] text-[#0A0F1B] font-bold text-lg hover:bg-[#e58a00] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(254,153,0,0.3)] cursor-pointer disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start Free Trial"} <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            onClick={onExplore}
            className="px-8 py-4 rounded-xl bg-[#131C31] text-white font-medium text-lg hover:bg-[#1a2642] transition-colors border border-gray-800 flex items-center justify-center gap-2 hover:border-gray-600 cursor-pointer"
          >
            <PlayCircle className="w-5 h-5 text-gray-400" /> Explore Features
          </button>
        </div>
        
        <div className="mt-10 flex items-center gap-4 text-sm text-gray-500">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <img key={i} src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Student" className="w-8 h-8 rounded-full border-2 border-[#0A0F1B]" />
            ))}
          </div>
          <p>Joined by <span className="text-white font-semibold">15,000+</span> students this month</p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative lg:ml-auto w-full max-w-lg"
      >
        <div className="aspect-[4/5] rounded-3xl overflow-hidden relative border border-gray-800 shadow-2xl">
           <img 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
            alt="Indian students studying together" 
            className="object-cover w-full h-full opacity-70"
          />
           <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1B] via-[#0A0F1B]/20 to-transparent"></div>
        </div>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute -bottom-6 -left-6 md:-left-12 bg-[#131C31]/90 backdrop-blur-md p-5 rounded-2xl border border-gray-700 shadow-2xl flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-[#FE9900]/20 flex items-center justify-center shrink-0">
            <BarChart3 className="text-[#FE9900] w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Average Rank Boost</p>
            <p className="text-xl font-bold text-white">+24% in 3 months</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute top-12 -right-6 md:-right-12 bg-[#131C31]/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-gray-700 shadow-2xl flex items-center gap-3"
        >
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <p className="text-sm font-medium text-white">AI Tutor Online</p>
        </motion.div>
      </motion.div>
    </section>
  );
};

const Highlights = () => {
  return (
    <section className="py-12 border-y border-gray-800 bg-[#131C31]/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-800">
          <div className="flex flex-col items-center text-center px-4 pt-8 md:pt-0">
            <div className="w-12 h-12 rounded-full bg-[#FE9900]/10 flex items-center justify-center mb-4 border border-[#FE9900]/20">
              <GraduationCap className="text-[#FE9900] w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Built by Founders from</h3>
            <p className="text-gray-400 font-medium">IIM Ahmedabad & IIT Bombay</p>
          </div>
          <div className="flex flex-col items-center text-center px-4 pt-8 md:pt-0">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
              <Sparkles className="text-blue-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">AI-Native Platform</h3>
            <p className="text-gray-400 font-medium">Education reimagined with Artificial Intelligence.</p>
          </div>
          <div className="flex flex-col items-center text-center px-4 pt-8 md:pt-0">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4 border border-green-500/20">
              <Users2 className="text-green-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Learn With Peers</h3>
            <p className="text-gray-400 font-medium">Collaborative study rooms and community support.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const Stats = () => {
  return (
    <section className="py-12 border-b border-gray-800 bg-[#131C31]/30">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-12 leading-tight text-center">सपनों के College <span className="text-[#FE9900]">अब दूर नहीं।</span></h2>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <span className="text-2xl font-black tracking-tighter">IIT BOMBAY</span>
          <span className="text-2xl font-black tracking-tighter">AIIMS DELHI</span>
          <span className="text-2xl font-black tracking-tighter">SRCC</span>
          <span className="text-2xl font-black tracking-tighter">IIT MADRAS</span>
          <span className="text-2xl font-black tracking-tighter">BIT MESRA</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-center divide-y md:divide-y-0 md:divide-x divide-gray-800">
          <div className="pt-8 md:pt-0">
            <h3 className="text-5xl font-black text-white mb-2">99.8<span className="text-[#FE9900]">%</span></h3>
            <p className="text-gray-400 font-medium">Student Satisfaction</p>
          </div>
          <div className="pt-8 md:pt-0">
            <h3 className="text-5xl font-black text-white mb-2">15k<span className="text-[#FE9900]">+</span></h3>
            <p className="text-gray-400 font-medium">Monthly Active Learners</p>
          </div>
          <div className="pt-8 md:pt-0">
            <h3 className="text-5xl font-black text-white mb-2"><span className="text-[#FE9900]">₹</span>0</h3>
            <p className="text-gray-400 font-medium">Hidden Charges</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  return (
    <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
      <div className="mb-20 max-w-2xl">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Don't just memorize, <br/><span className="text-[#FE9900]">समझना सीखें।</span></h2>
        <p className="text-xl text-gray-400 leading-relaxed">Zero distractions, pure focus. We've replaced the clutter with a focused, editorial study experience that respects your time and intelligence.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
        <div className="md:col-span-2 bg-[#131C31] rounded-[2rem] p-10 border border-gray-800 relative overflow-hidden group hover:border-gray-600 transition-colors">
          <div className="relative z-10 max-w-md">
            <div className="w-14 h-14 rounded-2xl bg-[#FE9900]/10 flex items-center justify-center mb-8 border border-[#FE9900]/20">
              <BarChart3 className="text-[#FE9900] w-7 h-7" />
            </div>
            <h3 className="text-3xl font-bold mb-4">AI-Powered Precision</h3>
            <p className="text-gray-400 text-lg leading-relaxed">Detailed analytics that pinpoint your weak concepts across Physics, Chemistry, and Math. <span className="text-gray-300 font-medium">Target your weak spots with precision.</span></p>
          </div>
          <div className="absolute right-0 bottom-0 w-1/2 h-2/3 flex items-end gap-2 p-8 opacity-40 group-hover:opacity-100 transition-opacity duration-500">
            <div className="w-full bg-gray-800 rounded-t-lg h-[30%]"></div>
            <div className="w-full bg-gray-700 rounded-t-lg h-[50%]"></div>
            <div className="w-full bg-[#FE9900] rounded-t-lg h-[80%] shadow-[0_0_30px_rgba(254,153,0,0.4)]"></div>
            <div className="w-full bg-gray-800 rounded-t-lg h-[40%]"></div>
          </div>
        </div>

        <div className="md:row-span-2 bg-gradient-to-br from-[#FE9900] to-[#cc7a00] rounded-[2rem] p-10 text-[#0A0F1B] relative overflow-hidden flex flex-col shadow-[0_0_50px_rgba(254,153,0,0.15)]">
          <div className="w-14 h-14 rounded-2xl bg-[#0A0F1B]/10 flex items-center justify-center mb-8 backdrop-blur-sm">
            <Target className="text-[#0A0F1B] w-7 h-7" />
          </div>
          <h3 className="text-4xl font-black mb-4 tracking-tight">Rank Predictor</h3>
          <p className="text-[#0A0F1B]/80 text-lg font-medium leading-relaxed mb-8">Know where you stand against 15,000+ peers in real-time. Accuracy within 5% of final exam trends. <br/><br/><span className="font-bold text-[#0A0F1B]">Know your actual level.</span></p>
          <div className="mt-auto bg-[#0A0F1B]/10 rounded-3xl p-8 backdrop-blur-md border border-[#0A0F1B]/10">
            <p className="text-sm font-bold uppercase tracking-widest mb-2 text-[#0A0F1B]/70">Predicted JEE Rank</p>
            <p className="text-6xl font-black tracking-tighter">#432</p>
          </div>
        </div>

        <div className="bg-[#131C31] rounded-[2rem] p-10 border border-gray-800 hover:border-gray-600 transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FE9900]/5 rounded-full blur-3xl group-hover:bg-[#FE9900]/10 transition-colors"></div>
          <div className="w-14 h-14 rounded-2xl bg-[#FE9900]/10 flex items-center justify-center mb-6 border border-[#FE9900]/20">
            <Users className="text-[#FE9900] w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Peer Learning Rooms</h3>
          <p className="text-gray-400 leading-relaxed">Solve doubts with top-rankers in focused study sprints. <span className="text-gray-300">Learn together with top-rankers.</span></p>
        </div>

        <div className="bg-[#131C31] rounded-[2rem] p-10 border border-gray-800 hover:border-gray-600 transition-colors relative overflow-hidden group">
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
            <BookOpen className="text-blue-400 w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Smart Live Notes</h3>
          <p className="text-gray-400 leading-relaxed">Clean, structured, and interactive. <span className="text-gray-300">Ready-made notes for every class.</span></p>
        </div>
      </div>
    </section>
  );
};

const Pricing = React.forwardRef<HTMLElement, { onJoin: () => void, loading: boolean }>(({ onJoin, loading }, ref) => {
  return (
    <section ref={ref} id="stories" className="py-32 px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FE9900]/5 blur-[150px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">One Subscription. <br/><span className="text-gray-500">That's all you need.</span></h2>
        <p className="text-xl text-gray-400 mb-16 font-medium">Elite prep, democratic pricing. No contracts, cancel anytime.</p>

        <div className="bg-[#131C31]/80 backdrop-blur-xl border border-gray-700 rounded-[2.5rem] p-8 md:p-14 max-w-md mx-auto relative shadow-2xl">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-[#FE9900] to-transparent"></div>
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#FE9900] text-[#0A0F1B] text-xs font-black tracking-widest uppercase mb-8 shadow-[0_0_20px_rgba(254,153,0,0.4)]">
            Viral Pricing
          </div>
          <div className="flex items-start justify-center gap-1 mb-6">
            <span className="text-3xl font-bold text-gray-400 mt-2">₹</span>
            <span className="text-8xl font-black text-white tracking-tighter">999</span>
            {/* <span className="text-xl text-gray-500 mt-auto mb-2 font-medium">/month</span> */}
          </div>
          <p className="text-gray-300 mb-10 font-medium">Full access to JEE, NEET, and CUET modules</p>
          <ul className="space-y-5 text-left mb-12">
            {['Unlimited Adaptive Mock Tests', '24/7 AI Tutor Access', 'Rank Prediction Analytics', 'Global Peer Study Rooms'].map((feature, i) => (
              <li key={i} className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-[#FE9900]/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-[#FE9900]" />
                </div>
                <span className="text-gray-300 font-medium">{feature}</span>
              </li>
            ))}
          </ul>
          <button 
            onClick={onJoin}
            disabled={loading}
            className="w-full py-5 rounded-2xl bg-[#FE9900] text-[#0A0F1B] font-black text-lg hover:bg-[#e58a00] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(254,153,0,0.2)] cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Join Preptribe"}
          </button>
          <p className="text-sm text-gray-500 mt-6 font-medium">Join 50,000+ students. 7-day free trial.</p>
        </div>
      </div>
    </section>
  );
});

const Testimonials = () => {
  return (
    <section className="py-32 px-6 max-w-7xl mx-auto border-t border-gray-800/50">
      <div className="grid lg:grid-cols-2 gap-20 items-center">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
            Hear from the tribe members who made it to the <span className="text-[#FE9900]">Top 1%</span>.
          </h2>
          <p className="text-xl text-gray-400 mb-12">Don't just take our word for it. Hear from the tribe members who transformed their preparation.</p>
          <div className="bg-gradient-to-br from-[#131C31] to-[#0A0F1B] p-10 rounded-[2rem] border border-gray-800 relative shadow-xl">
            <div className="absolute -top-8 left-10 text-8xl text-[#FE9900] font-serif opacity-20 leading-none">"</div>
            <p className="text-2xl text-gray-200 italic mb-10 relative z-10 leading-relaxed font-light">
              "Preptribe's AI analytics was a game changer. It told me exactly which part of Electromagnetics I was failing at, not just 'Physics'."
            </p>
            <div className="flex items-center gap-5">
              <img src="https://i.pravatar.cc/150?img=11" alt="Aman Gupta" className="w-14 h-14 rounded-full border-2 border-gray-700" />
              <div>
                <p className="font-bold text-white text-lg">Aman Gupta</p>
                <p className="text-sm text-[#FE9900] font-medium">IIT Delhi, Batch of '27</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            { title: "99.95 Percentile", quote: "The rank predictor was spooky accurate. Highly recommend.", author: "Sneha P." },
            { title: "AIIMS Rank 42", quote: "Best biology peer learning sessions I've attended.", author: "Rahul K." },
            { title: "CUET Topper", quote: "₹99/mo felt like a steal for the quality of notes.", author: "Ishita V." },
            { title: "IITB Rank 156", quote: "The Mock UI is identical to the actual exam!", author: "Karan J." }
          ].map((item, i) => (
            <div key={i} className="bg-[#131C31]/40 p-8 rounded-3xl border border-gray-800/50 hover:border-[#FE9900]/30 hover:bg-[#131C31] transition-all duration-300 group">
              <h4 className="text-[#FE9900] font-bold mb-4 text-lg group-hover:scale-105 origin-left transition-transform">{item.title}</h4>
              <p className="text-gray-300 mb-6 leading-relaxed">"{item.quote}"</p>
              <p className="text-gray-500 text-sm font-medium">— {item.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-[#0A0F1B] border-t border-gray-800/50 pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
        <div className="md:col-span-5">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#FE9900] rounded-xl flex items-center justify-center">
              <span className="text-[#0A0F1B] font-black text-2xl leading-none">P</span>
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">Preptribe</span>
          </div>
          <p className="text-gray-400 max-w-sm text-lg leading-relaxed mb-6">
            Curating the future of elite test preparation through technology and community.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800/50 text-gray-400 text-sm border border-gray-700">
            By <span className="text-white font-bold">EduNext</span>
          </div>
        </div>
        <div className="md:col-span-2 md:col-start-8">
          <h4 className="text-white font-bold mb-6 tracking-wider uppercase text-sm">Platform</h4>
          <ul className="space-y-4 text-gray-400 font-medium">
            <li><a href="#" className="hover:text-[#FE9900] transition-colors">Mocks</a></li>
            <li><a href="#" className="hover:text-[#FE9900] transition-colors">Lectures</a></li>
            <li><a href="#" className="hover:text-[#FE9900] transition-colors">AI Tutor</a></li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <h4 className="text-white font-bold mb-6 tracking-wider uppercase text-sm">Company</h4>
          <ul className="space-y-4 text-gray-400 font-medium">
            <li><a href="#" className="hover:text-[#FE9900] transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-[#FE9900] transition-colors">Privacy</a></li>
            <li><a href="#" className="hover:text-[#FE9900] transition-colors">Terms</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-800/50 text-sm text-gray-500 font-medium">
        <p>© 2026 Preptribe by EduNext. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">Instagram</a>
          <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const { loginWithGoogle, user } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pricingRef = useRef<HTMLElement>(null);

  // Redirection Logic
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleAuth = async () => {
    try {
      setIsSigningIn(true);
      await loginWithGoogle();
    } catch (err) {
      console.error("Sign-in failed:", err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0A0F1B] text-white font-sans selection:bg-[#FE9900] selection:text-[#0A0F1B]">
      <Navbar />
      <main>
        <Hero 
          onJoin={handleAuth} 
          onExplore={scrollToPricing} 
          loading={isSigningIn} 
        />
        <Highlights />
        <Stats />
        <Features />
        <Pricing 
          ref={pricingRef} 
          onJoin={handleAuth} 
          loading={isSigningIn} 
        />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}