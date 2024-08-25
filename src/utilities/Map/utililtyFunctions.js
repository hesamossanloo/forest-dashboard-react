import * as turf from '@turf/turf';
import { SPECIES } from 'variables/forest';

export const convertAndformatTheStringArealM2ToDAA = (arealM2) => {
  const retArealm2 = parseInt(arealM2) / 1000;
  return formatNumber(retArealm2, 'nb-NO', 2); // Format with the decimal
};

export const isPointInsideTeig = (point, polygon) => {
  const turfPoint = turf.point([point.lng, point.lat]);
  const turfMultiPolygon = turf.multiPolygon(polygon);
  return turf.booleanPointInPolygon(turfPoint, turfMultiPolygon);
};

export const validateAndCloseLayersPolygonCoordinates = (geoJSON) => {
  geoJSON.features.forEach((feature) => {
    if (
      feature.geometry.type === 'Polygon' ||
      feature.geometry.type === 'MultiPolygon'
    ) {
      const coordinates = feature.geometry.coordinates[0];
      if (coordinates[0] !== coordinates[coordinates.length - 1]) {
        console.warn(
          'Polygon is not closed. Closing it automatically. teig_best_:',
          feature.properties.teig_best_
        );
        coordinates.push(coordinates[0]); // Close the polygon by adding the first coordinate to the end
      }
    }
  });

  return geoJSON;
};

export const validateAndCloseOnlyPolygonsCoordinates = (polygons) => {
  // Iterate over each polygon in the coordinates array
  polygons.geometry.coordinates.forEach((coord) => {
    // Iterate over each ring in the polygon
    coord.forEach((ring) => {
      // Check if the first and last coordinates of the ring are the same
      const firstCoord = ring[0];
      const lastCoord = ring[ring.length - 1];

      if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1]) {
        console.warn('Polygon ring is not closed. Closing it automatically.');
        ring.push(firstCoord); // Close the ring by adding the first coordinate to the end
      }
    });
  });

  return polygons;
};

export const isPointInsideFeature = (point, feature) => {
  let isInside = false;
  try {
    const turfPoint = turf.point([point.lng, point.lat]);
    if (feature.geometry.type === 'Polygon') {
      const turfPolygon = turf.polygon(feature.geometry.coordinates);
      isInside = turf.booleanPointInPolygon(turfPoint, turfPolygon);
    } else if (feature.geometry.type === 'MultiPolygon') {
      const turfMultiPolygon = turf.multiPolygon(feature.geometry.coordinates);
      isInside = turf.booleanPointInPolygon(turfPoint, turfMultiPolygon);
    }
    return isInside;
  } catch (error) {
    console.error('Error:', error);
  }
  return isInside;
};

export const calculateBoundingBox = (map) => {
  const CRS = map.options.crs.code;
  const size = map.getSize();
  const bounds = map.getBounds();
  const southWest = map.options.crs.project(bounds.getSouthWest());
  const northEast = map.options.crs.project(bounds.getNorthEast());
  const BBOX = [southWest.x, southWest.y, northEast.x, northEast.y].join(',');
  return { CRS, size, BBOX };
};

export function hideLayerControlLabel(layerName) {
  // Find the label corresponding to the layer
  const layerControl = document.querySelector(
    '.leaflet-control-layers-overlays'
  );
  const labels = Array.from(layerControl.getElementsByTagName('label'));
  const label = labels.find((label) => label.textContent.includes(layerName));

  // Add the display: none rule
  if (label) {
    label.style.display = 'none';
  }
}

export const formatNumber = (value, locale = 'nb-NO', fractionDigits = 2) => {
  const formattedValue = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);

  return formattedValue;
};

export const WFSFeatureLayerNamefromXML = (xml) => {
  // Assuming `data` is your XML string
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, 'text/xml');

  // Find all <gml:name> elements
  const nameElements = xmlDoc.querySelectorAll('name');

  // Initialize an array to hold the layer names for each feature
  const layerNames = [];

  // Iterate over each <gml:name> element
  nameElements.forEach((nameEl) => {
    // Extract the layer name
    const layerName = nameEl.textContent;

    // Optionally, find the parent feature element of this <gml:name>
    // This step depends on the structure of your XML and how you need to associate names with features
    // For demonstration, we're just collecting names
    layerNames.push(layerName);
  });
  // Now, `layerNames` contains all the layer names extracted from the XML
  // You can associate these names with your features accordingly
  return layerNames;
};

export const calculateFeatInfoHKTotals = (
  selectedFeatures,
  airTableFeatInfos,
  userSpeciesPrices
) => {
  const totals = selectedFeatures.reduce(
    (acc, feature) => {
      const props = feature.properties;
      const foundRow =
        airTableFeatInfos.find(
          (row) => row.fields.bestand_id === props.teig_best_
        ) || {};

      const airTableFeatRowFields = foundRow.fields;
      // If user has provided prices, the new price values will override th old ones
      airTableFeatRowFields.avg_price_m3 = calculateAvgPrice(
        airTableFeatRowFields,
        userSpeciesPrices
      );
      acc.totalArealM2 += parseInt(airTableFeatRowFields.arealm2, 10) || 0;
      acc.totalCarbonStored +=
        parseInt(airTableFeatRowFields.carbon_stored, 10) || 0;
      acc.totalCarbonCapturedNextYear +=
        parseInt(airTableFeatRowFields.carbon_captured_next_year, 10) || 0;

      acc.standVolumeMads +=
        parseFloat(airTableFeatRowFields.volume_without_bark) || 0;
      acc.avgSpeciesPriceCalculated +=
        parseFloat(airTableFeatRowFields.avg_price_m3) || 0;
      // from https://trello.com/c/RTkPLbFf/330-let-forester-provide-input-prices-and-logging-costs
      // To calculate gross values: (Forv. Brutto Verdi): volume_at_maturity_without_bark * avg_price;
      acc.totalBruttoVerdi +=
        parseFloat(airTableFeatRowFields.volume_at_maturity_without_bark) *
          parseFloat(airTableFeatRowFields.avg_price_m3) || 0;
      // from https://trello.com/c/RTkPLbFf/330-let-forester-provide-input-prices-and-logging-costs
      // totalNettoVerdi = Forv. Brutto Verdi - volume_at_maturity_without_bark * hogst&utkjøring_cost_per_m3
      if (userSpeciesPrices.hogstUtkPrice) {
        acc.totalNettoVerdi +=
          parseFloat(airTableFeatRowFields.volume_at_maturity_without_bark) *
            (parseFloat(airTableFeatRowFields.avg_price_m3) -
              parseFloat(userSpeciesPrices.hogstUtkPrice)) || 0;
      }

      return acc;
    },
    {
      totalArealM2: 0,
      totalCarbonStored: 0,
      totalCarbonCapturedNextYear: 0,
      standVolumeMads: 0,
      avgSpeciesPriceCalculated: 0,
      totalBruttoVerdi: 0,
      totalNettoVerdi: 0,
    }
  );

  return totals;
};

export const calculateAvgPrice = (
  corresponsingAirtTableFeature,
  userSpeciesPrices
) => {
  if (corresponsingAirtTableFeature && corresponsingAirtTableFeature.treslag) {
    let avgPrice = 0;
    switch (corresponsingAirtTableFeature.treslag) {
      case SPECIES.GRAN:
        // from https://trello.com/c/RTkPLbFf/330-let-forester-provide-input-prices-and-logging-costs
        // avg_price = saw_wood_portion * price_saw_wood + (1 - saw_wood_portion) * price_pulp_wood;
        if (
          userSpeciesPrices.granSagtommerPrice &&
          userSpeciesPrices.granMassevirkePrice
        ) {
          avgPrice =
            parseFloat(corresponsingAirtTableFeature.saw_wood_portion) *
              parseFloat(userSpeciesPrices.granSagtommerPrice) +
            (1 - parseFloat(corresponsingAirtTableFeature.saw_wood_portion)) *
              parseFloat(userSpeciesPrices.granMassevirkePrice);
        }
        break;
      case SPECIES.FURU:
        if (
          userSpeciesPrices.furuSagtommerPrice &&
          userSpeciesPrices.furuMassevirkePrice
        ) {
          avgPrice =
            parseFloat(corresponsingAirtTableFeature.saw_wood_portion) *
              parseFloat(userSpeciesPrices.furuSagtommerPrice) +
            (1 - parseFloat(corresponsingAirtTableFeature.saw_wood_portion)) *
              parseFloat(userSpeciesPrices.furuMassevirkePrice);
        }
        break;
      case SPECIES.LAU:
        if (
          userSpeciesPrices.lauvSagtommerPrice &&
          userSpeciesPrices.lauvMassevirkePrice
        ) {
          avgPrice =
            parseFloat(corresponsingAirtTableFeature.saw_wood_portion) *
              parseFloat(userSpeciesPrices.lauvSagtommerPrice) +
            (1 - parseFloat(corresponsingAirtTableFeature.saw_wood_portion)) *
              parseFloat(userSpeciesPrices.lauvMassevirkePrice);
        }
        break;
      default:
        avgPrice = 0;
        break;
    }
    return avgPrice;
  } else {
    return 0;
  }
};
