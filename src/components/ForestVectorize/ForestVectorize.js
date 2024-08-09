/* eslint-disable react-hooks/exhaustive-deps */
import { useAuth } from 'contexts/AuthContext';
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

  const [geoJson, setGeoJson] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [VectorFileExists, setVectorFileExists] = useState(false);
  // get the current user uid
  const { currentUser } = useAuth();

  useEffect(() => {
    const checkFile = async () => {
      const forestID = currentUser.uid;
      const VectorExists = await checkFileExists(
        S3_OUTPUTS_BUCKET_NAME,
        `${S3_VECTORIZE_FOLDER_NAME}/${forestID}_vectorized_HK.shp`
      );
      setVectorFileExists(VectorExists);
    };

    const interval = setInterval(() => {
      if (currentUser && !VectorFileExists) {
        checkFile();
      } else {
        clearInterval(interval);
      }
    }, 120000); // Check every 5 seconds

    // Check once if the file exists
    checkFile();

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
        setModalOpen(true);
      }
    }, [geoJson, map]);

    return null;
  };

  const handleForestConfirm = async () => {
    navigate('/featureInfo');
  };
  return (
    <>
      {VectorFileExists && currentUser ? (
        <>
          <div className="title">
            <h1>STEP 2/4 for your Skogbruksplan is done!</h1>
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
              Step 2/4 Polygons Creation: Please wait while we are preparing the
              Skogbruksplan for your forest. Based on the size of your forest,
              this could take up to 10 minutes.
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

export default ForestVectorize;
