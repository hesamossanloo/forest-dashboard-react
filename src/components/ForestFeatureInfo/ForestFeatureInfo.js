/* eslint-disable react-hooks/exhaustive-deps */
import { useAuth } from 'contexts/AuthContext';
import { useEffect, useState } from 'react';
import { checkFileExists, downloadS3File } from 'services/AWS';
import { S3_OUTPUTS_BUCKET_NAME } from 'variables/AWS';
import './ForestFeatureInfo.scss';

import ForestScene from 'components/ForestScene/ForestScene';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Button, Modal, ModalFooter } from 'reactstrap';

import { useNavigate } from 'react-router-dom';

import { doc, getDoc } from 'firebase/firestore';
import { useRef } from 'react';
import { db } from 'services/firebase';
import shp from 'shpjs';
import { S3_FEATURE_INFO_FOLDER_NAME } from 'variables/AWS';

const ForestFeatureInfo = () => {
  const navigate = useNavigate();
  const [requestSent, setRequestSent] = useState(false);
  const [SHPFileExists, setSHPFileExists] = useState(false);
  const [AllPolygonsGeoJson, setAllPolygonsGeoJson] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const hasDownloaded = useRef(false); // Use a ref to track if the file has been downloaded

  // get the current user uid
  const { currentUser, updateFBUser } = useAuth();

  useEffect(() => {
    const checkFile = async () => {
      const forestID = currentUser.uid;
      const VectorWInfoExists = await checkFileExists(
        S3_OUTPUTS_BUCKET_NAME,
        `${S3_FEATURE_INFO_FOLDER_NAME}/${forestID}_vector_w_HK_infos.shp`
      );
      setSHPFileExists(VectorWInfoExists);
    };

    const interval = setInterval(() => {
      if (currentUser && !SHPFileExists) {
        checkFile();
      } else {
        clearInterval(interval);
      }
    }, 120000); // Check every 5 seconds

    // Check once if the file exists
    checkFile();

    return () => clearInterval(interval);
  }, [SHPFileExists, currentUser]);

  // if file is ready download it from s3 and save it under the folder assets/data
  useEffect(() => {
    const downloadFile = async () => {
      const forestID = currentUser.uid;
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

      if (shpFile && shxFile && dbfFile) {
        // Convert SHP files to GeoJSON
        const geoJsonWithInfos = await shp({
          shp: shpFile.Body,
          shx: shxFile.Body,
          dbf: dbfFile.Body,
        });
        setAllPolygonsGeoJson(geoJsonWithInfos);
        await updateFBUser({
          ...currentUser.FBUser,
          forest: {
            ...currentUser.FBUser.forest,
            vector: JSON.stringify(geoJsonWithInfos),
          },
        });
      }
    };
    if (SHPFileExists && !hasDownloaded.current) {
      hasDownloaded.current = true;
      downloadFile();
    }
  }, [SHPFileExists, currentUser]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

  // eslint-disable-next-line react/prop-types
  const MapComponent = ({ geoJson }) => {
    const map = useMap();

    useEffect(() => {
      if (geoJson) {
        const geoJsonLayer = L.geoJSON(geoJson).addTo(map);
        map.flyToBounds(geoJsonLayer.getBounds());
        setModalOpen(true);
      }
    }, [geoJson, map]);

    return null;
  };

  const handleForestConfirm = async () => {
    if (requestSent) {
      console.log('Request already sent. So not sending again!');
      navigate('/SR16Intersection');
    } else {
      try {
        let requestPayload = null;
        setRequestSent(true); // Mark the request as sent
        if (currentUser.FBUser.forest && currentUser.FBUser.forest.teig) {
          requestPayload = currentUser.FBUser.forest.teig;
        } else {
          // Get the teig from the Firestore
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            requestPayload = userData.FBUser.forest.teig;
          }
        }

        // Set a timeout for the fetch request
        const fetchWithTimeout = (url, options, timeout = 29000) => {
          return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Request timed out')), timeout)
            ),
          ]);
        };
        await fetchWithTimeout(
          'https://sktkye0v17.execute-api.eu-north-1.amazonaws.com/Prod/SR16IntersectionToAirtable',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: requestPayload,
          }
        );
        navigate('/SR16Intersection');
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };
  return (
    <>
      {SHPFileExists && currentUser ? (
        <>
          <div className="title">
            <h1>STEP 3/4 for your Skogbruksplan is done!</h1>
          </div>
          <div className="mapContainer">
            <MapContainer center={[59.9139, 10.7522]} zoom={13}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapComponent geoJson={AllPolygonsGeoJson} />
            </MapContainer>
          </div>
        </>
      ) : (
        <>
          <div className="title">
            <h1>
              Step 3/4 Bestands Info Gathering: Please wait while we are
              preparing the Skogbruksplan for your forest. Based on the size of
              your forest, this could take up to 5 minutes.
            </h1>
          </div>
          <ForestScene />
        </>
      )}
      {modalOpen && (
        <Modal isOpen={modalOpen} toggle={toggleModal}>
          <div className="modal-header">
            <h2 className="modal-title" id="exampleModalLabel">
              Do you see the Polygons for your forest?
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
    </>
  );
};

export default ForestFeatureInfo;
