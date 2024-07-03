// src/contexts/AuthContext.js
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import PropTypes from 'prop-types';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();
const initialPrices = {
  granSagtommerPrice: '',
  granMassevirkePrice: '',
  furuSagtommerPrice: '',
  furuMassevirkePrice: '',
  bjorkSamsPrice: '',
  hogstUtkPrice: '',
};
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [userSpeciesPrices, setUserSpeciesPrices] = useState({}); // New state for prices

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      const addPrices = async (userDocRef) => {
        await setDoc(userDocRef, { prices: initialPrices }, { merge: true });
        setUserSpeciesPrices(initialPrices);
      };

      if (user) {
        // Fetch prices after successful login
        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef).then((docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            if (!userData.prices) {
              addPrices(userDocRef);
            }
            setUserSpeciesPrices(userData.prices); // Set prices in the context
          }
        });
      } else {
        setUserSpeciesPrices(initialPrices); // Reset prices if there's no user
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Provide authError and a method to clear it to the context consumers
  const clearError = () => setAuthError(null);

  const updateUserSpeciesPrices = async (newPrices) => {
    if (!currentUser) return; // Guard clause if there's no logged-in user

    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      await setDoc(userDocRef, { prices: newPrices }, { merge: true });
      setUserSpeciesPrices(newPrices); // Update prices in the context
    } catch (error) {
      console.error('Error updating prices: ', error);
      // Optionally, handle the error, e.g., by setting an error state
    }
  };
  const signUp = async (email, password, firstName, lastName) => {
    setLoading(true); // Set loading to true at the start of the function
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      await setDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        email: user.email,
      });
      return { wasSuccessful: true };
    } catch (error) {
      console.error('Error signing up:', error);
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password, rememberMe) => {
    setLoading(true); // Set loading to true at the start of the function
    try {
      // Set persistence based on the "Remember Me" checkbox
      const persistence = rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistence);
      await signInWithEmailAndPassword(auth, email, password);
      return { wasSuccessful: true };
    } catch (error) {
      console.error('Error signing in:', error);
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (rememberMe) => {
    setLoading(true);
    // Set persistence based on the "Remember Me" checkbox
    const persistence = rememberMe
      ? browserLocalPersistence
      : browserSessionPersistence;
    await setPersistence(auth, persistence);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const userDocRef = await doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          firstName: user.displayName.split(' ')[0],
          lastName: user.displayName.split(' ')[1],
          email: user.email,
        });
      }
      return { wasSuccessful: true };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true); // Set loading to true at the start of the function
    try {
      await signOut(auth);
      return { wasSuccessful: true };
    } catch (error) {
      console.error('Error signing out:', error);
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    userSpeciesPrices,
    updateUserSpeciesPrices,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    clearError,
    authError,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : (
        children // Display children when not loading
      )}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
