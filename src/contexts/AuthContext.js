import { Buffer } from 'buffer';
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
import { fetchAirtablePrices } from 'services/airtable';
import { downloadS3File } from 'services/AWS';
import { auth, db } from 'services/firebase';
import { S3_CUT_FOLDER_NAME, S3_OUTPUTS_BUCKET_NAME } from 'variables/AWS';
import { initialPrices } from 'variables/forest';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [userSpeciesPrices, setUserSpeciesPrices] = useState(initialPrices); // New state for prices

  useEffect(() => {
    setAuthLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch prices after successful login
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.prices) {
            setUserSpeciesPrices(userData.prices); // Set prices in the context
          }
          setCurrentUser({
            ...user,
            FBUser: { ...userData },
          });
        }
      } else {
        setAuthLoading(false);
      }
    });
    setAuthLoading(false);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Provide authError and a method to clear it to the context consumers
  const clearError = () => setAuthError(null);

  const updateFBUser = async (user) => {
    if (!currentUser) return; // Guard clause if there's no logged-in user

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        // set doc for the new user
        await setDoc(userDocRef, user, { merge: true });
      }
    } catch (error) {
      setAuthError(error.message);
      console.error('Error updating user: ', error);
    }
  };

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
      setAuthLoading(false);
      return { wasSuccessful: true };
    } catch (error) {
      console.error('Error signing up:', error);
      setAuthError(error.message);
      setAuthLoading(false);
    }
  };

  const signIn = async (email, password, rememberMe) => {
    setAuthLoading(true); // Set loading to true at the start of the function
    let FBUser = null;
    let PNGURL = null;
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
        // Download Forest PNG image
        const forestID = user.uid;
        const data = await downloadS3File(
          S3_OUTPUTS_BUCKET_NAME,
          `${S3_CUT_FOLDER_NAME}/${forestID}_HK_image_cut.png`
        );
        const userData = userDoc.data();
        let updatedPrices = userData.prices || {};

        // Overwrite empty prices with Airtable prices
        for (const key in airtablePrices) {
          if (!updatedPrices[key] || updatedPrices[key] === '') {
            updatedPrices[key] = airtablePrices[key];
          }
        }

        if (data && data.Body) {
          // Convert the downloaded data to a base64 URL
          const base64Data = Buffer.from(data.Body).toString('base64');
          PNGURL = `data:image/png;base64,${base64Data}`;
        }

        // Update Firestore with the new prices
        await setDoc(userDocRef, { prices: updatedPrices }, { merge: true });
        setUserSpeciesPrices(updatedPrices);
        FBUser = {
          ...userData,
          prices: updatedPrices,
          forest: { ...userData.forest, PNG: PNGURL },
        };
        setCurrentUser({
          ...user,
          FBUser: { ...FBUser },
        });
      } else {
        // If the user document doesn't exist, create it with Airtable prices
        await setDoc(userDocRef, { prices: airtablePrices }, { merge: true });
        setUserSpeciesPrices(airtablePrices);
        setCurrentUser({
          ...user,
          FBUser: { email, prices: airtablePrices },
        });
      }
      setAuthLoading(false);
      return { wasSuccessful: true };
    } catch (error) {
      console.error('Error signing in:', error);
      setAuthError(error.message);
      setAuthLoading(false);
      return { wasSuccessful: false, error: error.message }; // Indicate failure and return early
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
        setCurrentUser({
          ...user,
          FBUser: { ...userData, prices: updatedPrices },
        });
      }
      setAuthLoading(false);
      return { wasSuccessful: true };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setAuthLoading(false);
      setAuthError(error.message);
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
    updateFBUser,
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
