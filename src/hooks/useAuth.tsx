import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, loginWithGoogle, logout } from "../lib/firebase";
import { UserProfile } from "../types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticating: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    console.log("Auth System: Initializing monitors...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth State Changed: user =", firebaseUser?.email || "null");
      setUser(firebaseUser);
      
      if (firebaseUser) {
        setLoading(true);
        console.log("Auth System: Syncing user profile for", firebaseUser.uid);
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          
          if (userDoc.exists()) {
            console.log("Auth System: Profile found.");
            setProfile(userDoc.data() as UserProfile);
          } else {
            console.log("Auth System: No profile found. Initializing new record...");
            // Initialize profile
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || "Gamer",
              photoURL: firebaseUser.photoURL || "",
              email: firebaseUser.email || "",
              xp: 0,
              level: 1,
              totalGamesPlayed: 0,
              totalWins: 0,
              totalLosses: 0,
              multiplayerWins: 0,
              winStrike: 0,
              maxWinStrike: 0,
              achievements: [],
              favorites: [],
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, "users", firebaseUser.uid), newProfile);
            setProfile(newProfile);
            console.log("Auth System: New profile synchronized.");
          }
        } catch (error) {
          console.error("Auth System: Profile synchronization failed:", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
      console.log("Auth System: Initialization complete.");
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    console.log("Auth System: User requested sign-in.");
    try {
      await loginWithGoogle();
      // State change will handle the rest via onAuthStateChanged
    } catch (error) {
      console.error("Auth System: Sign-in process aborted or failed.", error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthenticating, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
