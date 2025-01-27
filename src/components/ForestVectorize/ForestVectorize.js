/* eslint-disable react-hooks/exhaustive-deps */
import { useAuth } from 'contexts/AuthContext';
import LZString from 'lz-string';
import { useEffect, useState } from 'react';
import { checkFileExists, downloadS3File } from 'services/AWS';
import { S3_OUTPUTS_BUCKET_NAME } from 'variables/AWS';
import './ForestVectorize.scss';

import ForestScene from 'components/ForestScene/ForestScene';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Button, Modal, ModalFooter } from 'reactstrap';

import { useNavigate } from 'react-router-dom';
import { S3_VECTORIZE_FOLDER_NAME } from 'variables/AWS';

import shp from 'shpjs';

const ForestVectorize = () => {
  const navigate = useNavigate();
  const { currentUser, logout, removeForest } = useAuth();

  const [geoJson, setGeoJson] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [VectorFileExists, setVectorFileExists] = useState(false);
  // get the current user uid

  const [show, setShow] = useState(false);
  // if user is not logged in redirect to sigin page
  useEffect(() => {
    let localUser = null;
    const compressedUserData = localStorage.getItem('currentUser');
    if (compressedUserData) {
      localUser = JSON.parse(LZString.decompressFromUTF16(compressedUserData));
    }
    if (!localUser?.uid) {
      navigate('/signin');
    } else if (localUser?.FBUser?.forest?.vector) {
      navigate('/map');
    } else {
      setShow(true);
    }
  }, [navigate]);

  useEffect(() => {
    const checkFile = async () => {
      const forestID = currentUser.uid;
      const VectorExists = await checkFileExists(
        S3_OUTPUTS_BUCKET_NAME,
        `${S3_VECTORIZE_FOLDER_NAME}/${forestID}_vectorized_HK.shp`
      );
      setVectorFileExists(VectorExists);
      if (!VectorExists) {
        return;
      }
    };

    const interval = setInterval(() => {
      if (currentUser && !VectorFileExists) {
        checkFile();
      } else {
        clearInterval(interval);
      }
    }, 120000); // Check every 2 minutes

    // Check once if the file exists
    if (currentUser && !VectorFileExists) {
      checkFile();
    }

    return () => clearInterval(interval);
  }, [VectorFileExists, currentUser]);

  // if file is ready download it from s3 and save it under the folder assets/data
  useEffect(() => {
    const downloadFile = async () => {
      const forestID = currentUser.uid;
      const shpFile = await downloadS3File(
        S3_OUTPUTS_BUCKET_NAME,
        `${S3_VECTORIZE_FOLDER_NAME}/${forestID}_vectorized_HK.shp`
      );
      const shxFile = await downloadS3File(
        S3_OUTPUTS_BUCKET_NAME,
        `${S3_VECTORIZE_FOLDER_NAME}/${forestID}_vectorized_HK.shx`
      );
      const dbfFile = await downloadS3File(
        S3_OUTPUTS_BUCKET_NAME,
        `${S3_VECTORIZE_FOLDER_NAME}/${forestID}_vectorized_HK.dbf`
      );

      if (shpFile && shxFile && dbfFile) {
        // Convert SHP files to GeoJSON
        const geoJsonData = await shp({
          shp: shpFile.Body,
          shx: shxFile.Body,
          dbf: dbfFile.Body,
        });
        setGeoJson(geoJsonData);
        setModalOpen(true);
      }
    };
    if (VectorFileExists) {
      downloadFile();
    }
  }, [VectorFileExists, currentUser]);

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
      }
    }, [geoJson, map]);

    return null;
  };

  const handleForestConfirm = async () => {
    navigate('/featureInfo');
  };

  const handleLogout = async () => {
    try {
      await removeForest();
      await logout();
    } catch (error) {
      console.error('Error handling logout:', error);
    }
  };

  if (!show) {
    return null;
  }
  return (
    <>
      {VectorFileExists && currentUser ? (
        <>
          <div className="title">STEP 3/6 for your Skogbruksplan is done!</div>
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
            Step 3/6 Polygons Creation: Please wait while we are preparing the
            Skogbruksplan for your forest. Based on the size of your forest,
            this step could take up to 4 minutes.
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Button color="danger" onClick={handleLogout}>
          Cancel
        </Button>
      </div>
    </>
  );
};

export default ForestVectorize;
