import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ExamType, ALL_EXAMS, EXAM_CONFIGS, CUET_DOMAIN_SUBJECTS, CuetDomainSubject } from '../services/examConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Stethoscope, GraduationCap, ArrowRight, Check } from 'lucide-react';

const examIcons: Record<ExamType, React.ReactNode> = {
  JEE: <BookOpen size={28} />,
  NEET: <Stethoscope size={28} />,
  CUET: <GraduationCap size={28} />,
};

const examDescriptions: Record<ExamType, string> = {
  JEE: 'Physics, Chemistry & Mathematics — for IIT/NIT aspirants',
  NEET: 'Physics, Chemistry & Biology — for medical college aspirants',
  CUET: 'English, General Test & Domain Subjects — for central university admissions',
};

const ExamSelector = () => {
  const { setExam } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<ExamType | null>(null);
  const [cuetDomains, setCuetDomains] = useState<CuetDomainSubject[]>([]);
  const [saving, setSaving] = useState(false);

  const canContinue = selected && (selected !== 'CUET' || cuetDomains.length > 0);

  const toggleDomain = (domain: CuetDomainSubject) => {
    setCuetDomains(prev =>
      prev.includes(domain)
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    );
  };

  const handleContinue = async () => {
    if (!canContinue) return;
    setSaving(true);
    // Set the first selected domain as primary cuetDomain (for backward compatibility with daily mocks)
    const primaryDomain = selected === 'CUET' ? cuetDomains[0] : undefined;
    const allDomains = selected === 'CUET' ? cuetDomains : undefined;
    await setExam(selected!, primaryDomain, allDomains);
    setSaving(false);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#060818] text-white flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] bg-gradient-to-br from-amber-500/15 via-orange-500/8 to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] bg-gradient-to-tl from-orange-600/10 via-amber-500/5 to-transparent rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-lg w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <span className="font-black text-xl text-[#060818]">PT</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Choose Your Exam</h1>
          <p className="text-slate-400 text-sm">Select the exam you're preparing for. You can change this later from settings.</p>
        </div>

        {/* Exam Cards */}
        <div className="space-y-3">
          {ALL_EXAMS.map((exam, i) => {
            const config = EXAM_CONFIGS[exam];
            const isSelected = selected === exam;

            return (
              <motion.button
                key={exam}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => { setSelected(exam); if (exam !== 'CUET') setCuetDomains([]); }}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
                }`}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-[#060818]'
                    : 'bg-white/5 text-slate-400'
                }`}>
                  {examIcons[exam]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-white">{config.name}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{config.fullName}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{examDescriptions[exam]}</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {config.subjects.map(s => (
                      <span key={s} className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-white/5 text-slate-500'
                      }`}>{s}</span>
                    ))}
                  </div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#060818]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* CUET Domain Subject Picker — Multi-select */}
        <AnimatePresence>
          {selected === 'CUET' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
                <div>
                  <p className="text-sm font-black text-white">Choose Your Domain Subjects</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Select one or more domains. First selected = your primary domain for daily mocks.
                    {cuetDomains.length > 0 && (
                      <span className="text-amber-400 ml-1">({cuetDomains.length} selected)</span>
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {CUET_DOMAIN_SUBJECTS.map((domain) => {
                    const isSelected = cuetDomains.includes(domain);
                    const isPrimary = cuetDomains[0] === domain;
                    return (
                      <button
                        key={domain}
                        onClick={() => toggleDomain(domain)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all border flex items-center gap-2 ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                            : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/15 hover:bg-white/[0.04]'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                          isSelected ? 'bg-amber-500 border-amber-500' : 'border-white/20'
                        }`}>
                          {isSelected && <Check size={10} className="text-[#060818]" />}
                        </span>
                        <span className="flex-1">{domain}</span>
                        {isPrimary && (
                          <span className="text-[8px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded-full font-black">PRIMARY</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue Button */}
        <motion.button
          onClick={handleContinue}
          disabled={!canContinue || saving}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
            canContinue
              ? 'bg-amber-500 hover:bg-amber-400 text-[#060818] shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-white/5 text-slate-600 cursor-not-allowed'
          }`}
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-[#060818] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Continue to PrepTribe <ArrowRight size={16} />
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default ExamSelector;
