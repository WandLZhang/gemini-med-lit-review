// src/hooks/useAuth.js
import { useCallback } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

export const useAuth = (setShowUserMenu) => {
  const auth = getAuth();

  const handleLogin = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  }, [auth]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setShowUserMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [auth, setShowUserMenu]);

  return { handleLogin, handleLogout };
};