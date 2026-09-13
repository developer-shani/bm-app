import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAVpsDS2MeGbo-YliX0kc5jSQM6BzJ2hJo",
  authDomain: "installmentsalesmanager.firebaseapp.com",
  projectId: "installmentsalesmanager",
  storageBucket: "installmentsalesmanager.firebasestorage.app",
  messagingSenderId: "115891816089",
  appId: "1:115891816089:web:9f042dc65f7386bd521a08",
  measurementId: "G-EYLETE02KB",
};

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics (only in browser)
export const initAnalytics = async () => {
  if (typeof window !== "undefined" && (await isSupported())) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
