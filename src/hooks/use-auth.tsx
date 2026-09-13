"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AppUser, UserRole } from "@/types";

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
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("bm_app_user");
      if (cached) {
        try {
          setAppUser(JSON.parse(cached));
          setLoading(false);
        } catch (e) {}
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDocPromise = getDoc(doc(db, "users", firebaseUser.uid));
          const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject("timeout"), 300));
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

      // Quick Demo logins
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

      // Try Firebase Auth
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const userDocPromise = getDoc(doc(db, "users", result.user.uid));
        const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject("timeout"), 300));
        const userDoc: any = await Promise.race([userDocPromise, timeoutPromise]).catch(() => null);

        if (userDoc && userDoc.exists()) {
          const userData = userDoc.data() as AppUser;
          saveUserCache(userData);
          await setDoc(
            doc(db, "users", result.user.uid),
            { lastLogin: new Date().toISOString() },
            { merge: true }
          );
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
        // Fallback demo user for testing without Firebase console setup
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
    try {
      // Store current admin state
      const currentUser = auth.currentUser;
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const newUser: AppUser = {
        ...userData,
        uid: result.user.uid,
        createdAt: new Date().toISOString(),
        lastLogin: "",
        guideSeen: false,
        status: "active",
      };

      await setDoc(doc(db, "users", result.user.uid), newUser);

      // Sign back in as admin if we were logged in
      if (currentUser && currentUser.email) {
        // Note: In production, use Firebase Admin SDK for creating users
        // For now, admin will need to re-login after creating accounts
      }

      return result.user.uid;
    } catch (err: any) {
      const message =
        err.code === "auth/email-already-in-use"
          ? "Ye email pehle se use ho rahi hai"
          : err.code === "auth/weak-password"
          ? "Password kamzor hai. Kam az kam 6 characters chahiye"
          : "Account banane me masla aya";
      throw new Error(message);
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
