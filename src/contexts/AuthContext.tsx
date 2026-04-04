import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { ExamType, DEFAULT_EXAM, CuetDomainSubject } from '../services/examConfig';

export interface UserProfile {
  uid: string;
  email: string | null;
  role: 'student' | 'admin';
  displayName: string | null;
  totalScore: number;
  currentStreak: number;
  exam?: ExamType;
  cuetDomain?: CuetDomainSubject;
  cuetDomains?: CuetDomainSubject[];
  averageAccuracy?: number;
  coins?: number;
  longestStreak?: number;
  graceDaysUsed?: number;
  streakFreezeAvailable?: number;
  lastActiveDate?: string;
  totalActiveDays?: number;
  totalQuestionsAttempted?: number;
  totalCorrect?: number;
  eloRatings?: Record<string, number>;
  createdAt?: string;
  isPremium?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setExam: (exam: ExamType, cuetDomain?: CuetDomainSubject, cuetDomains?: CuetDomainSubject[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Create default student profile if not exists — no exam set yet
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'student',
              displayName: firebaseUser.displayName,
              totalScore: 0,
              currentStreak: 0,
              createdAt: new Date().toISOString(),
              isPremium: false
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching/creating profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  };

  const setExam = async (exam: ExamType, cuetDomain?: CuetDomainSubject, cuetDomains?: CuetDomainSubject[]) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const updateData: Record<string, any> = { exam };
      if (cuetDomain) updateData.cuetDomain = cuetDomain;
      if (cuetDomains && cuetDomains.length > 0) updateData.cuetDomains = cuetDomains;
      await updateDoc(docRef, updateData);
      // Update local profile immediately
      setProfile(prev => prev ? {
        ...prev,
        exam,
        ...(cuetDomain ? { cuetDomain } : {}),
        ...(cuetDomains ? { cuetDomains } : {}),
      } : prev);
    } catch (error) {
      console.error("Error setting exam:", error);
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        alert("Firebase Auth Error: This domain is not authorized. You need to add this domain to your Firebase Console (Authentication -> Settings -> Authorized domains).");
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log("User closed the login popup.");
      } else if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        alert("Login popup was blocked by your browser. Please allow popups for this site, or open the app in a new tab to sign in.");
      } else if (error.message.includes('cross-origin')) {
        alert("Cross-origin authentication is blocked in this preview. Please open the app in a new tab using the arrow icon in the top right.");
      } else {
        alert(`Authentication failed: ${error.message}. If you are in the preview window, try opening the app in a new tab.`);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, logout, refreshProfile, setExam }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
