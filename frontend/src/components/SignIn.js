// src/components/SignIn.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const SignIn = () => {
  const navigate = useNavigate();
  const auth = getAuth();

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <div>
      <button onClick={signInWithGoogle}>
        Sign in with Google
      </button>
    </div>
  );
};

export default SignIn;