import akselPolygons from 'assets/data/QGIS/aksel/aksel-polygons.js';
import akselPolygonsPNG from 'assets/data/QGIS/aksel/aksel-polygons.png';
import akselTeig from 'assets/data/QGIS/aksel/aksel-teig.js';
import bjoernPolygons from 'assets/data/QGIS/bjoern/bjoern-polygons.js';
import bjoernPolygonsPNG from 'assets/data/QGIS/bjoern/bjoern-polygons.png';
import bjoernTeig from 'assets/data/QGIS/bjoern/bjoern-teig.js';
import knutPolygons from 'assets/data/QGIS/knut/knut-polygons.js';
import knutPolygonsPNG from 'assets/data/QGIS/knut/knut-polygons.png';
import knutTeig from 'assets/data/QGIS/knut/knut-teig.js';
import madsPolygons from 'assets/data/QGIS/mads/mads-polygons.js';
import madsPolygonsPNG from 'assets/data/QGIS/mads/mads-polygons.png';
import madsTeig from 'assets/data/QGIS/mads/mads-teig.js';
import ToggleSwitch from 'components/ToggleSwitch/ToggleSwitch.js';
import { MapFilterContext } from 'contexts/MapFilterContext.js';
import L from 'leaflet';
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
  useMap,
} from 'react-leaflet';
import { Button } from 'reactstrap';
import ForestSelector from 'utilities/Map/components/ForestSelector';
import CustomMapEvents from 'utilities/Map/CustomMapEvents';
import {
  akselPolygonsPNGBounds,
  bjoernPolygonsPNGBounds,
  knutPolygonsPNGBounds,
  madsPolygonsPNGBounds,
  mapCoordinations,
} from 'variables/forest';
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

/* eslint-disable react/react-in-jsx-scope */
function Map() {
  const [activeOverlay, setActiveOverlay] = useState({
    Teig: true,
    MIS: true,
    Stands: true,
    Skogbruksplan: false,
  });

  const forest1 = mapCoordinations.madsForestPosition;
  const forest2 = mapCoordinations.bjoernForestPosition;
  const forest3 = mapCoordinations.knutForestPosition;
  const forest4 = mapCoordinations.akselForestPosition;

  const [mapFilter, setMapFilter] = useContext(MapFilterContext);

  const [selectedVectorFeature, setSelectedVectorFeature] = useState(null);
  const selectedVectorFeatureRef = useRef(selectedVectorFeature);
  const [selectedForest, setSelectedForest] = useState(forest1); // Default to forest 1
  const [selectedForestFirstTime, setSelectedForestFirstTime] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [multiPolygonSelect, setMultiPolygonSelect] = useState(false);
  const [deselectPolygons, setDeselectPolygons] = useState(false);
  const multiPolygonSelectRef = useRef(multiPolygonSelect);
  const previousGeoJSONLayersRef = useRef([]);
  const madsPolygonsRef = useRef(null);

  // Handles the Map Filter states and the border colors
  useEffect(() => {
    // I want to get a specific geojson layer and update the styles of each feature
    const geoJsonLayer = madsPolygonsRef.current;
    // Iterate over each feature layer in the GeoJSON layer
    geoJsonLayer &&
      geoJsonLayer.eachLayer((layer) => {
        // Get the feature associated with the layer
        const feature = layer.feature;

        // Determine the style based on the feature properties
        if (feature.properties.hogstkl_verdi === '5') {
          if (mapFilter.HK5) {
            layer.setStyle({
              color: 'red', // Color for the border
              weight: 6, // Increase border width to make it visible
            });
          } else {
            layer.setStyle({
              color: 'blue',
              weight: 1,
            });
          }
        }
        if (feature.properties.hogstkl_verdi === '4') {
          if (mapFilter.HK4) {
            layer.setStyle({
              color: 'green', // Color for the border
              weight: 6, // Increase border width to make it visible
            });
          } else {
            layer.setStyle({
              color: 'blue',
              weight: 1,
            });
          }
        }
      });
  }, [mapFilter]);

  useEffect(() => {
    selectedVectorFeatureRef.current = selectedVectorFeature;
  }, [selectedVectorFeature]);

  // Update the ref every time multiPolygonSelect changes
  useEffect(() => {
    multiPolygonSelectRef.current = multiPolygonSelect;
  }, [multiPolygonSelect]);

  // Toggle DropDown
  const toggleDD = () => setDropdownOpen((prevState) => !prevState);

  const onEachFeature = (feature, geoJSONLayer) => {
    geoJSONLayer.setStyle({
      fillColor: 'transparent',
      fillOpacity: 0,
      color: 'blue', // Make borders transparent initially
      weight: 1,
    }); // Set default transparent style for the GeoJSON layer

    geoJSONLayer.on({
      click: () => {
        if (feature && feature.properties && feature.properties.teig_best_nr) {
          selectedVectorFeatureRef.current = feature;
          setSelectedVectorFeature(feature);
        }
        // If multiPolygonSelectRef.current is false, unhighlight the previous layer
        if (!multiPolygonSelectRef.current) {
          if (previousGeoJSONLayersRef.current.includes(geoJSONLayer)) {
            previousGeoJSONLayersRef.current.forEach((layer) => {
              layer.setStyle({
                color: 'blue', // Make borders transparent initially
                weight: 1,
              });
            });
            previousGeoJSONLayersRef.current = [];
          } else {
            previousGeoJSONLayersRef.current.forEach((layer) => {
              layer.setStyle({
                color: 'blue', // Make borders transparent initially
                weight: 1,
              });
            });
            previousGeoJSONLayersRef.current = []; // Reset the list of previous layers
            // Highlight the clicked layer
            setTimeout(() => {
              geoJSONLayer.setStyle({
                color: 'yellow', // Color for the border
                weight: 6, // Increase border width to make it visible
              });
            }, 0);
            previousGeoJSONLayersRef.current = [geoJSONLayer];
          }
        } else {
          // If multiPolygonSelectRef.current is true, just highlight the clicked layer

          // if the current clicked layer is already in the list of previous layers,
          // then remove it from the previous one and turn it blue

          if (previousGeoJSONLayersRef.current.includes(geoJSONLayer)) {
            geoJSONLayer.setStyle({
              color: 'blue', // Make borders transparent initially
              weight: 1,
            });
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
      },
    });
  };

  // eslint-disable-next-line react/prop-types
  const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    selectedForestFirstTime && map.setView(center, zoom);
    // To solve the issue with the always centering the map after choosing a forest
    useEffect(() => {
      setSelectedForestFirstTime(false);
    }, []);
    return null;
  };

  const handleForestSelectChange = (event) => {
    const selected = event;
    if (!selectedForestFirstTime) {
      setSelectedForestFirstTime(true);
      setSelectedForest(
        selected === 'forest1'
          ? forest1
          : selected === 'forest2'
            ? forest2
            : selected === 'forest3'
              ? forest3
              : forest4
      );
    }
  };
  const toggleSelectMultiPolygons = () => {
    setMultiPolygonSelect((prevState) => !prevState);
  };
  const resetHighlightedFeatures = () => {
    setMapFilter({
      HK4: false,
      HK5: false,
      Protected: false,
    });
    previousGeoJSONLayersRef.current.forEach((layer) => {
      layer.setStyle({
        fillColor: 'transparent',
        fillOpacity: 0,
        color: 'transparent', // Reset borders to transparent
        weight: 1,
      });
    });
    // Clear the array after resetting styles
    setDeselectPolygons(true);
  };
  return (
    <>
      <ForestSelector
        isOpen={dropdownOpen}
        toggle={toggleDD}
        onSelectForest={handleForestSelectChange}
      />
      <ToggleSwitch
        id="multiPolygon"
        disabled={!activeOverlay['Stands'] && !activeOverlay['Skogbruksplan']}
        style={{
          position: 'absolute',
          top: 125,
          right: 10,
          zIndex: 9999,
        }}
        checked={multiPolygonSelect}
        optionLabels={['Multi Select', 'Single Select']}
        onChange={toggleSelectMultiPolygons}
      />
      <Button
        color="warning"
        style={{
          zIndex: '10',
          position: 'fixed',
          right: '10px',
          top: '160px',
          width: '115px',
          padding: '10px 0 10px 0',
        }}
        onClick={resetHighlightedFeatures} // Update this line
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
        center={selectedForest.coord}
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
        <ChangeView
          center={selectedForest.coord}
          zoom={selectedForest.name === 'forest3' ? 12 : 13}
        />
        <CustomMapEvents
          activeOverlay={activeOverlay}
          setActiveOverlay={setActiveOverlay}
          multiPolygonSelect={multiPolygonSelect}
          deselectPolygons={deselectPolygons}
          madsTeig={madsTeig}
          bjoernTeig={bjoernTeig}
          knutTeig={knutTeig}
          akselTeig={akselTeig}
          selectedVectorFeatureRef={selectedVectorFeatureRef}
          selectedForest={selectedForest}
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
              {selectedForest.name === 'forest1' && (
                <ImageOverlay
                  url={madsPolygonsPNG}
                  bounds={madsPolygonsPNGBounds}
                  opacity={0.5}
                />
              )}
              {selectedForest.name === 'forest2' && (
                <ImageOverlay
                  url={bjoernPolygonsPNG}
                  bounds={bjoernPolygonsPNGBounds}
                  opacity={0.5}
                />
              )}
              {selectedForest.name === 'forest3' && (
                <ImageOverlay
                  url={knutPolygonsPNG}
                  bounds={knutPolygonsPNGBounds}
                  opacity={0.5}
                />
              )}
              {selectedForest.name === 'forest4' && (
                <ImageOverlay
                  url={akselPolygonsPNG}
                  bounds={akselPolygonsPNGBounds}
                  opacity={0.5}
                />
              )}
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
              {madsTeig && selectedForest.name === 'forest1' && (
                <GeoJSON
                  data={madsTeig}
                  style={() => ({
                    color: 'blue', // color of the lines
                    fillColor: 'transparent', // fill color
                  })}
                />
              )}
              {bjoernTeig && selectedForest.name === 'forest2' && (
                <GeoJSON
                  data={bjoernTeig}
                  style={() => ({
                    color: 'blue', // color of the lines
                    fillColor: 'transparent', // fill color
                  })}
                />
              )}
              {knutTeig && selectedForest.name === 'forest3' && (
                <GeoJSON
                  data={knutTeig}
                  style={() => ({
                    color: 'blue', // color of the lines
                    fillColor: 'transparent', // fill color
                  })}
                />
              )}
              {akselTeig && selectedForest.name === 'forest4' && (
                <GeoJSON
                  data={akselTeig}
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
              {madsPolygons && selectedForest.name === 'forest1' && (
                <GeoJSON
                  ref={madsPolygonsRef}
                  onEachFeature={onEachFeature}
                  data={madsPolygons}
                />
              )}
              {bjoernPolygons && selectedForest.name === 'forest2' && (
                <GeoJSON
                  data={bjoernPolygons}
                  onEachFeature={onEachFeature}
                  style={{ stroke: false }}
                />
              )}
              {knutPolygons && selectedForest.name === 'forest3' && (
                <GeoJSON
                  data={knutPolygons}
                  onEachFeature={onEachFeature}
                  style={{ stroke: false }}
                />
              )}
              {akselPolygons && selectedForest.name === 'forest4' && (
                <GeoJSON
                  data={akselPolygons}
                  onEachFeature={onEachFeature}
                  style={{ stroke: false }}
                />
              )}
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
  );
}

export default Map;
