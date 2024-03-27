import L from 'leaflet';
import { WMSGetFeatureInfo } from 'ol/format';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import {
  CSV_URLS,
  HIDE_POLYGON_ZOOM_LEVEL,
  nibioGetFeatInfoBaseParams,
} from 'variables/forest';
import useCsvData from './useCSVData';
import {
  calculateAdditionalRows,
  calculateBoundingBox,
  formatNumber,
  formatTheStringArealM2,
  isPointInsidePolygon,
} from './utililtyFunctions';

CustomMapEvents.propTypes = {
  activeOverlay: PropTypes.shape({
    Hogstklasser: PropTypes.bool,
  }).isRequired,
  setActiveOverlay: PropTypes.func.isRequired,
  setClickedOnLine: PropTypes.func.isRequired,
  setZoomLevel: PropTypes.func.isRequired,
  zoomLevel: PropTypes.number.isRequired,
  clickedOnLine: PropTypes.bool.isRequired,
  multiPolygonSelect: PropTypes.bool.isRequired,
  madsTeig: PropTypes.object.isRequired,
  bjoernTeig: PropTypes.object.isRequired,
  knutTeig: PropTypes.object.isRequired,
  akselTeig: PropTypes.object.isRequired,
  selectedForest: PropTypes.object.isRequired,
};

export default function CustomMapEvents(props) {
  const {
    activeOverlay,
    setActiveOverlay,
    setClickedOnLine,
    setZoomLevel,
    zoomLevel,
    clickedOnLine,
    madsTeig,
    bjoernTeig,
    knutTeig,
    akselTeig,
    multiPolygonSelect,
    selectedForest,
  } = props;
  const map = useMap();
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  const granCSVData = useCsvData(CSV_URLS.GRAN).data;
  const furuCSVData = useCsvData(CSV_URLS.FURU).data;

  const desiredAttributes = {
    teig_best_nr: 'Bestand nr',
    hogstkl_verdi: 'Hogstklasse',
    bonitet_beskrivelse: 'Bonitet',
    bontre_beskrivelse: 'Treslag',
    alder: 'Alder',
    arealm2: 'Areal (daa)',
  };

  useEffect(() => {
    // This will reset the selected features when multiPolygonSelect changes
    setSelectedFeatures([...selectedFeatures]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiPolygonSelect]); // Dependency array includes multiPolygonSelect

  const handleSkogbrukWMSFeatures = (e, features, map, multi) => {
    const sumObj = {};
    const activeOverlayNames = Object.keys(activeOverlay).filter(
      (key) => activeOverlay[key] === true
    );
    sumObj.title = activeOverlayNames[0];

    if (multi) {
      // Multi polygon selection switch is selected
      const joinedTeigBestNr = features
        .map((feature) => feature[0].values_.teig_best_nr)
        .join(', ');
      const joinedHogstklVerdi = features
        .map((feature) => feature[0].values_.hogstkl_verdi)
        .join(', ');
      const joinedBonitetBeskrivelse = features
        .map((feature) =>
          feature[0].values_.bonitet_beskrivelse.substring(
            feature[0].values_.bonitet_beskrivelse.indexOf(' ') + 1
          )
        )
        .join(', ');
      const joinedBontreBeskrivelse = features
        .map((feature) => feature[0].values_.bontre_beskrivelse)
        .join(', ');
      const joinedAlder = features
        .map((feature) => feature[0].values_.alder)
        .join(', ');
      const totalArealM2 = features
        .map((feature) => parseInt(feature[0].values_.arealm2))
        .reduce((total, area) => total + area, 0);

      sumObj.teig_best_nr = joinedTeigBestNr;
      sumObj.hogstkl_verdi = joinedHogstklVerdi;
      sumObj.bonitet_beskrivelse = joinedBonitetBeskrivelse;
      sumObj.bontre_beskrivelse = joinedBontreBeskrivelse;
      sumObj.alder = joinedAlder;
      sumObj.arealm2 = formatTheStringArealM2(totalArealM2);
    } else {
      // Single polygon selection switch is selected

      if (features.length > 0 && features[0] && !clickedOnLine) {
        const feature = features[0];
        const values = feature[0].values_;
        sumObj.teig_best_nr = values.teig_best_nr;

        // Get Hogstklasse
        sumObj.hogstkl_verdi = values.hogstkl_verdi;

        // Get the Bonitet
        sumObj.bonitet_beskrivelse = values.bonitet_beskrivelse.substring(
          values.bonitet_beskrivelse.indexOf(' ') + 1
        ); // Remove the first part and keep only the number

        // Get the Treslag
        sumObj.bontre_beskrivelse = values.bontre_beskrivelse;

        // Calculate arealm2
        sumObj.arealm2 = formatTheStringArealM2(values.arealm2);

        // Get the Alder
        sumObj.alder = values.alder;

        // Add the additional row if hogstkl_verdi is 4 or 5
        if (values.hogstkl_verdi === '4' || values.hogstkl_verdi === '5') {
          const {
            estimatedStandVolumeM3HAAString,
            estimatedStandVolume,
            speciesPrice,
            totalVolume,
          } = calculateAdditionalRows(granCSVData, furuCSVData, values);

          // The tree density volume per stand
          sumObj.estimatedStandVolumeM3HAAString =
            estimatedStandVolumeM3HAAString;
          // The estimatedStandVolume per decare (daa)
          sumObj.estimatedStandVolume = estimatedStandVolume;
          // The price of the timber for a species
          sumObj.speciesPrice = speciesPrice;
          // The total volume
          sumObj.totalVolume = totalVolume;
        }
      }
    }
    let content =
      // Add the layer name as the title with black color and centered alignment
      `<h3 style="color: black; text-align: center;">${sumObj.title}</h3>` +
      // Add margin-bottom and border styles
      '<table style="margin-bottom: 10px; border-collapse: collapse; border: 1px solid black;">' +
      // Add the ID row
      `<tr style="border: 1px solid black;"><td style="padding: 5px; border: 1px solid black;">ID</td><td style="padding: 5px; border: 1px solid black; font-weight: bold">${sumObj.teig_best_nr}</td></tr>` +
      // Add Hogstklasse
      `<tr style="border: 1px solid black;"><td style="padding: 5px; border: 1px solid black;">${desiredAttributes['hogstkl_verdi']}</td><td style="padding: 5px; border: 1px solid black; font-weight: bold">${sumObj.hogstkl_verdi}</td></tr>` +
      // Add Bonitet
      `<tr style="border: 1px solid black;"><td style="padding: 5px; border: 1px solid black;">${desiredAttributes['bonitet_beskrivelse']}</td><td style="padding: 5px; border: 1px solid black; font-weight: bold">${sumObj.bonitet_beskrivelse}</td></tr>` +
      // Add the Treslag
      `<tr style="border: 1px solid black;"><td style="padding: 5px; border: 1px solid black;">${desiredAttributes['bontre_beskrivelse']}</td><td style="padding: 5px; border: 1px solid black; font-weight: bold">${sumObj.bontre_beskrivelse}</td></tr>` +
      // Add the ArealM2
      `<tr style="border: 1px solid black;"><td style="padding: 5px; border: 1px solid black;">${desiredAttributes['arealm2']}</td><td style="padding: 5px; border: 1px solid black; font-weight: bold">${sumObj.arealm2}</td></tr>` +
      // Add the Alder
      `<tr style="border: 1px solid black;"><td style="padding: 5px; border: 1px solid black;">${desiredAttributes['alder']}</td><td style="padding: 5px; border: 1px solid black; font-weight: bold">${sumObj.alder}</td></tr>`;
    if (sumObj.estimatedStandVolumeM3HAAString) {
      // Showing the tree density volume per stand
      content += `<tr style="border: 1px solid black;"><td style="padding: 5px; border: 1px solid black;">Tømmervolum</td><td style="padding: 5px; border: 1px solid black;"><span style="font-weight: bold">${formatNumber(sumObj.estimatedStandVolumeM3HAAString, 'nb-NO', 1)}</span> m^3</td></tr>`;
      // Calculating the estimatedStandVolume per decare (daa)
      content += `<tr style="border: 1px solid black;"><td style="padding: 5px; border: 1px solid black;">Tømmertetthet</td><td style="padding: 5px; border: 1px solid black;"><span style="font-weight: bold">${formatNumber(sumObj.estimatedStandVolume / 10, 'nb-NO', 1)}</span> m^3/daa</td></tr>`;
      // The price of the timber for a species
      content += `<tr style="border: 1px solid black;"><td style="padding: 5px; border: 1px solid black;">Forv. gj.sn pris per m^3</td><td style="padding: 5px; border: 1px solid black;"><span style="font-weight: bold">${formatNumber(sumObj.speciesPrice, 'nb-NO', 0)}</span> kr</td></tr>`;
      // We rae showing the total volume
      content += `<tr style="border: 1px solid black;"><td style="padding: 5px; border: 1px solid black;">Forv. brutto verdi</td><td style="padding: 5px; border: 1px solid black;"><span style="font-weight: bold">${formatNumber(sumObj.totalVolume, 'nb-NO', 0)}</span> kr</td></tr>`;
    }
    content += '</table>';
    L.popup({ interactive: true })
      .setLatLng(e.latlng)
      .setContent(content)
      .openOn(map);
  };

  useMapEvents({
    zoom: async (e) => {
      let flag = false;
      setZoomLevel(map.getZoom());
      if (map.getZoom() > HIDE_POLYGON_ZOOM_LEVEL) {
        flag = true;
      }
      setActiveOverlay((prevOverlay) => ({
        ...prevOverlay,
        Hogstklasser: flag,
      }));
    },
    click: async (e) => {
      // Handle Clicks on Mads Forest
      setClickedOnLine(madsTeig.features[0].properties.DN === 99);
      if (!clickedOnLine && activeOverlay['Hogstklasser']) {
        // The WMS expects the Query params to follow certain patterns. After
        // analysing how QGIS made the WMS call, reverse enginnered the call
        // and here we are building one of those params, i.e. BBOX, size.x, size.y and the CRS
        const { CRS, size, BBOX } = calculateBoundingBox(map);

        // By default we are closing all the popups, in case there are any opens
        //  an then we will show the pop up after the new call to the WMS and once
        // the data are fetched.
        map.closePopup();

        // Check if the click is within the coordinates of a GeoJSON
        // In this case I am passing in the Mad's forest Teig Polygon
        const forests = [madsTeig, bjoernTeig, knutTeig, akselTeig];
        const forestName = selectedForest.name;
        const clickedForest = forests.find(
          (forest) => forest.name === forestName
        );
        if (
          clickedForest &&
          isPointInsidePolygon(
            e.latlng,
            clickedForest.features[0].geometry.coordinates
          )
        ) {
          const params = {
            ...nibioGetFeatInfoBaseParams,
            BBOX,
            CRS,
            WIDTH: size.x,
            HEIGHT: size.y,
            I: Math.round(e.containerPoint.x),
            J: Math.round(e.containerPoint.y),
          };
          const url = `https://wms.nibio.no/cgi-bin/skogbruksplan?${new URLSearchParams(params).toString()}`;
          const response = await fetch(url);
          const data = await response.text();
          const format = new WMSGetFeatureInfo();
          const newFeatures = format.readFeatures(data);

          // In case the selected feature is already in the array,
          // which means the user has clicked on it before, we don't
          // need to add it to the array. That's why we check if the teigBestNr
          // already exists or not!
          const teigBestNrLastSelected = newFeatures[0]?.values_?.teig_best_nr;

          // Reset selected features if not in multiPolygonSelect mode
          if (!multiPolygonSelect) {
            setSelectedFeatures([newFeatures]); // Only the last selected feature is kept
            handleSkogbrukWMSFeatures(e, [newFeatures], map, false);
          } else {
            if (
              teigBestNrLastSelected &&
              !selectedFeatures.some(
                (feature) =>
                  feature[0].values_?.teig_best_nr === teigBestNrLastSelected
              )
            ) {
              setSelectedFeatures([...selectedFeatures, newFeatures]);
              // Add to selected features for multi selection mode
              setSelectedFeatures([...selectedFeatures, newFeatures]);
              handleSkogbrukWMSFeatures(
                e,
                selectedFeatures.concat([newFeatures]),
                map,
                true
              );
            } else {
              handleSkogbrukWMSFeatures(e, selectedFeatures, map, true);
            }
          }
          // if (multiPolygonSelect) {
          //   handleSkogbrukWMSFeatures(e, selectedFeatures, map, true);
          // } else {
          //   // In case the selected feature is already in the array,
          //   // which means the user has clicked on it before, then we need to find it and
          //   // show that feature only
          //   const selectedFeatureTMP = selectedFeatures.find(
          //     (feature) =>
          //       feature[0].values_.teig_best_nr === teigBestNrLastSelected
          //   );
          //   if (selectedFeatureTMP) {
          //     setSelectedFeatures([selectedFeatureTMP]);
          //     handleSkogbrukWMSFeatures(e, selectedFeatureTMP, map, false);
          //   } else {
          //     setSelectedFeatures([newFeatures]);
          //     handleSkogbrukWMSFeatures(e, newFeatures, map, false);
          //   }
          // }
        }
      }
    },
    overlayadd: async (e) => {
      if (activeOverlay['Hogstklasser']) {
        // Wait for the next render cycle to ensure the layer control has been updated

        setActiveOverlay((prevOverlay) => ({
          ...prevOverlay,
          Hogstklasser: true,
        }));
      }
      setActiveOverlay((prevOverlay) => ({
        ...prevOverlay,
        [e.name]: true,
      }));
    },
    overlayremove: async (e) => {
      if (activeOverlay['Hogstklasser']) {
        map.closePopup();
      }
      if (activeOverlay['Hogstklasser'] && e.name === 'Hogstklasser') {
        // Wait for the next render cycle to ensure the layer control has been updated
        !(zoomLevel <= HIDE_POLYGON_ZOOM_LEVEL) &&
          setActiveOverlay((prevOverlay) => ({
            ...prevOverlay,
            Hogstklasser: false,
          }));
      }
      !(zoomLevel <= HIDE_POLYGON_ZOOM_LEVEL) &&
        setActiveOverlay((prevOverlay) => ({
          ...prevOverlay,
          [e.name]: false,
        }));
    },
  });

  return null;
}
