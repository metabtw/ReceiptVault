import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User as AppUser } from '../types/database';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch or create user document
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setAppUser({ id: userSnap.id, ...userSnap.data() } as AppUser);
        } else {
          const newUser: Omit<AppUser, 'id'> = {
            email: currentUser.email || '',
            plan: 'free',
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, newUser);
          setAppUser({ id: currentUser.uid, ...newUser });
        }
      } else {
        setAppUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return { user, appUser, loading, signOut };
};
