import { GoogleGenAI } from "@google/genai";
import { ExamType, EXAM_CONFIGS } from './examConfig';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

// ─── Types ───────────────────────────────────────────────────────────

export interface WeeklyReport {
  overallGrade: string; // A+ to F
  overallMessage: string;
  strengths: string[];
  weaknesses: string[];
  subjectAnalysis: {
    subject: string;
    grade: string;
    accuracy: number;
    trend: 'improving' | 'declining' | 'stable';
    weakTopics: string[];
    strongTopics: string[];
    tip: string;
  }[];
  errorPatterns: string[];
  timeAnalysis: string;
  nextWeekFocus: string[];
  motivationalNote: string;
}

export interface DailyPlan {
  greeting: string;
  morningWarmup: {
    title: string;
    description: string;
    duration: string;
    topics: string[];
  };
  mainPractice: {
    title: string;
    description: string;
    duration: string;
    subjects: { subject: string; topics: string[]; questionCount: number }[];
  };
  afternoonTarget: {
    title: string;
    description: string;
    duration: string;
    focusArea: string;
  };
  eveningRecall: {
    title: string;
    description: string;
    duration: string;
    revisionTopics: string[];
  };
  motivationalQuote: string;
  estimatedXP: number;
}

export interface TutorMessage {
  role: 'user' | 'tutor';
  content: string;
}

// ─── Meri Report — Weekly AI Diagnosis ───────────────────────────────

export const generateWeeklyReport = async (
  userName: string,
  historyData: any[],
  currentStreak: number,
  totalXP: number,
  exam?: ExamType,
  cuetDomains?: string[]
): Promise<WeeklyReport> => {
  const model = "gemini-2.5-flash-lite";
  const examType = exam || 'JEE';
  const config = EXAM_CONFIGS[examType];
  let subjects = config.subjects.join('/');
  if (examType === 'CUET' && cuetDomains && cuetDomains.length > 0) {
    subjects = ['English', 'General Test', ...cuetDomains].join('/');
  }

  // Prepare history summary for the AI
  const historySummary = historyData.map(h => ({
    challengeId: h.challengeId,
    totalScore: h.totalScore,
    maxScore: h.maxScore,
    accuracy: h.accuracy,
    subjectBreakdown: h.subjectBreakdown,
    timeSpent: h.timeSpent,
    date: h.completedAt?.toDate?.()?.toISOString?.() || h.completedAt || 'unknown'
  }));

  const prompt = `You are an expert ${config.fullName} coach analyzing a student's weekly performance data.

Student: ${userName}
Exam: ${config.fullName}
Subjects: ${subjects}
Current Streak: ${currentStreak} days
Total XP: ${totalXP}

Last 7 days attempt history (JSON):
${JSON.stringify(historySummary, null, 2)}

Analyze this data and generate a weekly diagnosis report. Be encouraging but honest. Use a mix of English and Hindi (Hinglish) naturally — like a caring teacher would talk to their student. Keep it conversational and motivating.

IMPORTANT: This student is preparing for ${config.fullName}. Only analyze subjects relevant to ${config.fullName}: ${subjects}. Do NOT mention JEE/NEET subjects if the exam is different.

Return a JSON object with this EXACT structure:
{
  "overallGrade": "A+/A/B+/B/C+/C/D/F",
  "overallMessage": "A 2-3 sentence summary in Hinglish about their week",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "subjectAnalysis": [
    {
      "subject": "one of: ${subjects}",
      "grade": "A-F",
      "accuracy": 0.75,
      "trend": "improving/declining/stable",
      "weakTopics": ["topic1"],
      "strongTopics": ["topic1"],
      "tip": "One actionable tip"
    }
  ],
  "errorPatterns": ["pattern1", "pattern2"],
  "timeAnalysis": "Brief analysis of their time management",
  "nextWeekFocus": ["focus1", "focus2", "focus3"],
  "motivationalNote": "A personal, warm message in Hinglish"
}

If data is sparse, still provide helpful analysis based on whatever is available. Never leave arrays empty — always give at least general ${config.fullName} prep advice.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
      },
    });

    const text = response.text || "{}";
    // Clean up any markdown code fences
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Error generating weekly report:", error);
    return getDefaultReport(userName);
  }
};

function getDefaultReport(userName: string): WeeklyReport {
  return {
    overallGrade: 'B',
    overallMessage: `${userName}, is hafte ka data thoda kam hai but you're showing up — that's what matters! Keep the momentum going.`,
    strengths: ['Consistent daily practice', 'Good attempt rate'],
    weaknesses: ['Need more practice in weak areas', 'Time management can improve'],
    subjectAnalysis: [],
    errorPatterns: ['Rushing through calculations', 'Not reading questions carefully'],
    timeAnalysis: 'Try to spend equal time across all subjects.',
    nextWeekFocus: ['Revise weak topics from this week', 'Attempt at least 1 full mock', 'Focus on accuracy'],
    motivationalNote: `${userName}, yaad rakh — topper bhi ek din beginner tha. Tu kar sakta hai! 💪🔥`
  };
}

// ─── Aaj Ka Plan — Daily Schedule ────────────────────────────────────

export const generateDailyPlan = async (
  userName: string,
  weakTopics: string[],
  recentHistory: any[],
  currentStreak: number,
  dayOfWeek: string,
  exam?: ExamType,
  cuetDomains?: string[]
): Promise<DailyPlan> => {
  const model = "gemini-2.5-flash-lite";
  const examType = exam || 'JEE';
  const config = EXAM_CONFIGS[examType];
  let subjects = config.subjects;
  if (examType === 'CUET' && cuetDomains && cuetDomains.length > 0) {
    subjects = ['English', 'General Test', ...cuetDomains];
  }
  const subjectsStr = subjects.join(', ');

  const prompt = `You are a caring ${config.fullName} coach creating a personalized daily study plan.

Student: ${userName}
Exam: ${config.fullName}
Subjects: ${subjectsStr}
Day: ${dayOfWeek}
Current Streak: ${currentStreak} days
Weak Topics: ${weakTopics.join(', ') || 'General revision needed'}
Recent Performance: ${recentHistory.length} attempts in last 3 days

IMPORTANT: This student is preparing for ${config.fullName}, NOT JEE or any other exam. Only use subjects from: ${subjectsStr}. Do NOT suggest Physics/Chemistry/Mathematics if the exam is CUET (unless those are the student's chosen domain subjects).

Create a realistic, achievable daily plan. Use Hinglish naturally. Be warm and motivating like a big brother/sister guiding them.

The plan should have 4 blocks:
1. Morning Warmup (15-20 min) — Light revision or quick practice
2. Main Practice (45-60 min) — Focused problem solving on weak areas
3. Afternoon Target (30 min) — One specific skill or topic deep-dive
4. Evening Recall (15-20 min) — Quick revision of what was done today

Return a JSON object with this EXACT structure:
{
  "greeting": "A warm Hinglish greeting based on the day",
  "morningWarmup": {
    "title": "Catchy title",
    "description": "What to do in 1-2 sentences",
    "duration": "15 min",
    "topics": ["topic1", "topic2"]
  },
  "mainPractice": {
    "title": "Catchy title",
    "description": "What to do",
    "duration": "45 min",
    "subjects": [
      { "subject": "one of ${subjectsStr}", "topics": ["relevant topic"], "questionCount": 10 }
    ]
  },
  "afternoonTarget": {
    "title": "Catchy title",
    "description": "What to focus on",
    "duration": "30 min",
    "focusArea": "Specific topic or skill"
  },
  "eveningRecall": {
    "title": "Catchy title",
    "description": "How to revise",
    "duration": "15 min",
    "revisionTopics": ["topic1", "topic2"]
  },
  "motivationalQuote": "An inspiring quote or Hinglish message",
  "estimatedXP": 150
}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
      },
    });

    const text = response.text || "{}";
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Error generating daily plan:", error);
    return getDefaultPlan(userName, dayOfWeek);
  }
};

function getDefaultPlan(userName: string, dayOfWeek: string): DailyPlan {
  return {
    greeting: `Good morning ${userName}! ${dayOfWeek} hai — let's make it count! 🚀`,
    morningWarmup: {
      title: '☀️ Brain Warm-Up',
      description: 'Solve 5 quick MCQs from yesterday\'s weak areas. Speed matters here — don\'t overthink!',
      duration: '15 min',
      topics: ['Previous day revision', 'Quick formulas']
    },
    mainPractice: {
      title: '🎯 Power Practice Hour',
      description: 'Deep problem-solving session. Focus on understanding concepts, not just answers.',
      duration: '45 min',
      subjects: [
        { subject: 'Your weakest subject', topics: ['Weak topics'], questionCount: 10 },
        { subject: 'Mixed practice', topics: ['All subjects'], questionCount: 12 }
      ]
    },
    afternoonTarget: {
      title: '🔬 Deep Dive',
      description: 'Pick one weak topic and solve 10 problems of increasing difficulty.',
      duration: '30 min',
      focusArea: 'Your weakest topic from this week'
    },
    eveningRecall: {
      title: '🌙 Night Recall',
      description: 'Quick flashcard review of formulas and concepts covered today.',
      duration: '15 min',
      revisionTopics: ['Today\'s weak areas', 'Key formulas', 'Error analysis']
    },
    motivationalQuote: 'Har din ek step forward — that\'s how toppers are made. Tu bhi kar sakta hai! 💪',
    estimatedXP: 120
  };
}

// ─── Doubt Samjhao — AI Tutor ───────────────────────────────────────

export const askDoubtTutor = async (
  questionText: string,
  options: string[],
  correctAnswer: number,
  studentAnswer: number | null,
  explanation: string,
  subject: string,
  chatHistory: TutorMessage[],
  studentMessage: string
): Promise<string> => {
  const model = "gemini-2.5-flash-lite";

  const historyStr = chatHistory.map(m =>
    `${m.role === 'user' ? 'Student' : 'Teacher'}: ${m.content}`
  ).join('\n');

  const prompt = `You are a patient, encouraging JEE Mains tutor. A student got a question wrong and needs help understanding it.

QUESTION: ${questionText}
OPTIONS: ${options.map((o, i) => `${i}. ${o}`).join('\n')}
CORRECT ANSWER: Option ${correctAnswer}
STUDENT'S ANSWER: ${studentAnswer !== null ? `Option ${studentAnswer}` : 'Not attempted'}
STANDARD EXPLANATION: ${explanation}
SUBJECT: ${subject}

PREVIOUS CONVERSATION:
${historyStr || 'None yet'}

STUDENT'S NEW MESSAGE: ${studentMessage}

Rules:
1. Explain step by step in simple language — like teaching a younger sibling
2. Use Hinglish naturally where it helps (e.g., "Dekh, yahan pe..." or "Samajh aa gaya?")
3. If the student says "samajh nahi aaya" or similar, break it down even further
4. Use LaTeX for math ($..$ for inline, $$...$$ for block)
5. Be warm and encouraging — never make them feel stupid
6. Keep responses concise (3-5 sentences max unless a detailed explanation is needed)
7. If they ask about a different concept, gently relate it back to the question
8. End with a small question to check understanding when appropriate

Respond as the tutor (just your message, no "Teacher:" prefix):`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: 1024,
      },
    });

    return response.text || "Sorry, I couldn't process that. Can you try asking again?";
  } catch (error) {
    console.error("Error in doubt tutor:", error);
    return "Oops, kuch technical issue aa gaya. Ek baar phir try kar — I'm here to help! 🤗";
  }
};

// ─── Smart Notifications ─────────────────────────────────────────────

export interface SmartNotification {
  id: string;
  type: 'streak_risk' | 'morning_plan' | 'celebration' | 'topic_reminder' | 'weekly_report' | 'comeback' | 'milestone';
  title: string;
  message: string;
  icon: string;
  color: string;
  action?: string; // route to navigate to
  createdAt: Date;
  read: boolean;
}

export const generateSmartNotifications = (
  profile: any,
  recentHistory: any[],
  lastActiveDate: string | undefined
): SmartNotification[] => {
  const notifications: SmartNotification[] = [];
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const hour = now.getHours();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = dayNames[now.getDay()];

  // 1. Morning Plan Reminder (6 AM - 10 AM)
  if (hour >= 6 && hour <= 10) {
    notifications.push({
      id: `morning-${today}`,
      type: 'morning_plan',
      title: '☀️ Aaj Ka Plan Ready!',
      message: `Good morning! ${dayOfWeek} ka personalized plan ready hai. Let's start strong!`,
      icon: '📋',
      color: 'amber',
      action: '/aaj-ka-plan',
      createdAt: now,
      read: false
    });
  }

  // 2. Streak at Risk
  if (lastActiveDate && lastActiveDate !== today) {
    const lastDate = new Date(lastActiveDate);
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1 && hour >= 18) {
      notifications.push({
        id: `streak-risk-${today}`,
        type: 'streak_risk',
        title: '🔥 Streak in Danger!',
        message: `Tera ${profile.currentStreak || 0}-day streak aaj raat tod sakta hai! Quick — ek challenge complete kar.`,
        icon: '⚠️',
        color: 'rose',
        action: '/test/daily-mini-mock',
        createdAt: now,
        read: false
      });
    } else if (diffDays >= 2) {
      notifications.push({
        id: `comeback-${today}`,
        type: 'comeback',
        title: '💪 Welcome Back!',
        message: `${diffDays} din ho gaye! Koi baat nahi — aaj se fresh start. Grace days use karke streak bacha sakte ho.`,
        icon: '🔄',
        color: 'blue',
        action: '/',
        createdAt: now,
        read: false
      });
    }
  }

  // 3. Milestones
  const totalXP = profile.totalScore || 0;
  const milestones = [100, 500, 1000, 2500, 5000, 10000];
  for (const milestone of milestones) {
    if (totalXP >= milestone && totalXP < milestone + 50) {
      notifications.push({
        id: `milestone-${milestone}`,
        type: 'milestone',
        title: '🏆 Milestone Unlocked!',
        message: `${milestone} XP cross kar liya! Tu sach mein consistent hai. Keep going! 🎉`,
        icon: '⭐',
        color: 'amber',
        createdAt: now,
        read: false
      });
    }
  }

  // 4. Streak Celebrations
  const streak = profile.currentStreak || 0;
  if ([3, 7, 14, 21, 30, 50, 100].includes(streak)) {
    notifications.push({
      id: `streak-celebrate-${streak}`,
      type: 'celebration',
      title: '🎊 Streak Celebration!',
      message: `${streak} days straight! ${streak >= 7 ? 'JEE toppers bhi isse zyada consistent nahi hote!' : 'Bahut badhiya, keep it up!'}`,
      icon: '🔥',
      color: 'amber',
      createdAt: now,
      read: false
    });
  }

  // 5. Weekly Report Ready (Sundays)
  if (dayOfWeek === 'Sunday') {
    notifications.push({
      id: `weekly-report-${today}`,
      type: 'weekly_report',
      title: '📊 Meri Report Ready!',
      message: 'Is hafte ki poori analysis ready hai. Dekh ke apni strategy plan kar!',
      icon: '📈',
      color: 'emerald',
      action: '/meri-report',
      createdAt: now,
      read: false
    });
  }

  // 6. Topic Revision Reminder (afternoon)
  if (hour >= 14 && hour <= 16 && recentHistory.length > 0) {
    notifications.push({
      id: `topic-revision-${today}`,
      type: 'topic_reminder',
      title: '🧠 Spaced Repetition Alert',
      message: 'Kal jo topics weak the, unka quick revision kar le. 15 min is enough!',
      icon: '🔄',
      color: 'violet',
      action: '/flashcards',
      createdAt: now,
      read: false
    });
  }

  return notifications;
};
