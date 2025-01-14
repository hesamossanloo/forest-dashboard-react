import { Buffer } from 'buffer';
import ToggleSwitch from 'components/ToggleSwitch/ToggleSwitch.js';
import { useAuth } from 'contexts/AuthContext.js';
import { MapFilterContext } from 'contexts/MapFilterContext.js';
import L from 'leaflet';
import LZString from 'lz-string';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  GeoJSON,
  ImageOverlay,
  LayerGroup,
  LayersControl,
  MapContainer,
  TileLayer,
  WMSTileLayer,
  ZoomControl,
} from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { Button } from 'reactstrap';
import { fetchAirtablePrices } from 'services/airtable.js';
import { downloadS3File } from 'services/AWS';
import { checkFileExists } from 'services/AWS.js';
import shp from 'shpjs';
import CustomMapEvents from 'utilities/Map/CustomMapEvents';
import {
  S3_CUT_FOLDER_NAME,
  S3_FEATURE_INFO_FOLDER_NAME,
  S3_OUTPUTS_BUCKET_NAME,
} from 'variables/AWS.js';
import { MAP_DEFAULT_ZOOM_LEVEL } from 'variables/forest.js';
import '../utilities/Map/PopupMovable.js';
import '../utilities/Map/SmoothWheelZoom.js';

const { BaseLayer, Overlay } = LayersControl;
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});
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
/* eslint-disable react/react-in-jsx-scope */
function Map() {
  const [activeOverlay, setActiveOverlay] = useState({
    Teig: true,
    MIS: true,
    Stands: true,
    Skogbruksplan: false,
  });

  const [mapFilter, setMapFilter] = useContext(MapFilterContext);

  const [selectedVectorFeature, setSelectedVectorFeature] = useState(null);
  const selectedVectorFeatureRef = useRef(selectedVectorFeature);
  const [multiPolygonSwitchIsON, setMultiPolygonSwitchIsON] = useState(false);
  const [deselectPolygons, setDeselectPolygons] = useState(false);
  const multiPolygonSwitchIsONRef = useRef(multiPolygonSwitchIsON);
  const previousGeoJSONLayersRef = useRef([]);
  const userPolygonsRef = useRef(null);
  const { currentUser, updateUserSpeciesPrices } = useAuth();
  const [forestBounds, setForestBounds] = useState(null);
  const [forestPNG, setForestPNG] = useState(null);
  const [userForestTeig, setUserForestTeig] = useState(null);
  const navigate = useNavigate();

  // New state variable to hold the user information from localstorage
  const [persistedUser, setPersistedUser] = useState(currentUser);

  // Get the stored currentUser from the localstorage
  useEffect(() => {
    let localUser = null;
    const compressedUserData = localStorage.getItem('currentUser');
    if (compressedUserData) {
      localUser = LZString.decompressFromUTF16(compressedUserData);
    }
    if (localUser) {
      const parsedUser = JSON.parse(localUser);
      setPersistedUser(parsedUser);
    } else {
      navigate('/signin');
    }
  }, [currentUser.uid, navigate]);

  // Check if the stored currentUser has all the necessary properties
  useEffect(() => {
    // Handle the forest PNG
    if (!persistedUser?.FBUser?.forest?.PNG) {
      // Download Forest PNG image
      const downloadPNG = async () => {
        const forestID = persistedUser.uid;
        const PMGFileExists = await checkFileExists(
          S3_OUTPUTS_BUCKET_NAME,
          `${S3_CUT_FOLDER_NAME}/${forestID}_HK_image_cut.png`
        );
        if (!PMGFileExists) {
          return;
        }
        const PNGData = await downloadS3File(
          S3_OUTPUTS_BUCKET_NAME,
          `${S3_CUT_FOLDER_NAME}/${forestID}_HK_image_cut.png`
        );
        if (PNGData && PNGData.Body) {
          // Convert the downloaded data to a base64 URL
          const base64Data = Buffer.from(PNGData.Body).toString('base64');
          const PNGURL = `data:image/png;base64,${base64Data}`;
          persistedUser.FBUser.forest.PNG = PNGURL; // Add the PNG URL to the user data
        }
      };
      downloadPNG();
    }
    setForestPNG(persistedUser.FBUser.forest.PNG);
    // Handle the forest SHP file
    if (!persistedUser?.FBUser?.forest?.vector) {
      // Download Forest SHP file
      const downloadSHP = async () => {
        const forestID = persistedUser.uid;
        const SHPFileExists = await checkFileExists(
          S3_OUTPUTS_BUCKET_NAME,
          `${S3_FEATURE_INFO_FOLDER_NAME}/${forestID}_vector_w_HK_infos.shp`
        );
        if (!SHPFileExists) {
          return;
        }
        const { shpFile, shxFile, dbfFile } = await downloadS3SHPFile(forestID);
        if (shpFile && shxFile && dbfFile) {
          const geoJSONWithInfo = await shp({
            shp: shpFile.Body,
            shx: shxFile.Body,
            dbf: dbfFile.Body,
          });
          persistedUser.FBUser.forest.vector = geoJSONWithInfo; // Add the GeoJSON to the user data
        }
      };
      downloadSHP();
    }
    // Handle prices
    if (!persistedUser?.FBUser?.prices) {
      const fetchPrices = async () => {
        const airtablePrices = await fetchAirtablePrices();
        updateUserSpeciesPrices(airtablePrices);
        persistedUser.FBUser.prices = airtablePrices;
      };
      fetchPrices();
    }
    // Handle Teig
    if (persistedUser?.FBUser?.forest?.teig) {
      const forest = persistedUser.FBUser.forest.teig;
      if (forest) {
        const bounds = L.geoJSON(JSON.parse(forest)).getBounds();
        setForestBounds(bounds);
        setUserForestTeig(JSON.parse(forest));
      }
    }
    // Compress the updated user object
    const compressedUserData = LZString.compressToUTF16(
      JSON.stringify(persistedUser)
    );
    localStorage.setItem('currentUser', compressedUserData);
  }, [
    persistedUser.FBUser.forest.vector,
    persistedUser.FBUser.forest.teig,
    persistedUser.FBUser.forest,
    persistedUser.FBUser.prices,
    persistedUser.FBUser,
    persistedUser.uid,
    persistedUser,
    updateUserSpeciesPrices,
  ]);

  // Handles the Map Filter states and the border colors
  useEffect(() => {
    const geoJsonLayer = userPolygonsRef.current;
    if (geoJsonLayer) {
      geoJsonLayer.eachLayer((layer) => {
        const feature = layer.feature;
        if (!previousGeoJSONLayersRef.current.includes(layer)) {
          if (feature.properties.hogstkl_ve === '5') {
            layer.setStyle({
              color: mapFilter.HK5 ? '#de6867' : 'blue',
              weight: mapFilter.HK5 ? 6 : 1,
            });
          }
          if (feature.properties.hogstkl_ve === '4') {
            layer.setStyle({
              color: mapFilter.HK4 ? '#bc8963' : 'blue',
              weight: mapFilter.HK4 ? 6 : 1,
            });
          }
        }
      });
    }
  }, [mapFilter]);

  useEffect(() => {
    selectedVectorFeatureRef.current = selectedVectorFeature;
  }, [selectedVectorFeature]);

  // Update the ref every time multiPolygonSwitchIsON changes
  useEffect(() => {
    multiPolygonSwitchIsONRef.current = multiPolygonSwitchIsON;
  }, [multiPolygonSwitchIsON]);

  const handleGeoJSONLayerClick = (feature, geoJSONLayer) => {
    if (feature && feature.properties && feature.properties.teig_best_) {
      selectedVectorFeatureRef.current = feature;
      setSelectedVectorFeature(feature);
    }
    // If in Single mode
    if (!multiPolygonSwitchIsONRef.current) {
      // if the selected features was already in the list then unhighlight the previous layer
      if (previousGeoJSONLayersRef.current.includes(geoJSONLayer)) {
        previousGeoJSONLayersRef.current.forEach((lr) => {
          // Handle if the HK5 & 4 filter is avtive for red and green colors
          if (lr.feature.properties.hogstkl_ve === '5') {
            lr.setStyle({
              color: mapFilter.HK5 ? '#de6867' : 'blue', // Color for the border
              weight: mapFilter.HK5 ? 6 : 1,
            });
          } else if (lr.feature.properties.hogstkl_ve === '4') {
            lr.setStyle({
              color: mapFilter.HK4 ? '#bc8963' : 'blue', // Color for the border
              weight: mapFilter.HK4 ? 6 : 1,
            });
          } else {
            lr.setStyle({
              color: 'blue',
              weight: 1,
            });
          }
        });
        previousGeoJSONLayersRef.current = [];
      } else {
        // if the selected features was NOT already in the list then: first
        // unhighlight all the previous layer and highlight th enew layer
        if (previousGeoJSONLayersRef.current.length > 0) {
          previousGeoJSONLayersRef.current.forEach((lr) => {
            if (lr.feature.properties.hogstkl_ve === '5') {
              lr.setStyle({
                color: mapFilter.HK5 ? '#de6867' : 'blue',
                weight: mapFilter.HK5 ? 6 : 1,
              });
            } else if (lr.feature.properties.hogstkl_ve === '4') {
              lr.setStyle({
                color: mapFilter.HK4 ? '#bc8963' : 'blue',
                weight: mapFilter.HK4 ? 6 : 1,
              });
            } else {
              lr.setStyle({
                color: 'blue',
                weight: 1,
              });
            }
          });
        }
        previousGeoJSONLayersRef.current = []; // Reset the list of previous layers
        setTimeout(() => {
          geoJSONLayer.setStyle({
            color: 'yellow', // Color for the border
            weight: 6, // Increase border width to make it visible
          });
        }, 0);
        previousGeoJSONLayersRef.current = [geoJSONLayer];
      }
    } else {
      // In Multi Mode

      // if the current clicked layer is already in the list of previous layers,
      // then remove it from the previous one and turn it blue
      if (previousGeoJSONLayersRef.current.includes(geoJSONLayer)) {
        // If the HK5 & 4 filter is active for red and green colors
        if (feature.properties.hogstkl_ve === '5') {
          geoJSONLayer.setStyle({
            color: mapFilter.HK5 ? '#de6867' : 'blue', // Color for the border
            weight: mapFilter.HK5 ? 6 : 1,
          });
        } else if (feature.properties.hogstkl_ve === '4') {
          geoJSONLayer.setStyle({
            color: mapFilter.HK4 ? '#bc8963' : 'blue', // Color for the border
            weight: mapFilter.HK4 ? 6 : 1,
          });
        } else {
          geoJSONLayer.setStyle({
            color: 'blue',
            weight: 1,
          });
        }
        previousGeoJSONLayersRef.current =
          previousGeoJSONLayersRef.current.filter(
            (layer) => layer !== geoJSONLayer
          );
      } else {
        setTimeout(() => {
          geoJSONLayer.setStyle({
            color: 'yellow', // Color for the border
            weight: 6, // Increase border width to make it visible
          });
        }, 0);

        previousGeoJSONLayersRef.current.push(geoJSONLayer);
      }
    }
  };

  // Handles the Map Filter states and the border colors
  useEffect(() => {
    const geoJsonLayer = userPolygonsRef.current;

    if (geoJsonLayer) {
      // Remove existing click event listeners
      geoJsonLayer.eachLayer((layer) => {
        layer.off('click');
      });

      // Add new click event listeners
      geoJsonLayer.eachLayer((layer) => {
        layer.on('click', () => {
          const feature = layer.feature;
          handleGeoJSONLayerClick(feature, layer);
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapFilter]);

  const onEachFeature = (feature, geoJSONLayer) => {
    geoJSONLayer.setStyle({
      fillColor: 'transparent',
      fillOpacity: 0,
      color: 'blue', // Make borders transparent initially
      weight: 1,
    }); // Set default transparent style for the GeoJSON layer

    geoJSONLayer.on({
      click: () => handleGeoJSONLayerClick(feature, geoJSONLayer),
    });
  };

  // // eslint-disable-next-line react/prop-types
  // const ChangeView = ({ center, zoom }) => {
  //   const map = useMap();
  //   selectedForestFirstTime && map.setView(center, zoom);
  //   // To solve the issue with the always centering the map after choosing a forest
  //   useEffect(() => {
  //     setSelectedForestFirstTime(false);
  //   }, []);
  //   return null;
  // };

  const toggleSelectMultiPolygons = () => {
    setMultiPolygonSwitchIsON((prevState) => !prevState);
  };
  const resetHighlightedFeatures = () => {
    setMapFilter({
      HK4: false,
      HK5: false,
      Protected: false,
    });
    setSelectedVectorFeature(null);
    previousGeoJSONLayersRef.current.forEach((layer) => {
      layer.setStyle({
        fillColor: 'transparent',
        fillOpacity: 0,
        color: 'transparent', // Reset borders to transparent
        weight: 1,
      });
    });
    previousGeoJSONLayersRef.current = [];
    // Clear the array after resetting styles
    setDeselectPolygons(true);
  };
  return (
    <>
      {!persistedUser || !forestBounds ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <ToggleSwitch
            id="multiPolygon"
            disabled={
              !activeOverlay['Stands'] && !activeOverlay['Skogbruksplan']
            }
            style={{
              position: 'absolute',
              top: 80,
              right: 10,
              zIndex: 9999,
            }}
            checked={multiPolygonSwitchIsON}
            optionLabels={['Multi Select', 'Single Select']}
            onChange={toggleSelectMultiPolygons}
          />
          <Button
            color="warning"
            style={{
              zIndex: '10',
              position: 'fixed',
              right: '10px',
              top: '115px',
              width: '115px',
              padding: '10px 0 10px 0',
            }}
            onClick={resetHighlightedFeatures}
          >
            Deselect all
          </Button>
          <MapContainer
            id="SkogAppMapContainer"
            popupMovable={true}
            popupMovableZoomMode="relative"
            scrollWheelZoom={false} // disable original zoom function
            smoothWheelZoom={true} // enable smooth zoom
            smoothSensitivity={10} // zoom speed. default is 1
            closePopupOnClick={false}
            zoomControl={false}
            center={[
              forestBounds.getCenter().lat,
              forestBounds.getCenter().lng,
            ]}
            zoom={MAP_DEFAULT_ZOOM_LEVEL}
            maxZoom={22}
            continuousWorld={true}
            worldCopyJump={false}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              height: '100vh',
              width: '100vw',
            }}
          >
            {/* <ChangeView
              center={selectedForest.coord}
              zoom={selectedForest.name === 'forest3' ? 12 : 13}
            /> */}
            <CustomMapEvents
              activeOverlay={activeOverlay}
              setActiveOverlay={setActiveOverlay}
              multiPolygonSwitchIsON={multiPolygonSwitchIsON}
              deselectPolygons={deselectPolygons}
              userForestTeig={userForestTeig}
              selectedVectorFeatureRef={selectedVectorFeatureRef}
              setDeselectPolygons={setDeselectPolygons}
            />
            <ZoomControl position="bottomright" />
            <LayersControl position="bottomright">
              <BaseLayer checked name="OpenStreetMap">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
              </BaseLayer>
              <BaseLayer name="Satellite">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a> contributors'
                />
              </BaseLayer>
              {/* Skogbruksplan */}
              <Overlay
                checked={activeOverlay['Skogbruksplan']}
                name="Skogbruksplan"
              >
                <LayerGroup>
                  {/* Forest PNG */}
                  {forestPNG && (
                    <ImageOverlay
                      url={forestPNG}
                      bounds={forestBounds}
                      opacity={0.5}
                    />
                  )}
                  {/* WMSTileLayer */}
                  <WMSTileLayer
                    url="https://wms.nibio.no/cgi-bin/skogbruksplan?"
                    layers="hogstklasser"
                    format="image/png"
                    transparent={true}
                    version="1.3.0"
                    opacity={0}
                  />
                </LayerGroup>
              </Overlay>
              {/* Teig */}
              <Overlay name="Teig" checked={activeOverlay['Teig']}>
                <LayerGroup>
                  {userForestTeig && (
                    <GeoJSON
                      data={userForestTeig}
                      style={() => ({
                        color: 'blue', // color of the lines
                        fillColor: 'transparent', // fill color
                      })}
                    />
                  )}
                </LayerGroup>
              </Overlay>
              {/* Stands */}
              <Overlay name="Stands" checked={activeOverlay['Stands']}>
                <LayerGroup>
                  <GeoJSON
                    ref={userPolygonsRef}
                    onEachFeature={onEachFeature}
                    data={persistedUser.FBUser.forest.vector}
                  />
                </LayerGroup>
              </Overlay>
              <Overlay name="High Resolution" checked>
                <WMSTileLayer
                  url="https://services.geodataonline.no:443/arcgis/services/Geocache_UTM33_EUREF89/GeocacheBilder/MapServer/WMSServer"
                  // url="https://xvkdluncc4.execute-api.eu-north-1.amazonaws.com/Prod/hello"
                  attribution="Images are from ca. May 2023"
                  layers="0"
                  format="image/jpeg"
                  version="1.3.0"
                  maxZoom={22}
                />
              </Overlay>
              {/* MIS */}
              <Overlay name="MIS" checked={activeOverlay['MIS']}>
                <WMSTileLayer
                  url="https://wms.nibio.no/cgi-bin/mis"
                  layers="Livsmiljo_ikkeutvalgt,Livsmiljo,Hule_lauvtrar_punkt,Rikbarkstrar_alle,Trar_m_hengelav_alle,Bekkeklofter,Leirraviner,Rik_bakkevegetasjon,Brannflater,Gamle_trar,Eldre_lauvsuksesjon,Liggende_dod_ved,Staende_dod_ved,Nokkelbiotop,Bergvegger_alle"
                  language="nor"
                  format="image/png"
                  transparent={true}
                  version="1.3.0"
                />
              </Overlay>
            </LayersControl>
          </MapContainer>
        </>
      )}
    </>
  );
}

export default Map;
