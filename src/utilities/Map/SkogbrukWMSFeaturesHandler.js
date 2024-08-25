import {
  createMISButton,
  generateHKPopupContent,
  openHKPopupWithContent,
} from './popupContentUtilities';
import {
  calculateFeatInfoHKTotals,
  convertAndformatTheStringArealM2ToDAA,
  formatNumber,
} from './utililtyFunctions';

export const SkogbrukWMSFeaturesHandler = (
  e,
  selectedFeatures,
  map,
  multi,
  MISFeature,
  airTableBestandFeatInfos,
  airTableTooltips,
  userSpeciesPrices
) => {
  const sumObj = {
    title: 'Bestand',
    isMIS: MISFeature && MISFeature.length > 0,
  };
  if (sumObj.isMIS) sumObj.title = 'MIS Bestand';

  const totals = calculateFeatInfoHKTotals(
    selectedFeatures,
    airTableBestandFeatInfos,
    userSpeciesPrices
  );
  sumObj.carbon_stored = formatNumber(
    totals.totalCarbonStored / 1000,
    'nb-NO',
    2
  );
  sumObj.carbon_captured_next_year = formatNumber(
    totals.totalCarbonCapturedNextYear / 1000,
    'nb-NO',
    2
  );
  sumObj.arealDAA = convertAndformatTheStringArealM2ToDAA(totals.totalArealM2);
  sumObj.standVolumeMads = totals.standVolumeMads;
  sumObj.avgSpeciesPriceCalculated = totals.avgSpeciesPriceCalculated;
  sumObj.totalBruttoVerdi = totals.totalBruttoVerdi;
  sumObj.totalNettoVerdi = totals.totalNettoVerdi;

  const content = generateHKPopupContent(
    sumObj,
    selectedFeatures,
    multi,
    airTableBestandFeatInfos,
    airTableTooltips,
    userSpeciesPrices
  );

  let popupContentDiv = document.createElement('div');
  popupContentDiv.className = 'mis-popup-content';
  popupContentDiv.innerHTML = content;
  if (sumObj.isMIS) {
    popupContentDiv = createMISButton(popupContentDiv, MISFeature, e, map);
  }

  openHKPopupWithContent(popupContentDiv, e, map);
};

export default SkogbrukWMSFeaturesHandler;
