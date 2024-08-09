import { useAirtable } from 'contexts/AirtableContext';
import { useAuth } from 'contexts/AuthContext';
import L from 'leaflet';
import { WMSGetFeatureInfo } from 'ol/format';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import {
  MIS_BESTAND_IDs,
  nibioGetFeatInfoMISBaseParams,
} from 'variables/forest';
import SkogbrukWMSFeaturesHandler from './SkogbrukWMSFeaturesHandler';
import {
  calculateBoundingBox,
  isPointInsideMultiPolygon,
  isPointInsideTeig,
  openHKPopupWithContent,
  validateAndCloseOnlyPolygonsCoordinates,
  WFSFeatureLayerNamefromXML,
} from './utililtyFunctions';

CustomMapEvents.propTypes = {
  activeOverlay: PropTypes.shape({
    Teig: PropTypes.bool,
    MIS: PropTypes.bool,
    Stands: PropTypes.bool,
    Skogbruksplan: PropTypes.bool,
  }).isRequired,
  setActiveOverlay: PropTypes.func.isRequired,
  setDeselectPolygons: PropTypes.func.isRequired,
  selectedVectorFeatureRef: PropTypes.object.isRequired,
  multiPolygonSwitchIsON: PropTypes.bool.isRequired,
  deselectPolygons: PropTypes.bool.isRequired,
  userForestTeig: PropTypes.object.isRequired,
  // madsTeig: PropTypes.object.isRequired,
  // bjoernTeig: PropTypes.object.isRequired,
  // knutTeig: PropTypes.object.isRequired,
  // akselTeig: PropTypes.object.isRequired,
  // selectedForest: PropTypes.object.isRequired,
};

export default function CustomMapEvents(props) {
  const {
    activeOverlay,
    setActiveOverlay,
    setDeselectPolygons,
    selectedVectorFeatureRef,
    userForestTeig,
    // madsTeig,
    // bjoernTeig,
    // knutTeig,
    // akselTeig,
    multiPolygonSwitchIsON,
    deselectPolygons,
    // selectedForest,
  } = props;
  const map = useMap();
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const { airTableBestandInfos, isFetchingAirtableRecords, airTableTooltips } =
    useAirtable();
  const { userSpeciesPrices } = useAuth();

  // Check if the click is within the coordinates of a GeoJSON
  // In this case I am passing in the Mad's forest Teig Polygon
  // const forests = [madsTeig, bjoernTeig, knutTeig, akselTeig];
  // const forestName = selectedForest.name;
  // const chosenForest = forests.find((forest) => forest.name === forestName);

  useEffect(() => {
    if (deselectPolygons) {
      map.closePopup();
      setSelectedFeatures([]);
      selectedVectorFeatureRef.current = null;
      setDeselectPolygons(false);
    } else {
      // This will reset the selected features when multiPolygonSwitchIsON changes
      setSelectedFeatures([...selectedFeatures]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiPolygonSwitchIsON, deselectPolygons]); // Dependency array includes multiPolygonSwitchIsON

  useMapEvents({
    click: async (e) => {
      // Assuming leaflet-pip is already included in your project
      let clickedOnHKGeoJSON = false;

      map.eachLayer((layer) => {
        // if (layer.feature && !validateAndCloseLayersPolygonCoordinates(layer)) {
        //   console.error('Invalid GeoJSON Layer:', layer);
        //   return;
        // }
        if (layer instanceof L.GeoJSON) {
          // Check each feature in the GeoJSON layer
          layer.eachLayer((feature) => {
            // Get the polygon from the feature
            let polygon = feature.toGeoJSON();
            polygon = validateAndCloseOnlyPolygonsCoordinates(polygon);

            if (
              polygon.properties.teig_best_ &&
              isPointInsideMultiPolygon(e.latlng, polygon.geometry.coordinates)
            ) {
              clickedOnHKGeoJSON = true;
            }
          });
        }
      });

      if (
        userForestTeig.features.some((feature) =>
          isPointInsideTeig(e.latlng, feature.geometry.coordinates)
        ) &&
        !clickedOnHKGeoJSON
      ) {
        L.popup({ interactive: true })
          .setLatLng(e.latlng)
          .setContent(
            '<h5 style="color: black; text-align: center;">This is not a Bestand!</h5>'
          )
          .openOn(map);
      }
      if (
        (activeOverlay['Stands'] || activeOverlay['Skogbruksplan']) &&
        clickedOnHKGeoJSON
      ) {
        // By default we are closing all the popups, in case there are any opens
        // an then we will show the pop up after the new call to the WMS and once
        // the data are fetched.
        map.closePopup();

        if (
          userForestTeig &&
          isPointInsideTeig(
            e.latlng,
            userForestTeig.features[0].geometry.coordinates
          ) &&
          selectedVectorFeatureRef.current &&
          selectedVectorFeatureRef.current.properties
        ) {
          let MISClickedFeatureInfos;

          const teigBestNrLastSelected =
            selectedVectorFeatureRef.current.properties.teig_best_;

          // Handle MIS Layer (Forbidden areas WMS)
          if (
            activeOverlay['MIS'] &&
            MIS_BESTAND_IDs.indexOf(teigBestNrLastSelected) > -1
          ) {
            if (!selectedFeatures.includes(selectedVectorFeatureRef.current)) {
              openHKPopupWithContent('Loading...', e, map);
              // Preparing the request to GetFeatreInfo for MIS WMS
              // The NIBIO WMS expects the Query params to follow certain patterns. After
              // analysing how QGIS made the WMS call, reverse engineered the call
              // and here we are building one of those params, i.e. BBOX, size.x, size.y and the CRS
              const { CRS, size, BBOX } = calculateBoundingBox(map);
              // The params should be in uppercase, unless the WMS won't accept it
              const params = {
                ...nibioGetFeatInfoMISBaseParams,
                BBOX,
                CRS,
                WIDTH: size.x,
                HEIGHT: size.y,
                I: Math.round(e.containerPoint.x),
                J: Math.round(e.containerPoint.y),
              };
              const url = `https://wms.nibio.no/cgi-bin/mis?${new URLSearchParams(params).toString()}`;
              const response = await fetch(url);
              const data = await response.text();
              const WMSFeatureInfoRaw = new WMSGetFeatureInfo();
              const layerNames = WFSFeatureLayerNamefromXML(data);
              MISClickedFeatureInfos = WMSFeatureInfoRaw.readFeatures(data);
              // Assuming layerNames is an array of strings and MISClickedFeatureInfos is an array of objects
              if (layerNames.length === MISClickedFeatureInfos.length) {
                // Loop through each feature info
                MISClickedFeatureInfos.forEach((featureInfo, index) => {
                  // Assign the corresponding layer name from layerNames to this feature info
                  // Assuming you're adding a new property 'layerName' to each feature info object
                  featureInfo.layerName = layerNames[index];
                });
              } else {
                console.error(
                  'The count of layerNames does not match the count of MISClickedFeatureInfos'
                );
              }
            }
          }

          // Reset selected features if not in multiPolygonSwitchIsON mode
          // In Single mode
          if (!multiPolygonSwitchIsON) {
            // Check if the clicked polygon was already selected
            if (
              teigBestNrLastSelected &&
              !selectedFeatures.some(
                (feature) =>
                  feature.properties?.teig_best_ === teigBestNrLastSelected
              )
            ) {
              // If NOT the add to selected features for multi selection mode
              setSelectedFeatures([selectedVectorFeatureRef.current]);
              if (
                !isFetchingAirtableRecords &&
                airTableBestandInfos.length > 0
              ) {
                // Ensure data is loaded
                SkogbrukWMSFeaturesHandler(
                  e,
                  [selectedVectorFeatureRef.current],
                  map,
                  multiPolygonSwitchIsON,
                  MISClickedFeatureInfos,
                  airTableBestandInfos,
                  airTableTooltips,
                  userSpeciesPrices
                );
              }
            } else {
              // If YES, then removed from the selectedFeatures
              setSelectedFeatures([]);
            }
          } else {
            // In Multi mode

            // Check if the clicked polygon was already selected
            if (
              teigBestNrLastSelected &&
              !selectedFeatures.some(
                (feature) =>
                  feature.properties?.teig_best_ === teigBestNrLastSelected
              )
            ) {
              // If NOT the add to selected features for multi selection mode
              setSelectedFeatures([
                ...selectedFeatures,
                selectedVectorFeatureRef.current,
              ]);
              if (!isFetchingAirtableRecords) {
                SkogbrukWMSFeaturesHandler(
                  e,
                  selectedFeatures.concat([selectedVectorFeatureRef.current]),
                  map,
                  multiPolygonSwitchIsON,
                  MISClickedFeatureInfos,
                  airTableBestandInfos,
                  airTableTooltips,
                  userSpeciesPrices
                );
              }
            } else {
              // If YES, then removed from the selectedFeatures

              // Remove the clicked polygon from the selectedFeatures
              const newSelectedFeatures = selectedFeatures.filter(
                (feature) =>
                  feature.properties?.teig_best_ !==
                  selectedVectorFeatureRef.current.properties?.teig_best_
              );
              setSelectedFeatures(newSelectedFeatures);
              if (
                (newSelectedFeatures.length > 0) &
                !isFetchingAirtableRecords
              ) {
                SkogbrukWMSFeaturesHandler(
                  e,
                  newSelectedFeatures,
                  map,
                  multiPolygonSwitchIsON,
                  MISClickedFeatureInfos,
                  airTableBestandInfos,
                  airTableTooltips,
                  userSpeciesPrices
                );
              }
            }
          }
        }
      }
    },
    overlayadd: async (e) => {
      setActiveOverlay((prevOverlay) => ({
        ...prevOverlay,
        [e.name]: true,
      }));
    },
    overlayremove: async (e) => {
      if (activeOverlay['Stands'] || activeOverlay['Skogbruksplan']) {
        map.closePopup();
      }
    },
  });

  return null;
}
