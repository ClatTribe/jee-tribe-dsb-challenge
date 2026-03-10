export type QuestionType = 'Single MCQ' | 'Multi MCQ' | 'Numerical' | 'Match List' | 'Fill in the Blanks';
export type Subject = 'Physics' | 'Chemistry' | 'Mathematics';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Question {
  id: string;
  subject: Subject;
  topic: string;
  subtopic?: string;
  questionType: QuestionType;
  difficulty: Difficulty;
  questionText: string;
  imageUrl?: string;
  youtubeUrl?: string;
  options?: string[];
  correctAnswers: any; // string for Single, string[] for Multi, number for Numerical
  numericalTolerance?: number;
  explanation?: string;
  marksCorrect: number;
  marksWrong: number;
  tags?: string[];
}

export interface Submission {
  questionId: string;
  selectedOptions?: string[];
  numericalValue?: number;
  timeSpent: number;
  isMarkedForReview: boolean;
}

export interface TestResult {
  totalScore: number;
  maxScore: number;
  accuracy: number;
  timeSpent: number;
  marksLostToNegative: number;
  subjectBreakdown: Record<Subject, {
    score: number;
    correct: number;
    wrong: number;
    skipped: number;
    timeSpent: number;
  }>;
  results: {
    questionId: string;
    isCorrect: boolean;
    score: number;
    timeSpent: number;
  }[];
}

export const evaluateSubmission = (
  submissions: Submission[],
  questions: Question[],
  markingScheme: Record<string, { positive: number; negative: number }>
): TestResult => {
  let totalScore = 0;
  let maxScore = 0;
  let marksLostToNegative = 0;
  let totalTime = 0;
  
  const subjectBreakdown: Record<Subject, any> = {
    Physics: { score: 0, correct: 0, wrong: 0, skipped: 0, timeSpent: 0 },
    Chemistry: { score: 0, correct: 0, wrong: 0, skipped: 0, timeSpent: 0 },
    Mathematics: { score: 0, correct: 0, wrong: 0, skipped: 0, timeSpent: 0 }
  };

  const results = questions.map(q => {
    const sub = submissions.find(s => s.questionId === q.id);
    const scheme = markingScheme[q.id] || { positive: 4, negative: 1 };
    maxScore += scheme.positive;
    
    let score = 0;
    let isCorrect = false;
    const timeSpent = sub?.timeSpent || 0;
    totalTime += timeSpent;
    subjectBreakdown[q.subject].timeSpent += timeSpent;

    if (!sub || (q.questionType !== 'Numerical' && (!sub.selectedOptions || sub.selectedOptions.length === 0)) || (q.questionType === 'Numerical' && sub.numericalValue === undefined)) {
      subjectBreakdown[q.subject].skipped++;
      return { questionId: q.id, isCorrect: false, score: 0, timeSpent };
    }

    if (q.questionType === 'Single MCQ') {
      isCorrect = sub.selectedOptions![0] === q.correctAnswers;
      score = isCorrect ? scheme.positive : -scheme.negative;
    } else if (q.questionType === 'Multi MCQ') {
      const correctOnes = q.correctAnswers as string[];
      const selectedOnes = sub.selectedOptions!;
      
      const hasWrong = selectedOnes.some(opt => !correctOnes.includes(opt));
      const allCorrect = correctOnes.every(opt => selectedOnes.includes(opt)) && selectedOnes.length === correctOnes.length;
      
      if (hasWrong) {
        score = -2; // JEE Advanced default for any wrong in multi-correct
        isCorrect = false;
      } else if (allCorrect) {
        score = scheme.positive;
        isCorrect = true;
      } else {
        // Partial marking
        score = selectedOnes.length; // +1 for each correct option if no wrong chosen
        isCorrect = false; // Not fully correct but positive score
      }
    } else if (q.questionType === 'Numerical') {
      const tolerance = q.numericalTolerance || 0.01;
      isCorrect = Math.abs(sub.numericalValue! - (q.correctAnswers as number)) <= tolerance;
      score = isCorrect ? scheme.positive : (q.marksWrong || 0); // Some numerical have 0 negative
    }

    if (score < 0) {
      marksLostToNegative += Math.abs(score);
      subjectBreakdown[q.subject].wrong++;
    } else if (score > 0) {
      subjectBreakdown[q.subject].correct++;
    } else {
      subjectBreakdown[q.subject].skipped++;
    }

    totalScore += score;
    subjectBreakdown[q.subject].score += score;

    return { questionId: q.id, isCorrect, score, timeSpent };
  });

  const accuracy = (subjectBreakdown.Physics.correct + subjectBreakdown.Chemistry.correct + subjectBreakdown.Mathematics.correct) / questions.length;

  return {
    totalScore,
    maxScore,
    accuracy,
    timeSpent: totalTime,
    marksLostToNegative,
    subjectBreakdown,
    results
  };
};
