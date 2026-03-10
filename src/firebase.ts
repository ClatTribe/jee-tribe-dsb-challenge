import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDtDqau4Oq9V2KdPyGyEnLX6nn_yUtsa-k",
  authDomain: "jee-dsb-challenge.firebaseapp.com",
  projectId: "jee-dsb-challenge",
  storageBucket: "jee-dsb-challenge.firebasestorage.app",
  messagingSenderId: "318620330667",
  appId: "1:318620330667:web:10b847cd116168a27825ee",
  measurementId: "G-0TSYM7YLR3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Analytics is optional and might be restricted in some iframe environments
if (typeof window !== "undefined") {
  getAnalytics(app);
}
