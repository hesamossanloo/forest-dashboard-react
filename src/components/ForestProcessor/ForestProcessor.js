/* eslint-disable react-hooks/exhaustive-deps */
import { useAuth } from 'contexts/AuthContext';
import { useEffect, useState } from 'react';
import { checkFileExists, downloadS3File } from 'services/AWS';
import { S3_CUT_FOLDER_NAME, S3_OUTPUTS_BUCKET_NAME } from 'variables/AWS';
import './ForestProcessor.scss';

import { Buffer } from 'buffer';
import ForestScene from 'components/ForestScene/ForestScene';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

const ForestProcessor = () => {
  const [fileExists, setFileExists] = useState(false);
  const [forestHKPNG, setForestHKPNG] = useState(null);
  const [geoJson, setGeoJson] = useState(null);

  // get the current user uid
  const { currentUser } = useAuth();

  useEffect(() => {
    // Check if the file exists every 5 seconds
    const interval = setInterval(async () => {
      if (currentUser && !fileExists) {
        const forestID = currentUser.uid;
        const exists = await checkFileExists(
          S3_OUTPUTS_BUCKET_NAME,
          `${S3_CUT_FOLDER_NAME}/${forestID}_HK_image_cut.svg`
        );
        setFileExists(exists);
      }
    }, 1000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [fileExists, currentUser]);

  // if file is ready download it from s3 and save it under the folder assets/data
  useEffect(() => {
    const downloadFile = async () => {
      const forestID = currentUser.uid;
      const data = await downloadS3File(
        S3_OUTPUTS_BUCKET_NAME,
        `${S3_CUT_FOLDER_NAME}/${forestID}_HK_image_cut.png`
      );
      if (data) {
        const parsedJSON = JSON.parse(currentUser.FBUser.forests[0]);
        setGeoJson(parsedJSON);

        // Convert the downloaded data to a base64 URL
        const base64Data = Buffer.from(data.Body).toString('base64');
        const imageUrl = `data:image/png;base64,${base64Data}`;
        setForestHKPNG(imageUrl);
      }
    };
    if (fileExists) {
      downloadFile();
    }
  }, [fileExists, currentUser]);

  // eslint-disable-next-line react/prop-types
  const MapComponent = ({ geoJson }) => {
    const map = useMap();

    useEffect(() => {
      if (geoJson) {
        const geoJsonLayer = L.geoJSON(geoJson).addTo(map);
        map.flyToBounds(geoJsonLayer.getBounds());

        if (forestHKPNG) {
          L.imageOverlay(forestHKPNG, geoJsonLayer.getBounds(), {
            opacity: 0.5,
          }).addTo(map);
        }
      }
    }, [geoJson, map, forestHKPNG]);

    return null;
  };
  return (
    <>
      {fileExists && currentUser && forestHKPNG ? (
        <>
          <div className="title">
            <h1>Your Skogbruksplan Cut is ready!</h1>
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
            <h1>Please wait while we process your forest...</h1>
          </div>
          <ForestScene />
        </>
      )}
    </>
  );
};

export default ForestProcessor;
