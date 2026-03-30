import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface PsycheState {
  state: 'demotivation' | 'anxiety' | 'overconfidence' | 'burnout' | 'flow';
  score: number;
  signals: string[];
  emoji: string;
}

export interface PsycheAnalysis {
  dominantState: PsycheState;
  allStates: PsycheState[];
  interventionNeeded: boolean;
  intervention: string | null;
  timestamp: Date;
}

interface AttemptData {
  challengeId: string;
  totalScore: number;
  maxScore: number;
  accuracy: number;
  timeSpent: number;
  timestamp: Date | number;
  subjectBreakdown?: Record<string, number>;
  results?: Array<{
    correct: boolean;
    timeSpent: number;
    isReattempt?: boolean;
  }>;
}

interface StudentProfile {
  currentStreak: number;
  totalScore: number;
  lastActiveDate: Date | number;
  totalActiveDays: number;
}

const STATE_EMOJIS: Record<string, string> = {
  demotivation: '😔',
  anxiety: '😰',
  overconfidence: '😤',
  burnout: '🥵',
  flow: '🧘',
};

/**
 * Calculate demotivation score based on activity patterns
 */
function calculateDemotivationScore(
  historyData: AttemptData[],
  profile: StudentProfile
): { score: number; signals: string[] } {
  let score = 0;
  const signals: string[] = [];

  if (historyData.length === 0) {
    return { score: 0, signals };
  }

  // Check for gaps between sessions
  const sortedHistory = [...historyData].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let maxGap = 0;
  for (let i = 1; i < sortedHistory.length; i++) {
    const gap =
      (new Date(sortedHistory[i].timestamp).getTime() -
        new Date(sortedHistory[i - 1].timestamp).getTime()) /
      (1000 * 60 * 60 * 24);
    maxGap = Math.max(maxGap, gap);
  }

  if (maxGap > 2) {
    score += 0.3;
    signals.push(`Long gap between sessions: ${maxGap.toFixed(1)} days`);
  }

  // Check accuracy decline over last 5 attempts
  const last5 = sortedHistory.slice(-5);
  if (last5.length >= 2) {
    const recentAccuracies = last5.map((a) => a.accuracy);
    const firstAccuracy = recentAccuracies[0];
    const lastAccuracy = recentAccuracies[recentAccuracies.length - 1];

    if (lastAccuracy < firstAccuracy - 0.1) {
      score += 0.3;
      signals.push(
        `Accuracy declining: ${(firstAccuracy * 100).toFixed(0)}% → ${(lastAccuracy * 100).toFixed(0)}%`
      );
    }
  }

  // Check attempt frequency (< 1 per day in last week)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const lastWeekAttempts = historyData.filter(
    (a) => new Date(a.timestamp) >= oneWeekAgo
  ).length;
  const daysSinceLastWeek = 7;
  const attemptsPerDay = lastWeekAttempts / daysSinceLastWeek;

  if (attemptsPerDay < 1) {
    score += 0.4;
    signals.push(
      `Low activity: ${attemptsPerDay.toFixed(2)} attempts/day in last 7 days`
    );
  }

  return {
    score: Math.min(score, 1),
    signals,
  };
}

/**
 * Calculate anxiety score based on rushing and reattempts
 */
function calculateAnxietyScore(
  historyData: AttemptData[]
): { score: number; signals: string[] } {
  let score = 0;
  const signals: string[] = [];

  if (historyData.length === 0) {
    return { score: 0, signals };
  }

  // Check for very fast answering (< 30 seconds per question)
  const avgTimePerQuestion =
    historyData.reduce((sum, a) => sum + a.timeSpent, 0) / historyData.length;

  if (avgTimePerQuestion < 30) {
    score += 0.3;
    signals.push(`Rushing through questions: ${avgTimePerQuestion.toFixed(1)}s per question`);
  }

  // Check for low accuracy despite attempts today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAttempts = historyData.filter(
    (a) =>
      new Date(a.timestamp).toDateString() === today.toDateString()
  );

  if (todayAttempts.length >= 3) {
    const avgAccuracy =
      todayAttempts.reduce((sum, a) => sum + a.accuracy, 0) /
      todayAttempts.length;
    if (avgAccuracy < 0.4) {
      score += 0.4;
      signals.push(
        `Low accuracy despite multiple attempts: ${(avgAccuracy * 100).toFixed(0)}% today`
      );
    }
  }

  // Check for reattempts
  const reattemptCount = historyData.filter((a) => {
    if (a.results) {
      return a.results.some((r) => r.isReattempt);
    }
    return false;
  }).length;

  if (reattemptCount > historyData.length * 0.3) {
    score += 0.3;
    signals.push(
      `Frequent reattempts: ${reattemptCount} out of ${historyData.length} attempts`
    );
  }

  return {
    score: Math.min(score, 1),
    signals,
  };
}

/**
 * Calculate overconfidence score based on inconsistent performance
 */
function calculateOverconfidenceScore(
  historyData: AttemptData[],
  profile: StudentProfile
): { score: number; signals: string[] } {
  let score = 0;
  const signals: string[] = [];

  if (historyData.length === 0) {
    return { score: 0, signals };
  }

  // Overall vs latest attempt accuracy
  const overallAccuracy =
    historyData.reduce((sum, a) => sum + a.accuracy, 0) / historyData.length;
  const latest = historyData[historyData.length - 1];

  if (overallAccuracy > 0.8 && latest.accuracy < 0.5) {
    score += 0.4;
    signals.push(
      `Inconsistent performance: Overall ${(overallAccuracy * 100).toFixed(0)}% but latest ${(latest.accuracy * 100).toFixed(0)}%`
    );
  }

  // High streak with declining accuracy
  if (profile.currentStreak > 7) {
    const sortedHistory = [...historyData].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const firstHalf = sortedHistory
      .slice(0, Math.floor(sortedHistory.length / 2))
      .reduce((sum, a) => sum + a.accuracy, 0) / Math.ceil(sortedHistory.length / 2);
    const secondHalf = sortedHistory
      .slice(Math.floor(sortedHistory.length / 2))
      .reduce((sum, a) => sum + a.accuracy, 0) / Math.floor(sortedHistory.length / 2);

    if (firstHalf > secondHalf) {
      score += 0.3;
      signals.push(
        `Streak of ${profile.currentStreak} but declining accuracy trend`
      );
    }
  }

  // Skipping review (inferred: no pattern of review-like behavior)
  const hasReviewPattern = historyData.some((a) => a.timeSpent > 5 * 60);
  if (!hasReviewPattern && historyData.length > 10) {
    score += 0.3;
    signals.push('Likely skipping detailed reviews of wrong answers');
  }

  return {
    score: Math.min(score, 1),
    signals,
  };
}

/**
 * Calculate burnout score based on excessive sessions and declining performance
 */
function calculateBurnoutScore(
  historyData: AttemptData[],
  profile: StudentProfile
): { score: number; signals: string[] } {
  let score = 0;
  const signals: string[] = [];

  if (historyData.length === 0) {
    return { score: 0, signals };
  }

  // Check for very long sessions (> 2 hours in one day)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAttempts = historyData.filter(
    (a) =>
      new Date(a.timestamp).toDateString() === today.toDateString()
  );
  const todayTotalTime = todayAttempts.reduce((sum, a) => sum + a.timeSpent, 0);

  if (todayTotalTime > 2 * 60 * 60) {
    score += 0.3;
    signals.push(
      `Excessive session today: ${(todayTotalTime / 60).toFixed(0)} minutes`
    );
  }

  // Check accuracy decline within same session
  const sortedToday = [...todayAttempts].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  if (sortedToday.length >= 3) {
    const firstAccuracy = sortedToday[0].accuracy;
    const lastAccuracy = sortedToday[sortedToday.length - 1].accuracy;

    if (lastAccuracy < firstAccuracy - 0.15) {
      score += 0.3;
      signals.push(
        `Accuracy declining within session: ${(firstAccuracy * 100).toFixed(0)}% → ${(lastAccuracy * 100).toFixed(0)}%`
      );
    }
  }

  // Check for absence after heavy activity
  const lastActiveDate = new Date(profile.lastActiveDate);
  const daysSinceActive =
    (new Date().getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceActive >= 2 && historyData.length > 10) {
    const recentActivity = historyData
      .filter((a) => {
        const diff =
          (new Date().getTime() - new Date(a.timestamp).getTime()) /
          (1000 * 60 * 60 * 24);
        return diff < 7;
      });

    if (recentActivity.length > 0) {
      score += 0.4;
      signals.push(
        `Heavy activity followed by ${daysSinceActive.toFixed(0)}-day absence`
      );
    }
  }

  return {
    score: Math.min(score, 1),
    signals,
  };
}

/**
 * Calculate flow state score based on consistent, steady performance
 */
function calculateFlowScore(
  historyData: AttemptData[],
  profile: StudentProfile
): { score: number; signals: string[] } {
  let score = 0;
  const signals: string[] = [];

  if (historyData.length === 0) {
    return { score: 0.3, signals: ['No activity data yet'] };
  }

  // Check for daily practice (3+ consecutive days)
  const sortedHistory = [...historyData].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const dates = new Set<string>();
  sortedHistory.forEach((a) => {
    dates.add(new Date(a.timestamp).toDateString());
  });

  let consecutiveDays = 1;
  let maxConsecutiveDays = 1;
  const sortedDates = Array.from(dates).sort();

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const daysDiff =
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff === 1) {
      consecutiveDays++;
      maxConsecutiveDays = Math.max(maxConsecutiveDays, consecutiveDays);
    } else {
      consecutiveDays = 1;
    }
  }

  if (maxConsecutiveDays >= 3) {
    score += 0.3;
    signals.push(`${maxConsecutiveDays} consecutive days of practice`);
  }

  // Check for stable or improving accuracy
  const accuracies = sortedHistory.map((a) => a.accuracy);
  if (accuracies.length >= 3) {
    const variance =
      accuracies.reduce((sum, acc, i) => {
        if (i < accuracies.length - 1) {
          return sum + Math.abs(accuracies[i + 1] - acc);
        }
        return sum;
      }, 0) / (accuracies.length - 1);

    if (variance < 0.15 && accuracies[accuracies.length - 1] >= 0.6) {
      score += 0.4;
      signals.push(
        `Stable, consistent performance: avg ${(accuracies.reduce((a, b) => a + b) / accuracies.length * 100).toFixed(0)}%`
      );
    }
  }

  // Check for moderate session length (20-60 minutes)
  const avgSessionTime =
    historyData.reduce((sum, a) => sum + a.timeSpent, 0) / historyData.length;

  if (avgSessionTime >= 20 * 60 && avgSessionTime <= 60 * 60) {
    score += 0.3;
    signals.push(
      `Moderate, sustainable pace: ${(avgSessionTime / 60).toFixed(0)}min per session`
    );
  }

  return {
    score: Math.min(score, 1),
    signals,
  };
}

/**
 * Main analysis function that detects all 5 behavioral states
 */
export async function analyzePsyche(
  historyData: any[],
  profile: any
): Promise<PsycheAnalysis> {
  const timestamp = new Date();

  // Calculate scores for all states
  const demotivation = calculateDemotivationScore(historyData, profile);
  const anxiety = calculateAnxietyScore(historyData);
  const overconfidence = calculateOverconfidenceScore(historyData, profile);
  const burnout = calculateBurnoutScore(historyData, profile);
  const flow = calculateFlowScore(historyData, profile);

  // Create state objects
  const allStates: PsycheState[] = [
    {
      state: 'demotivation',
      score: demotivation.score,
      signals: demotivation.signals,
      emoji: STATE_EMOJIS.demotivation,
    },
    {
      state: 'anxiety',
      score: anxiety.score,
      signals: anxiety.signals,
      emoji: STATE_EMOJIS.anxiety,
    },
    {
      state: 'overconfidence',
      score: overconfidence.score,
      signals: overconfidence.signals,
      emoji: STATE_EMOJIS.overconfidence,
    },
    {
      state: 'burnout',
      score: burnout.score,
      signals: burnout.signals,
      emoji: STATE_EMOJIS.burnout,
    },
    {
      state: 'flow',
      score: flow.score,
      signals: flow.signals,
      emoji: STATE_EMOJIS.flow,
    },
  ];

  // Find dominant state
  const dominantState = allStates.reduce((prev, current) =>
    current.score > prev.score ? current : prev
  );

  // Check if intervention is needed
  const interventionNeeded = allStates.some((state) => state.score > 0.6);

  let intervention: string | null = null;
  if (interventionNeeded && dominantState.score > 0.6) {
    // Get student name from profile or use generic
    const userName = (profile as any).userName || 'Student';
    intervention = await getInterventionMessage(dominantState, userName);
  }

  return {
    dominantState,
    allStates,
    interventionNeeded,
    intervention,
    timestamp,
  };
}

/**
 * Get a personalized intervention message from Gemini API
 */
export async function getInterventionMessage(
  state: PsycheState,
  userName: string
): Promise<string> {
  try {
    const stateDescriptions: Record<string, string> = {
      demotivation:
        'The student seems demotivated with low activity and declining performance',
      anxiety:
        'The student appears anxious, rushing through questions and making frequent reattempts',
      overconfidence:
        'The student shows signs of overconfidence with inconsistent performance',
      burnout:
        'The student may be experiencing burnout with excessive sessions and declining accuracy',
      flow:
        'The student is in a great flow state with consistent, steady performance',
    };

    const prompt = `You are a supportive JEE exam coach. A student named "${userName}" is ${stateDescriptions[state.state]}.

Generate a warm, encouraging intervention message in Hinglish (Hindi mixed with English). The message should:
- Be 2-3 sentences maximum
- Use Self-Determination Theory principles (autonomy: give them choice, competence: acknowledge their ability, relatedness: show you care)
- Be specific to their current state: ${state.state}
- Be motivational but realistic
- Include one encouraging phrase in Hindi

Keep it brief and actionable. End with a light-hearted emoji if appropriate.`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: { maxOutputTokens: 256 },
    });
    const responseText = result.text || '';

    return responseText.trim();
  } catch (error) {
    console.error('Error generating intervention message:', error);
    // Fallback messages in case of API error
    const fallbackMessages: Record<string, string> = {
      demotivation: `${userName}, we miss seeing you! 😊 Remember, consistency beats perfection. Even 10 minutes daily will get you back on track. Chal, let's start today!`,
      anxiety: `${userName}, breathe! 🧘 Take your time with each question. Quality > Quantity. Aapka effort zaroor badega!`,
      overconfidence: `${userName}, amazing streak! 🌟 But challenges are your best teachers. Let's review those tough questions together - growth happens here!`,
      burnout: `${userName}, rest is part of preparation! 💪 Quality sessions beat marathon sessions. Take a break, recharge, then come back stronger. You've got this!`,
      flow: `${userName}, you're absolutely killing it! 🔥 Keep this momentum going. Aapka dedication inspiring hai!`,
    };

    return fallbackMessages[state.state] || "Keep going! You're doing great!";
  }
}
