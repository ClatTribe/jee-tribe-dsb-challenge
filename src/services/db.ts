import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  increment,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { Question, Submission, evaluateSubmission, TestResult } from '../utils/evaluationUtils';

export interface Duel {
  id: string;
  players: {
    [uid: string]: {
      displayName: string;
      score: number;
      currentIndex: number;
      completed: boolean;
      lastActive: any;
    }
  };
  status: 'waiting' | 'active' | 'completed';
  questions: any[];
  createdAt: any;
  startTime?: any;
}

export const createDuel = async (userId: string, displayName: string, questions: any[]) => {
  try {
    const duelData = {
      players: {
        [userId]: {
          displayName,
          score: 0,
          currentIndex: 0,
          completed: false,
          lastActive: serverTimestamp()
        }
      },
      status: 'waiting',
      questions,
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'duels'), duelData);
    return docRef.id;
  } catch (error: any) {
    console.error("Error creating duel:", error);
    throw new Error(error.message || "Failed to create duel. Check permissions.");
  }
};

export const joinDuel = async (duelId: string, userId: string, displayName: string) => {
  try {
    const duelRef = doc(db, 'duels', duelId);
    await updateDoc(duelRef, {
      [`players.${userId}`]: {
        displayName,
        score: 0,
        currentIndex: 0,
        completed: false,
        lastActive: serverTimestamp()
      },
      status: 'active',
      startTime: serverTimestamp()
    });
  } catch (error: any) {
    console.error("Error joining duel:", error);
    throw new Error(error.message || "Failed to join duel. Check permissions.");
  }
};

export const updateDuelScore = async (duelId: string, userId: string, score: number, currentIndex: number, completed = false) => {
  const duelRef = doc(db, 'duels', duelId);
  await updateDoc(duelRef, {
    [`players.${userId}.score`]: score,
    [`players.${userId}.currentIndex`]: currentIndex,
    [`players.${userId}.completed`]: completed,
    [`players.${userId}.lastActive`]: serverTimestamp()
  });
};

export const findOpenDuel = async (userId: string) => {
  const q = query(
    collection(db, 'duels'),
    where('status', '==', 'waiting'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  
  const duelDoc = snap.docs[0];
  // Don't join your own duel
  if (duelDoc.data().players[userId]) return null;
  
  return { id: duelDoc.id, ...duelDoc.data() } as Duel;
};

export const getOpenDuels = async () => {
  try {
    const q = query(
      collection(db, 'duels'),
      where('status', '==', 'waiting'),
      limit(10)
    );
    const snap = await getDocs(q);
    // Sort manually to avoid needing a composite index
    return snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Duel))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (error: any) {
    console.error("Error fetching open duels:", error);
    throw error;
  }
};

export const listenToDuel = (duelId: string, callback: (duel: Duel) => void) => {
  return onSnapshot(doc(db, 'duels', duelId), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Duel);
    }
  });
};

export const getQuestionBank = async () => {
  const querySnapshot = await getDocs(collection(db, 'questionBank'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
};

export const addQuestion = async (question: Omit<Question, 'id'>) => {
  return await addDoc(collection(db, 'questionBank'), question);
};

export const getDailyChallenge = async (dateId: string) => {
  const docRef = doc(db, 'dailyChallenges', dateId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};

export const submitChallenge = async (
  userId: string,
  challengeId: string,
  submissions: Submission[],
  questions: Question[],
  markingScheme: Record<string, { positive: number; negative: number }>,
  awardPoints: boolean = true
): Promise<TestResult> => {
  const result = evaluateSubmission(submissions, questions, markingScheme);
  
  if (awardPoints) {
    // Update user stats
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    
    const today = new Date().toISOString().split('T')[0];
    const lastActive = userData?.lastActiveDate;
    
    let streakUpdate = {};
    if (lastActive !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastActive === yesterdayStr) {
        streakUpdate = { currentStreak: increment(1), lastActiveDate: today };
      } else {
        streakUpdate = { currentStreak: 1, lastActiveDate: today };
      }
    }

    // Calculate coins: 10 for completion + 10 for >80% accuracy
    let coinsEarned = 10;
    if (result.accuracy >= 0.8) coinsEarned += 10;

    await updateDoc(userRef, {
      totalScore: increment(result.totalScore),
      totalQuestionsAttempted: increment(questions.length),
      totalCorrect: increment(result.results.filter(r => r.isCorrect).length),
      coins: increment(coinsEarned),
      ...streakUpdate
    });
  }

  // Save to history subcollection
  const historyRef = collection(db, 'users', userId, 'history');
  const attemptData = {
    challengeId,
    ...result,
    timestamp: serverTimestamp(),
    completedAt: serverTimestamp(), // Added for AdminDashboard compatibility
    userId,
    isReattempt: !awardPoints
  };
  await addDoc(historyRef, attemptData);

  // Save to global attempts collection for admin dashboard
  try {
    await addDoc(collection(db, 'attempts'), attemptData);
  } catch (error) {
    console.warn("Could not save to global attempts collection (likely permission issue):", error);
  }

  return result;
};

export const submitMiniGameScore = async (
  userId: string,
  gameId: string,
  score: number,
  isReattempt: boolean = false
) => {
  if (!isReattempt && score > 0) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      totalScore: increment(score),
    });
  }

  // Save to history
  const historyRef = collection(db, 'users', userId, 'history');
  await addDoc(historyRef, {
    challengeId: gameId,
    totalScore: score,
    timestamp: serverTimestamp(),
    completedAt: serverTimestamp(),
    userId,
    isReattempt
  });
};

export const getLeaderboard = async (limitCount = 10) => {
  const q = query(
    collection(db, 'users'), 
    orderBy('totalScore', 'desc'), 
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const checkAttempt = async (userId: string, challengeId: string) => {
  const historyRef = collection(db, 'users', userId, 'history');
  const q = query(historyRef, where('challengeId', '==', challengeId), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
};
