import { useAuth } from 'contexts/AuthContext';
import { useEffect, useState } from 'react';
import { checkFileExists, downloadS3File } from 'services/AWS';
import { S3_CUT_FOLDER_NAME, S3_OUTPUTS_BUCKET_NAME } from 'variables/AWS';
import './ForestCut.scss';

import { Buffer } from 'buffer';
import ForestScene from 'components/ForestScene/ForestScene';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Button, Modal, ModalFooter } from 'reactstrap';

import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from 'services/firebase';
import { S3_VECTORIZE_FOLDER_NAME } from 'variables/AWS';

const ForestCut = () => {
  const navigate = useNavigate();

  const [PNGFileExists, setPNGFileExists] = useState(false);
  const [VectorFileExists, setVectorFileExists] = useState(false);
  const [forestHKPNG, setForestHKPNG] = useState(null);
  const [geoJson, setGeoJson] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // get the current user uid
  const { currentUser, updateFBUser } = useAuth();

  const [show, setShow] = useState(false);
  // if user is not logged in redirect to sigin page
  useEffect(() => {
    const localUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!localUser?.uid) {
      navigate('/signin');
    } else if (localUser?.FBUser?.forest?.vector) {
      navigate('/vectorize');
    } else {
      setShow(true);
    }
  }, [navigate]);

  useEffect(() => {
    const checkFile = async () => {
      const forestID = currentUser.uid;
      const PNGExists = await checkFileExists(
        S3_OUTPUTS_BUCKET_NAME,
        `${S3_CUT_FOLDER_NAME}/${forestID}_HK_image_cut.png`
      );
      setPNGFileExists(PNGExists);
      if (!PNGExists) {
        return;
      }

      const VectorExists = await checkFileExists(
        S3_OUTPUTS_BUCKET_NAME,
        `${S3_VECTORIZE_FOLDER_NAME}/${forestID}_vectorized_HK.shp`
      );
      setVectorFileExists(VectorExists);
    };

    const interval = setInterval(() => {
      if (currentUser && !PNGFileExists) {
        checkFile();
      } else {
        clearInterval(interval);
      }
    }, 10000); // Check every 10 seconds

    // Check once if the file exists
    if (currentUser && !PNGFileExists) {
      checkFile();
    }

    return () => clearInterval(interval);
  }, [PNGFileExists, currentUser]);

  // if file is ready download it from s3 and save it under the folder assets/data
  useEffect(() => {
    const downloadFile = async () => {
      const forestID = currentUser.uid;
      const data = await downloadS3File(
        S3_OUTPUTS_BUCKET_NAME,
        `${S3_CUT_FOLDER_NAME}/${forestID}_HK_image_cut.png`
      );
      if (data) {
        if (currentUser.FBUser.forest && currentUser.FBUser.forest.teig) {
          const parsedJSON = JSON.parse(currentUser.FBUser.forest.teig);
          setGeoJson(parsedJSON);
        } else {
          // Get the teig from the Firestore
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const parsedJSON = JSON.parse(userData.FBUser.forest.teig);
            setGeoJson(parsedJSON);
          }
        }

        // Convert the downloaded data to a base64 URL
        const base64Data = Buffer.from(data.Body).toString('base64');
        const imageUrl = `data:image/png;base64,${base64Data}`;
        setForestHKPNG(imageUrl);
      }
    };
    if (PNGFileExists) {
      downloadFile();
    }
  }, [PNGFileExists, currentUser]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

  // eslint-disable-next-line react/prop-types
  const MapComponent = ({ geoJson }) => {
    const map = useMap();

    useEffect(() => {
      if (geoJson && map) {
        const geoJsonLayer = L.geoJSON(geoJson).addTo(map);
        const newBounds = geoJsonLayer.getBounds();

        // Only update bounds if they have changed
        if (!bounds || !bounds.equals(newBounds)) {
          map.flyToBounds(newBounds);
          setBounds(newBounds);
        }

        if (forestHKPNG) {
          L.imageOverlay(forestHKPNG, newBounds, {
            opacity: 0.5,
          }).addTo(map);
          setModalOpen(true);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [geoJson, map, forestHKPNG, bounds]);

    return null;
  };

  const handleForestConfirm = async () => {
    if (requestSent) {
      console.log('Request already sent. So not sending again!');
      return; // Prevent multiple requests
    }

    setIsLoading(true);
    // Assuming bounds is a custom object, convert it to a plain JavaScript object
    const plainBounds = JSON.parse(JSON.stringify(bounds));

    await updateFBUser({
      ...currentUser.FBUser,
      forest: { ...currentUser.FBUser.forest, bounds: plainBounds },
    });

    try {
      setRequestSent(true); // Mark the request as sent
      if (VectorFileExists) {
        setIsLoading(false);
        navigate('/vectorize');
      } else {
        // Set a timeout for the fetch request
        const fetchWithTimeout = (url, options, timeout = 29000) => {
          return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
              setTimeout(() => {
                reject(new Error('Request timed out'));
                setIsLoading(false);
                navigate('/vectorize');
              }, timeout)
            ),
          ]);
        };
        await fetchWithTimeout(
          'https://sktkye0v17.execute-api.eu-north-1.amazonaws.com/Prod/vectorize',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: currentUser.FBUser.forest.teig, // Ensure the body is a JSON string
          }
        );
        setIsLoading(false);
        navigate('/vectorize');
      }
    } catch (error) {
      setRequestSent(false); // Reset the state if there's an error
      setIsLoading(false);
      console.error('Error:', error);
    }
  };

  if (!show) {
    return null;
  }
  return (
    <>
      {PNGFileExists && currentUser && forestHKPNG ? (
        <>
          <div className="title">
            <h1>STEP 2/6 for your Skogbruksplan is done!</h1>
          </div>
          <div className="mapContainer">
            <MapContainer center={[59.9139, 10.7522]} zoom={13}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapComponent geoJson={geoJson} />
            </MapContainer>
          </div>
        </>
      ) : (
        <>
          <div className="title">
            <h1>
              Step 2/6 Skogbruksplan Color Codings: Please wait while we are
              preparing the Skogbruksplan for your forest...
            </h1>
          </div>
          <ForestScene />
        </>
      )}
      {modalOpen && (
        <Modal isOpen={modalOpen} toggle={toggleModal}>
          <div className="modal-header">
            <h2 className="modal-title" id="exampleModalLabel">
              Do you see the Skogbruksplan cut for your forest?
            </h2>
            <button
              type="button"
              className="close"
              data-dismiss="modal"
              aria-hidden="true"
              onClick={toggleModal}
            >
              <i className="tim-icons icon-simple-remove" />
            </button>
          </div>
          <ModalFooter>
            <Button color="danger" onClick={toggleModal}>
              No, Try Again
            </Button>
            <Button color="success" onClick={handleForestConfirm}>
              Yes, Continue
            </Button>
          </ModalFooter>
        </Modal>
      )}
      {isLoading && (
        <div className="overlay-spinner">
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        </div>
      )}
    </>
  );
};

export default ForestCut;
