import { collection, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Question, Subject, QuestionType, Difficulty } from './evaluationUtils';

const SAMPLE_QUESTIONS: Omit<Question, 'id'>[] = [
  {
    subject: 'Physics' as Subject,
    topic: 'Mechanics',
    subtopic: 'Projectile Motion',
    questionType: 'Single MCQ' as QuestionType,
    difficulty: 'Medium' as Difficulty,
    questionText: 'A projectile is fired at an angle of 45° with the horizontal. The elevation angle of the projectile at its highest point as seen from the point of projection is:',
    options: [
      '\\tan^{-1}(1/2)',
      '\\tan^{-1}(1)',
      '\\tan^{-1}(2)',
      '45^\\circ'
    ],
    correctAnswers: '\\tan^{-1}(1/2)',
    marksCorrect: 4,
    marksWrong: 1,
    explanation: 'At the highest point, height H = u²sin²θ/2g and Range R = u²sin2θ/g. The distance from projection point to the point below the peak is R/2. Elevation angle α = tan⁻¹(H / (R/2)) = tan⁻¹(2H/R). For θ=45°, H = u²/4g and R = u²/g. So α = tan⁻¹(2 * (1/4)) = tan⁻¹(1/2).'
  },
  {
    subject: 'Chemistry' as Subject,
    topic: 'Organic Chemistry',
    subtopic: 'Isomerism',
    questionType: 'Multi MCQ' as QuestionType,
    difficulty: 'Hard' as Difficulty,
    questionText: 'Which of the following compounds will show geometrical isomerism?',
    options: [
      '2-Butene',
      '1,2-Dimethylcyclopropane',
      '1-Butene',
      'Propene'
    ],
    correctAnswers: ['2-Butene', '1,2-Dimethylcyclopropane'],
    marksCorrect: 4,
    marksWrong: 2,
    explanation: '2-Butene has cis-trans isomers. 1,2-Dimethylcyclopropane has cis-trans isomers. 1-Butene and Propene do not have different groups on one of the double-bonded carbons.'
  },
  {
    subject: 'Mathematics' as Subject,
    topic: 'Calculus',
    subtopic: 'Definite Integration',
    questionType: 'Numerical' as QuestionType,
    difficulty: 'Medium' as Difficulty,
    questionText: 'Evaluate the value of \\int_{0}^{\\pi/2} \\frac{\\sin x}{\\sin x + \\cos x} dx. (Round to 2 decimal places)',
    correctAnswers: 0.79,
    numericalTolerance: 0.01,
    marksCorrect: 4,
    marksWrong: 0,
    explanation: 'Using the property \\int_0^a f(x) dx = \\int_0^a f(a-x) dx, the integral becomes I = \\int_0^{\\pi/2} \\frac{\\cos x}{\\cos x + \\sin x} dx. Adding the two forms: 2I = \\int_0^{\\pi/2} 1 dx = \\pi/2. Thus I = \\pi/4 ≈ 0.785.'
  },
  {
    subject: 'Physics' as Subject,
    topic: 'Electrostatics',
    subtopic: 'Gauss Law',
    questionType: 'Single MCQ' as QuestionType,
    difficulty: 'Easy' as Difficulty,
    questionText: 'The electric flux through a closed surface depends on:',
    options: [
      'Net charge enclosed',
      'Shape of the surface',
      'Size of the surface',
      'Position of charge inside'
    ],
    correctAnswers: 'Net charge enclosed',
    marksCorrect: 4,
    marksWrong: 1,
    explanation: 'According to Gauss Law, Φ = q_enclosed / ε₀.'
  }
];

export const seedDatabase = async () => {
  console.log('Starting seed...');
  
  // 1. Seed Question Bank
  const questionIds: string[] = [];
  for (const q of SAMPLE_QUESTIONS) {
    const docRef = await addDoc(collection(db, 'questionBank'), {
      ...q,
      createdAt: serverTimestamp()
    });
    questionIds.push(docRef.id);
  }
  
  // 2. Create a Daily Challenge for Today
  const today = new Date().toISOString().split('T')[0];
  const markingScheme: Record<string, any> = {};
  questionIds.forEach(id => {
    markingScheme[id] = { positive: 4, negative: 1 };
  });

  await setDoc(doc(db, 'dailyChallenges', today), {
    title: 'JEE Advanced Sprint: Day 1',
    type: 'Daily Challenge',
    date: today,
    questionIds,
    markingScheme,
    duration: 30,
    totalMarks: questionIds.length * 4,
    createdAt: serverTimestamp()
  });

  // 3. Create some dummy leaderboard data
  const dummyUsers = [
    { displayName: 'Aryan Sharma', totalScore: 1250, currentStreak: 15, role: 'student' },
    { displayName: 'Ishita Gupta', totalScore: 1180, currentStreak: 12, role: 'student' },
    { displayName: 'Kabir Singh', totalScore: 1050, currentStreak: 8, role: 'student' },
    { displayName: 'Priya Verma', totalScore: 980, currentStreak: 10, role: 'student' },
    { displayName: 'Rohan Patel', totalScore: 920, currentStreak: 6, role: 'student' },
    { displayName: 'Sneha Reddy', totalScore: 870, currentStreak: 9, role: 'student' },
    { displayName: 'Vikram Joshi', totalScore: 810, currentStreak: 5, role: 'student' },
    { displayName: 'Ananya Das', totalScore: 760, currentStreak: 7, role: 'student' },
  ];

  for (const user of dummyUsers) {
    const id = `demo_${user.displayName.toLowerCase().replace(/\s+/g, '_')}`;
    await setDoc(doc(db, 'users', id), {
      ...user,
      lastActiveDate: today
    });
  }

  console.log('Seed complete!');
  return true;
};
