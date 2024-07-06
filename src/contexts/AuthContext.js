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
import { fetchPricesRecords } from 'services/airtable';
import { initialPrices } from 'variables/forest';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [userSpeciesPrices, setUserSpeciesPrices] = useState(initialPrices); // New state for prices
  useEffect(() => {
    setAuthLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      // if (user) {
      //   // Fetch prices after successful login
      //   const userDocRef = doc(db, 'users', user.uid);
      //   getDoc(userDocRef).then((docSnap) => {
      //     if (docSnap.exists()) {
      //       const userData = docSnap.data();
      //       if (userData.prices) {
      //         console.log('User prices1:', userData.prices);
      //         setUserSpeciesPrices(userData.prices); // Set prices in the context
      //       }
      //       console.log('User prices2:', userSpeciesPrices);
      //     }
      //   });
      // }
      setAuthLoading(false);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Provide authError and a method to clear it to the context consumers
  const clearError = () => setAuthError(null);

  const updateUserSpeciesPrices = async (newPrices) => {
    if (!currentUser) return; // Guard clause if there's no logged-in user

    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      await setDoc(userDocRef, { prices: newPrices }, { merge: true });

      // Only update state if prices actually changed
      setUserSpeciesPrices((prevPrices) => {
        if (JSON.stringify(prevPrices) !== JSON.stringify(newPrices)) {
          return newPrices;
        }
        return prevPrices;
      });
    } catch (error) {
      console.error('Error updating prices: ', error);
    }
  };

  const signUp = async (email, password, firstName, lastName) => {
    setAuthLoading(true); // Set loading to true at the start of the function
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
      setAuthLoading(false);
    }
  };
  const fetchAirtablePrices = async () => {
    try {
      const records = await fetchPricesRecords();
      // map the records to this format const initialPrices = {
      //   granSagtommerPrice: '',
      //   granMassevirkePrice: '',
      //   furuSagtommerPrice: '',
      //   furuMassevirkePrice: '',
      //   lauvSagtommerPrice: '',
      //   lauvMassevirkePrice: '',
      //   hogstUtkPrice: '',
      // };
      const prices = records.reduce((acc, record) => {
        const { specie, price_saw_wood, price_pulp_wood, cost_harvest_per_m3 } =
          record.fields;
        return {
          ...acc,
          [`${specie}SagtommerPrice`]: price_saw_wood || 0,
          [`${specie}MassevirkePrice`]: price_pulp_wood || 0,
          [`hogstUtkPrice`]: cost_harvest_per_m3 || 0,
        };
      }, {});
      return prices;
    } catch (error) {
      console.error('Error fetching Prices records:', error);
    }
  };
  const signIn = async (email, password, rememberMe) => {
    setAuthLoading(true); // Set loading to true at the start of the function
    try {
      // Set persistence based on the "Remember Me" checkbox
      const persistence = rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistence);
      await signInWithEmailAndPassword(auth, email, password);

      const airtablePrices = await fetchAirtablePrices();

      const user = auth.currentUser;
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        let updatedPrices = userData.prices || {};

        // Overwrite empty prices with Airtable prices
        for (const key in airtablePrices) {
          if (!updatedPrices[key] || updatedPrices[key] === '') {
            updatedPrices[key] = airtablePrices[key];
          }
        }

        // Update Firestore with the new prices
        await setDoc(userDocRef, { prices: updatedPrices }, { merge: true });
        setUserSpeciesPrices(updatedPrices);
      } else {
        // If the user document doesn't exist, create it with Airtable prices
        await setDoc(userDocRef, { prices: airtablePrices }, { merge: true });
        setUserSpeciesPrices(airtablePrices);
      }

      return { wasSuccessful: true };
    } catch (error) {
      console.error('Error signing in:', error);
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const signInWithGoogle = async (rememberMe) => {
    setAuthLoading(true);
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

      const airtablePrices = await fetchAirtablePrices();

      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          firstName: user.displayName.split(' ')[0],
          lastName: user.displayName.split(' ')[1],
          email: user.email,
          prices: airtablePrices,
        });
        setUserSpeciesPrices(airtablePrices);
      } else {
        const userData = userDoc.data();
        let updatedPrices = userData.prices || {};

        // Overwrite empty prices with Airtable prices
        for (const key in airtablePrices) {
          if (!updatedPrices[key] || updatedPrices[key] === '') {
            updatedPrices[key] = airtablePrices[key];
          }
        }

        // Update Firestore with the new prices
        await setDoc(userDocRef, { prices: updatedPrices }, { merge: true });
        setUserSpeciesPrices(updatedPrices);
      }

      return { wasSuccessful: true };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    setAuthLoading(true); // Set loading to true at the start of the function
    try {
      await signOut(auth);
      return { wasSuccessful: true };
    } catch (error) {
      console.error('Error signing out:', error);
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
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
    authLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {authLoading ? (
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
