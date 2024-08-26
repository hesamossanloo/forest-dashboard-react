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
import LZString from 'lz-string';
import PropTypes from 'prop-types';
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAirtablePrices } from 'services/airtable';
import { checkFileExists, downloadS3File, removeS3File } from 'services/AWS';
import { auth, db } from 'services/firebase';
import shp from 'shpjs';
import {
  S3_CUT_FOLDER_NAME,
  S3_FEATURE_INFO_FOLDER_NAME,
  S3_OUTPUTS_BUCKET_NAME,
  S3_VECTORIZE_FOLDER_NAME,
} from 'variables/AWS';
import { initialPrices } from 'variables/forest';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const downloadS3SHPFile = async (forestID) => {
  const shpFile = await downloadS3File(
    S3_OUTPUTS_BUCKET_NAME,
    `${S3_FEATURE_INFO_FOLDER_NAME}/${forestID}_vector_w_HK_infos.shp`
  );
  const shxFile = await downloadS3File(
    S3_OUTPUTS_BUCKET_NAME,
    `${S3_FEATURE_INFO_FOLDER_NAME}/${forestID}_vector_w_HK_infos.shx`
  );
  const dbfFile = await downloadS3File(
    S3_OUTPUTS_BUCKET_NAME,
    `${S3_FEATURE_INFO_FOLDER_NAME}/${forestID}_vector_w_HK_infos.dbf`
  );
  return { shpFile, shxFile, dbfFile };
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(() => {
    // Retrieve the currentUser from local storage if it exists
    let localUser = null;
    const compressedUserData = localStorage.getItem('currentUser');
    if (compressedUserData) {
      localUser = LZString.decompressFromUTF16(compressedUserData);
    }
    return localUser ? JSON.parse(localUser) : null;
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [userSpeciesPrices, setUserSpeciesPrices] = useState(initialPrices); // New state for prices

  useEffect(() => {
    setAuthLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          setAuthLoading(true);
          // Fetch prices after successful login
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          // Get FBUserData from ocalstorage
          if (userDoc.exists()) {
            const FBUserData = userDoc.data();

            if (FBUserData.forest) {
              // Download Forest PNG image
              const forestID = user.uid;
              const PNGExists = await checkFileExists(
                S3_OUTPUTS_BUCKET_NAME,
                `${S3_CUT_FOLDER_NAME}/${forestID}_HK_image_cut.png`
              );
              if (PNGExists) {
                const PNGData = await downloadS3File(
                  S3_OUTPUTS_BUCKET_NAME,
                  `${S3_CUT_FOLDER_NAME}/${forestID}_HK_image_cut.png`
                );
                if (PNGData && PNGData.Body) {
                  // Convert the downloaded data to a base64 URL
                  const base64Data = Buffer.from(PNGData.Body).toString(
                    'base64'
                  );
                  const PNGURL = `data:image/png;base64,${base64Data}`;
                  FBUserData.forest.PNG = PNGURL; // Add the PNG URL to the user data
                }
              }
              // Download SHP files and convert them to GeoJSON
              const SHPFileExists = await checkFileExists(
                S3_OUTPUTS_BUCKET_NAME,
                `${S3_FEATURE_INFO_FOLDER_NAME}/${forestID}_vector_w_HK_infos.shp`
              );
              if (SHPFileExists) {
                try {
                  const { shpFile, shxFile, dbfFile } =
                    await downloadS3SHPFile(forestID);
                  if (shpFile && shxFile && dbfFile) {
                    // Convert SHP files to GeoJSON
                    const geoJsonWithInfos = await shp({
                      shp: shpFile.Body,
                      shx: shxFile.Body,
                      dbf: dbfFile.Body,
                    });
                    if (FBUserData.forest) {
                      FBUserData.forest.vector = geoJsonWithInfos; // Add the GeoJSON to the user's forest data
                    }
                  }
                } catch (error) {
                  console.error('Error downloading SHP files:', error);
                }
              }
            }
            if (FBUserData.prices) {
              setUserSpeciesPrices(FBUserData.prices); // Set prices in the context
            } else {
              const airtablePrices = await fetchAirtablePrices();
              airtablePrices
                ? setUserSpeciesPrices(airtablePrices)
                : setUserSpeciesPrices(initialPrices);
            }
            setCurrentUser((prevUser) => {
              const updatedUser = {
                ...prevUser,
                FBUser: {
                  ...prevUser?.FBUser,
                  ...FBUserData,
                },
              };
              // Compress the updated user object
              const compressedUserData = LZString.compressToUTF16(
                JSON.stringify(updatedUser)
              );
              localStorage.setItem('currentUser', compressedUserData);
              return updatedUser;
            });
          }
          setAuthLoading(false);
        } catch (error) {
          if (error.message !== 'The specified key does not exist.') {
            console.error('Error fetching prices:', error);
          }
          setAuthError(error.message);
          setAuthLoading(false);
        }
      } else {
        setAuthLoading(false);
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Provide authError and a method to clear it to the context consumers
  const clearError = () => setAuthError(null);

  const removeForest = async () => {
    if (!currentUser) return; // Guard clause if there's no logged-in user
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        await setDoc(userDocRef, { forest: null }, { merge: true });
        setCurrentUser((prevUser) => {
          const updatedUser = {
            ...prevUser,
            FBUser: {
              ...prevUser?.FBUser,
              forest: null,
            },
          };
          // Compress the updated user object
          const compressedUserData = LZString.compressToUTF16(
            JSON.stringify(updatedUser)
          );
          localStorage.setItem('currentUser', compressedUserData);
          return updatedUser;
        });
      }
      // Remove the files from S3
      const forestID = currentUser.uid;
      // Hanlde PNG file
      const PNGFileToDelete = `${S3_CUT_FOLDER_NAME}/${forestID}_HK_image_cut.png`;
      const PNGFileExists = await checkFileExists(
        S3_OUTPUTS_BUCKET_NAME,
        PNGFileToDelete
      );
      if (PNGFileExists)
        await removeS3File(S3_OUTPUTS_BUCKET_NAME, PNGFileToDelete);

      // Hanlde SVG file
      const SVGFileToDelete = `${S3_CUT_FOLDER_NAME}/${forestID}_HK_image_cut.svg`;
      const SVGFileExists = await checkFileExists(
        S3_OUTPUTS_BUCKET_NAME,
        SVGFileToDelete
      );
      if (SVGFileExists) {
        await removeS3File(S3_OUTPUTS_BUCKET_NAME, SVGFileToDelete);
      }
      // Handle SHP files
      const SHPFileToDelete = `${S3_VECTORIZE_FOLDER_NAME}/${forestID}_vectorized_HK.shp`;
      const SHPFileExists = await checkFileExists(
        S3_OUTPUTS_BUCKET_NAME,
        SHPFileToDelete
      );
      if (SHPFileExists) {
        await removeS3File(S3_OUTPUTS_BUCKET_NAME, SHPFileToDelete);
        await removeS3File(
          S3_OUTPUTS_BUCKET_NAME,
          `${S3_VECTORIZE_FOLDER_NAME}/${forestID}_vectorized_HK.shx`
        );
        await removeS3File(
          S3_OUTPUTS_BUCKET_NAME,
          `${S3_VECTORIZE_FOLDER_NAME}/${forestID}_vectorized_HK.dbf`
        );
        await removeS3File(
          S3_OUTPUTS_BUCKET_NAME,
          `${S3_VECTORIZE_FOLDER_NAME}/${forestID}_vectorized_HK.prj`
        );
      }
      // Handle SHP files with infos
      const SHPFileWithInfosToDelete = `${S3_FEATURE_INFO_FOLDER_NAME}/${forestID}_vector_w_HK_infos.shp`;
      const SHPFileWithInfosExists = await checkFileExists(
        S3_OUTPUTS_BUCKET_NAME,
        SHPFileWithInfosToDelete
      );
      if (SHPFileWithInfosExists) {
        await removeS3File(S3_OUTPUTS_BUCKET_NAME, SHPFileWithInfosToDelete);
        await removeS3File(
          S3_OUTPUTS_BUCKET_NAME,
          `${S3_FEATURE_INFO_FOLDER_NAME}/${forestID}_vector_w_HK_infos.shx`
        );
        await removeS3File(
          S3_OUTPUTS_BUCKET_NAME,
          `${S3_FEATURE_INFO_FOLDER_NAME}/${forestID}_vector_w_HK_infos.dbf`
        );
        await removeS3File(
          S3_OUTPUTS_BUCKET_NAME,
          `${S3_FEATURE_INFO_FOLDER_NAME}/${forestID}_vector_w_HK_infos.prj`
        );
      }
    } catch (error) {
      setAuthError(error.message);
      console.error('Error removing forest:', error);
    }
  };

  const updateFBUser = async (user) => {
    if (!currentUser) return; // Guard clause if there's no logged-in user
    console.log('Updating FBUser:', user);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        // set doc for the new user
        await setDoc(userDocRef, user, { merge: true });
        setCurrentUser((prevUser) => {
          const updatedUser = {
            ...prevUser,
            FBUser: {
              ...prevUser?.FBUser,
              forest: { ...prevUser?.FBUser?.forest, ...user.forest },
            },
          };
          // Compress the updated user object
          const compressedUserData = LZString.compressToUTF16(
            JSON.stringify(updatedUser)
          );
          localStorage.setItem('currentUser', compressedUserData);
          return updatedUser;
        });
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
    let PNGURL = null;
    try {
      // Set persistence based on the "Remember Me" checkbox
      const persistence = rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistence);
      await signInWithEmailAndPassword(auth, email, password);

      // Fetch initial prices from Airtable
      const airtablePrices = await fetchAirtablePrices();

      const user = auth.currentUser;
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        setAuthError('No user found. Please sign up first.');
      } else {
        // Download Forest PNG image
        const forestID = user.uid;
        const FBUserData = userDoc.data();

        if (FBUserData.forest) {
          const PNGData = await downloadS3File(
            S3_OUTPUTS_BUCKET_NAME,
            `${S3_CUT_FOLDER_NAME}/${forestID}_HK_image_cut.png`
          );

          // Handle the PNG image
          if (PNGData && PNGData.Body) {
            // Convert the downloaded data to a base64 URL
            const base64Data = Buffer.from(PNGData.Body).toString('base64');
            PNGURL = `data:image/png;base64,${base64Data}`;
          }

          // Check if the user has already set the prices in Firestore!
          let updatedPrices = FBUserData.prices || {};

          // Overwrite empty prices with Airtable prices
          for (const key in airtablePrices) {
            if (!updatedPrices[key] || updatedPrices[key] === '') {
              updatedPrices[key] = airtablePrices[key];
            }
          }

          // Update user's Firestore with the new prices
          await setDoc(userDocRef, { prices: updatedPrices }, { merge: true });
          setUserSpeciesPrices(updatedPrices);
          try {
            // Download SHP files and convert them to GeoJSON
            const { shpFile, shxFile, dbfFile } =
              await downloadS3SHPFile(forestID);
            if (shpFile && shxFile && dbfFile) {
              // Convert SHP files to GeoJSON
              const geoJsonWithInfos = await shp({
                shp: shpFile.Body,
                shx: shxFile.Body,
                dbf: dbfFile.Body,
              });
              if (FBUserData.forest) {
                FBUserData.forest.vector = geoJsonWithInfos; // Add the GeoJSON to the user's forest data
              }
            }
          } catch (error) {
            console.error('Error downloading SHP files:', error);
          }
          // Add the Vector data to the currentUser in the session
          setCurrentUser((prevUser) => {
            const updatedUser = {
              ...prevUser,
              ...user,
              FBUser: {
                ...prevUser?.FBUser,
                forest: {
                  ...prevUser?.FBUser?.forest,
                  PNG: PNGURL,
                  vector: FBUserData.forest.vector,
                },
                prices: updatedPrices,
              },
            };
            // Compress the updated user object
            const compressedUserData = LZString.compressToUTF16(
              JSON.stringify(updatedUser)
            );
            localStorage.setItem('currentUser', compressedUserData);
            return updatedUser;
          });
        }
        setAuthLoading(false);
      }
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
    let PNGURL = null;
    try {
      // Set persistence based on the "Remember Me" checkbox
      const persistence = rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistence);
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      const airtablePrices = await fetchAirtablePrices();

      const user = userCredential.user;
      const userDocRef = await doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // If the user document doesn't exist, create it with Airtable prices
        await setDoc(doc(db, 'users', user.uid), {
          firstName: user.displayName.split(' ')[0],
          lastName: user.displayName.split(' ')[1],
          email: user.email,
          prices: airtablePrices,
        });
        setUserSpeciesPrices(airtablePrices);
        setCurrentUser((prevUser) => {
          const updatedUser = {
            ...prevUser,
            FBUser: {
              ...prevUser?.FBUser,
              firstName: user.displayName.split(' ')[0],
              lastName: user.displayName.split(' ')[1],
              email: user.email,
              prices: airtablePrices,
            },
          };
          // Compress the updated user object
          const compressedUserData = LZString.compressToUTF16(
            JSON.stringify(updatedUser)
          );
          localStorage.setItem('currentUser', compressedUserData);
          return updatedUser;
        });
        setAuthLoading(false);
      } else {
        // Download Forest PNG image
        const forestID = user.uid;
        const data = await downloadS3File(
          S3_OUTPUTS_BUCKET_NAME,
          `${S3_CUT_FOLDER_NAME}/${forestID}_HK_image_cut.png`
        );

        const FBUserData = userDoc.data();
        let updatedPrices = FBUserData.prices || {};

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
        try {
          const { shpFile, shxFile, dbfFile } =
            await downloadS3SHPFile(forestID);
          if (shpFile && shxFile && dbfFile) {
            // Convert SHP files to GeoJSON
            const geoJsonWithInfos = await shp({
              shp: shpFile.Body,
              shx: shxFile.Body,
              dbf: dbfFile.Body,
            });
            if (FBUserData.forest) {
              FBUserData.forest.vector = geoJsonWithInfos; // Add the GeoJSON to the user's forest data
            }
          }
        } catch (error) {
          console.error('Error downloading SHP files:', error);
        }
        setCurrentUser((prevUser) => {
          const updatedUser = {
            ...prevUser,
            ...user,
            FBUser: {
              ...prevUser.FBUser,
              forest: {
                ...prevUser.FBUser.forest,
                PNG: PNGURL,
                vector: FBUserData.forest.vector,
              },
              prices: updatedPrices,
            },
          };
          // Compress the updated user object
          const compressedUserData = LZString.compressToUTF16(
            JSON.stringify(updatedUser)
          );
          localStorage.setItem('currentUser', compressedUserData);
          return updatedUser;
        });
        setAuthLoading(false);
      }
      return { wasSuccessful: true };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setAuthLoading(false);
      setAuthError(error.message);
      return { wasSuccessful: false, error: error.message }; // Indicate failure and return early
    }
  };

  const logout = async () => {
    setAuthLoading(true); // Set loading to true at the start of the function
    try {
      await signOut(auth);
      setCurrentUser(null); // Clear the current user state
      localStorage.removeItem('currentUser'); // Remove user data from local storage
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
      setAuthError(error.message);
      return { wasSuccessful: false };
    } finally {
      setAuthLoading(false);
    }
  };

  const value = {
    currentUser,
    setCurrentUser,
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
    removeForest,
  };

  return (
    <AuthContext.Provider value={value}>
      {authLoading ? (
        <div className="overlay-spinner">
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
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
