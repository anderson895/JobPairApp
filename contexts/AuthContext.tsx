import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, AuthContextType } from '@/types';
import { router } from 'expo-router';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeFromAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        const unsubscribeFromUserDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              role: userData.role,
              firstName: userData.firstName,
              lastName: userData.lastName,
              authUser: firebaseUser,
              createdAt: userData.createdAt?.toDate?.() ?? new Date(),
              isRestricted: userData.isRestricted ?? false,
              profile: userData.profile ?? null,
            });
          } else {
            setUser(null);
          }
          setLoading(false);
        });

        // Clean up Firestore listener
        return unsubscribeFromUserDoc;
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Clean up auth listener
    return unsubscribeFromAuth;
  }, []);

  const signIn = async (
    email: string,
    password: string,
    role: string
  ): Promise<string> => {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const uid = userCredential.user.uid;

    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      throw new Error('User data not found in Firestore');
    }

    const userData = userDocSnap.data();

    // 🔒 Add role validation
    if (userData.role !== role) {
      throw new Error(`Your account is not registered as ${role}`);
    }

    if (userData.isRestricted) {
      await firebaseSignOut(auth);
      throw new Error(
        'Your account has been restricted. Please contact support.'
      );
    }

    setUser({
      id: uid,
      email: userCredential.user.email ?? '',
      role: userData.role,
      firstName: userData.firstName ?? '',
      lastName: userData.lastName ?? '',
      createdAt: userData.createdAt?.toDate?.() ?? new Date(),
      isRestricted: userData.isRestricted ?? false,
      profile: userData.profile ?? null,
      authUser: userCredential.user,
    });

    return userData.role;
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: 'student' | 'counselor'
  ) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const userData = {
      email,
      role,
      firstName,
      lastName,
      createdAt: new Date(),
      isRestricted: false,
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    router.replace('/(auth)/login');
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
