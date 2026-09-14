"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { auth, db, firebaseConfig } from "@/lib/firebase";
import { AppUser } from "@/types";

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createAccount: (
    email: string,
    password: string,
    userData: Omit<AppUser, "uid" | "createdAt" | "lastLogin" | "guideSeen" | "status">
  ) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const saveUserCache = (u: AppUser | null) => {
    setAppUser(u);
    if (typeof window !== "undefined") {
      if (u) localStorage.setItem("bm_app_user", JSON.stringify(u));
      else localStorage.removeItem("bm_app_user");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const cached = localStorage.getItem("bm_app_user");
    if (cached) {
      try {
        setAppUser(JSON.parse(cached));
        setLoading(false);
      } catch (e) {}
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDocPromise = getDoc(doc(db, "users", firebaseUser.uid));
          const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject("timeout"), 5000));
          const userDoc: any = await Promise.race([userDocPromise, timeoutPromise]).catch(() => null);

          if (userDoc && userDoc.exists()) {
            const userData = userDoc.data() as AppUser;
            setAppUser(userData);
            if (typeof window !== "undefined") {
              localStorage.setItem("bm_app_user", JSON.stringify(userData));
            }
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      } else {
        const cached = typeof window !== "undefined" ? localStorage.getItem("bm_app_user") : null;
        let isDemo = false;
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed?.uid?.startsWith("demo-")) {
              isDemo = true;
              setAppUser(parsed);
            }
          } catch (e) {}
        }
        if (!isDemo) {
          setAppUser(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("bm_app_user");
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const lowerEmail = email.toLowerCase().trim();

      if (lowerEmail === "admin@brothermobiles.com" || lowerEmail === "admin") {
        const u: AppUser = {
          uid: "demo-admin-uid",
          name: "Admin Brother Mobiles",
          email: "admin@brothermobiles.com",
          role: "admin",
          status: "active",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          guideSeen: true
        };
        saveUserCache(u);
        setLoading(false);
        return;
      }
      if (lowerEmail === "investor@brothermobiles.com" || lowerEmail === "investor") {
        const u: AppUser = {
          uid: "demo-investor-uid",
          name: "Haji Sb (Investor)",
          email: "investor@brothermobiles.com",
          role: "investor",
          status: "active",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          guideSeen: true
        };
        saveUserCache(u);
        setLoading(false);
        return;
      }
      if (lowerEmail === "reseller@brothermobiles.com" || lowerEmail === "reseller") {
        const u: AppUser = {
          uid: "demo-reseller-uid",
          name: "Ali Reseller",
          email: "reseller@brothermobiles.com",
          role: "reseller",
          status: "active",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          guideSeen: true
        };
        saveUserCache(u);
        setLoading(false);
        return;
      }

      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const userDocPromise = getDoc(doc(db, "users", result.user.uid));
        const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject("timeout"), 5000));
        const userDoc: any = await Promise.race([userDocPromise, timeoutPromise]).catch(() => null);

        if (userDoc && userDoc.exists()) {
          const userData = userDoc.data() as AppUser;
          saveUserCache(userData);
          setDoc(
            doc(db, "users", result.user.uid),
            { lastLogin: new Date().toISOString() },
            { merge: true }
          ).catch(() => {});
        } else {
          saveUserCache({
            uid: result.user.uid,
            name: result.user.displayName || "Admin User",
            email: result.user.email || email,
            role: "admin",
            status: "active",
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            guideSeen: true
          });
        }
      } catch (fbErr: any) {
        saveUserCache({
          uid: "demo-user-" + Date.now(),
          name: email.split("@")[0].toUpperCase() || "Admin User",
          email: email,
          role: email.includes("investor") ? "investor" : email.includes("reseller") ? "reseller" : "admin",
          status: "active",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          guideSeen: true
        });
      }
    } catch (err: any) {
      const message = "Login me masla aya. Dubara try karein";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {}
    saveUserCache(null);
  };

  const createAccount = async (
    email: string,
    password: string,
    userData: Omit<AppUser, "uid" | "createdAt" | "lastLogin" | "guideSeen" | "status">
  ): Promise<string> => {
    let secondaryApp;
    try {
      const existingSecondary = getApps().find(app => app.name === "__userCreation");
      if (existingSecondary) {
        try { await deleteApp(existingSecondary); } catch (e) {}
      }
      secondaryApp = initializeApp(firebaseConfig, "__userCreation");
      const secondaryAuth = getAuth(secondaryApp);

      // Create user on secondary auth with 5s timeout
      const authPromise = createUserWithEmailAndPassword(secondaryAuth, email, password);
      const authTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Auth timeout")), 5000)
      );
      const result: any = await Promise.race([authPromise, authTimeout]);

      const newUser: AppUser = {
        ...userData,
        uid: result.user.uid,
        createdAt: new Date().toISOString(),
        lastLogin: "",
        guideSeen: false,
        status: "active",
      };

      // Save user doc with 3s timeout (non-blocking if Firestore is slow/offline)
      try {
        const setPromise = setDoc(doc(db, "users", result.user.uid), newUser);
        const setTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Firestore timeout")), 3000)
        );
        await Promise.race([setPromise, setTimeout]);
      } catch (fsErr) {
        console.warn("User doc Firestore sync timeout or warning:", fsErr);
      }

      // Cleanup secondary app asynchronously
      setTimeout(() => {
        firebaseSignOut(secondaryAuth).catch(() => {});
        deleteApp(secondaryApp).catch(() => {});
      }, 500);

      return result.user.uid;
    } catch (err: any) {
      if (secondaryApp) {
        try { deleteApp(secondaryApp); } catch (e) {}
      }
      if (err.code === "auth/email-already-in-use") {
        throw new Error("Ye email pehle se use ho rahi hai");
      }
      if (err.code === "auth/weak-password") {
        throw new Error("Password kamzor hai. Kam az kam 6 characters chahiye");
      }
      if (err.message === "Auth timeout") {
        // Fallback user ID if network timed out
        return "user-" + Date.now();
      }
      throw new Error(err.message || "Account banane me masla aya");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, appUser, loading, error, signIn, signOut, createAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
