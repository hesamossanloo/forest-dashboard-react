import L from 'leaflet';
import {
  desiredFeatInfoAttrHKLayer,
  desiredFeatInfoAttrHKLayerWithUnits,
  unwantedMISFeatureKeys,
} from 'variables/forest';
import {
  calculateAvgPrice,
  convertAndformatTheStringArealM2ToDAA,
  formatNumber,
} from './utililtyFunctions';

const getHKBGColor = (hk) => {
  let BGColor;
  switch (hk) {
    case 2:
      BGColor = '#f2b370';
      break;
    case 3:
      BGColor = '#aebb7a';
      break;
    case 4:
      BGColor = '#bc8963';
      break;
    case 5:
      BGColor = '#de6867';
      break;
    default:
      BGColor = '#ffffff';
      break;
  }
  return BGColor;
};

export const generateHKPopupContent = (
  sumObj,
  selectedFeatures,
  multiSwitchOn,
  airTableBestandFeatInfos,
  airTableTooltips,
  userSpeciesPrices
) => {
  // Add tooltip listeners after the popup is added to the DOM

  const bestand_idTT = airTableTooltips.find(
    (tooltip) => tooltip.fields.Technical_key === 'bestand_id'
  );
  const hogstkl_verdiTT = airTableTooltips.find(
    (tooltip) => tooltip.fields.Technical_key === 'hogstkl_verdi'
  );
  const bonitetTT = airTableTooltips.find(
    (tooltip) => tooltip.fields.Technical_key === 'bonitet'
  );
  const trelagTT = airTableTooltips.find(
    (tooltip) => tooltip.fields.Technical_key === 'trelag'
  );
  const alderTT = airTableTooltips.find(
    (tooltip) => tooltip.fields.Technical_key === 'alder'
  );
  const arealTT = airTableTooltips.find(
    (tooltip) => tooltip.fields.Technical_key === 'areal'
  );
  const carbon_storedTT = airTableTooltips.find(
    (tooltip) => tooltip.fields.Technical_key === 'carbon_stored'
  );
  const carbon_captured_next_yearTT = airTableTooltips.find(
    (tooltip) => tooltip.fields.Technical_key === 'carbon_captured_next_year'
  );
  const volume_per_hectare_without_barkTT = airTableTooltips.find(
    (tooltip) =>
      tooltip.fields.Technical_key === 'volume_per_hectare_without_bark'
  );
  const volume_without_barkTT = airTableTooltips.find(
    (tooltip) => tooltip.fields.Technical_key === 'volume_without_bark'
  );
  const volume_growth_factorTT = airTableTooltips.find(
    (tooltip) => tooltip.fields.Technical_key === 'volume_growth_factor'
  );
  const years_to_maturityTT = airTableTooltips.find(
    (tooltip) => tooltip.fields.Technical_key === 'years_to_maturity'
  );
  const avg_price_m3TT = airTableTooltips.find(
    (tooltip) => tooltip.fields.Technical_key === 'avg_price_m3'
  );
  const bruttoTT = airTableTooltips.find(
    (tooltip) => tooltip.fields.Technical_key === 'brutto'
  );
  const nettoTT = airTableTooltips.find(
    (tooltip) => tooltip.fields.Technical_key === 'netto'
  );
  let content =
    `<h3 style="color: black; text-align: center;">${sumObj.title}</h3>` +
    '<table style="margin-bottom: 10px; border-collapse: collapse; border: 1px solid black;">';

  if (multiSwitchOn) {
    // Add the tooltips row
    content += `<tr>
      <td style="padding: 5px; border: 1px solid black; text-align: center;">
        <span style="padding: 5px; background-color: transparent; text-align: center;">
          <span class="info-icon" data-tooltip="${bestand_idTT?.fields && bestand_idTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
            i
          </span>
        </span>
      </td>
     <td style="padding: 5px; border: 1px solid black; text-align: center;">
        <span style="padding: 5px; background-color: transparent; text-align: center;">
          <span class="info-icon" data-tooltip="${hogstkl_verdiTT?.fields && hogstkl_verdiTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
            i
          </span>
        </span>
      </td>
      <td style="padding: 5px; border: 1px solid black; text-align: center;">
        <span style="padding: 5px; background-color: transparent; text-align: center;">
          <span class="info-icon" data-tooltip="${bonitetTT?.fields && bonitetTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
            i
          </span>
        </span>
      </td>
      <td style="padding: 5px; border: 1px solid black; text-align: center;">
        <span style="padding: 5px; background-color: transparent; text-align: center;">
          <span class="info-icon" data-tooltip="${trelagTT?.fields && trelagTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
            i
          </span>
        </span>
      </td>
      <td style="padding: 5px; border: 1px solid black; text-align: center;">
        <span style="padding: 5px; background-color: transparent; text-align: center;">
          <span class="info-icon" data-tooltip="${alderTT?.fields && alderTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
            i
          </span>
        </span>
      </td>
      <td style="padding: 5px; border: 1px solid black; text-align: center;">
        <span style="padding: 5px; background-color: transparent; text-align: center;">
          <span class="info-icon" data-tooltip="${arealTT?.fields && arealTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
            i
          </span>
        </span>
      </td>
      <td style="padding: 5px; border: 1px solid black; text-align: center;">
        <span style="padding: 5px; background-color: transparent; text-align: center;">
          <span class="info-icon" data-tooltip="${carbon_storedTT?.fields && carbon_storedTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
            i
          </span>
        </span>
      </td>
      <td style="padding: 5px; border: 1px solid black; text-align: center;">
        <span style="padding: 5px; background-color: transparent; text-align: center;">
          <span class="info-icon" data-tooltip="${carbon_captured_next_yearTT?.fields && carbon_captured_next_yearTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
            i
          </span>
        </span>
      </td>
      <td style="padding: 5px; border: 1px solid black; text-align: center;">
        <span style="padding: 5px; background-color: transparent; text-align: center;">
          <span class="info-icon" data-tooltip="${volume_per_hectare_without_barkTT?.fields && volume_per_hectare_without_barkTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
            i
          </span>
        </span>
      </td>
      <td style="padding: 5px; border: 1px solid black; text-align: center;">
        <span style="padding: 5px; background-color: transparent; text-align: center;">
          <span class="info-icon" data-tooltip="${volume_without_barkTT?.fields && volume_without_barkTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
            i
          </span>
        </span>
      </td>
      <td style="padding: 5px; border: 1px solid black; text-align: center;">
        <span style="padding: 5px; background-color: transparent; text-align: center;">
          <span class="info-icon" data-tooltip="${volume_growth_factorTT?.fields && volume_growth_factorTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
            i
          </span>
        </span>
      </td>
      <td style="padding: 5px; border: 1px solid black; text-align: center;">
        <span style="padding: 5px; background-color: transparent; text-align: center;">
          <span class="info-icon" data-tooltip="${avg_price_m3TT?.fields && avg_price_m3TT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
            i
          </span>
        </span>
      </td>
      <td style="padding: 5px; border: 1px solid black; text-align: center;">
        <span style="padding: 5px; background-color: transparent; text-align: center;">
          <span class="info-icon" data-tooltip="${bruttoTT?.fields && bruttoTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
            i
          </span>
        </span>
      </td>
      ${
        userSpeciesPrices.hogstUtkPrice
          ? `<td style="padding: 5px; border: 1px solid black; text-align: center;">
              <span style="padding: 5px; background-color: transparent; text-align: center;">
                <span class="info-icon" data-tooltip="${nettoTT?.fields && nettoTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
                  i
                </span>
              </span>
            </td>`
          : ''
      }
      <td style="padding: 5px; border: 1px solid black; text-align: center;">
        <span style="padding: 5px; background-color: transparent; text-align: center;">
          <span class="info-icon" data-tooltip="${years_to_maturityTT?.fields && years_to_maturityTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
            i
          </span>
        </span>
      </td>
    </tr>`;
    content += '<tr>';
    Object.values(desiredFeatInfoAttrHKLayerWithUnits).forEach((attr) => {
      if (attr === 'Areal') {
        content += `<th style="padding: 5px; border: 1px solid black;">${attr} (daa)</th>`;
        return;
      }
      if (attr === 'Areal (daa)') {
        return;
      }
      content += `<th style="padding: 5px; border: 1px solid black;">${attr}</th>`;
    });
    content += `
      <th style="padding: 5px; border: 1px solid black;">Tømmertetthet (m^3/daa)</th>
      <th style="padding: 5px; border: 1px solid black;">Tømmervolum (m^3)</th>
      <th style="padding: 5px; border: 1px solid black;">Årlig vekst (%)</th>
      <th style="padding: 5px; border: 1px solid black; min-width: 150px;">Forv. gj.sn pris per m^3 (kr)</th>
      <th style="padding: 5px; border: 1px solid black;">Forv. brutto verdi (kr)</th>
      ${
        userSpeciesPrices.hogstUtkPrice
          ? `<th style="padding: 5px; border: 1px solid black;">Forv. netto verdi (kr)</th>`
          : ''
      }
      <th style="padding: 5px; border: 1px solid black;">År til hogstmoden alder</th>
    </tr>`;

    selectedFeatures.forEach((feature) => {
      const corresponsingAirtTableFeature = airTableBestandFeatInfos.find(
        (featureData) =>
          featureData.fields.bestand_id === feature.properties.teig_best_
      ).fields;
      const rowBGColor = getHKBGColor(
        corresponsingAirtTableFeature.hogstkl_verdi
      );
      corresponsingAirtTableFeature.avg_price_m3 = calculateAvgPrice(
        corresponsingAirtTableFeature,
        userSpeciesPrices
      );
      content += `<tr style="background-color: ${rowBGColor}">`;
      content += `<td style="padding: 5px; border: 1px solid black;">${corresponsingAirtTableFeature.bestand_id}</td>`;
      content += `<td style="padding: 5px; border: 1px solid black;">${corresponsingAirtTableFeature.hogstkl_verdi}</td>`;
      content += `<td style="padding: 5px; border: 1px solid black;">${corresponsingAirtTableFeature.bonitet}</td>`;
      content += `<td style="padding: 5px; border: 1px solid black;">${corresponsingAirtTableFeature.treslag}</td>`;
      content += `<td style="padding: 5px; border: 1px solid black;">${corresponsingAirtTableFeature.alder}</td>`;
      content += `<td style="padding: 5px; border: 1px solid black;">${convertAndformatTheStringArealM2ToDAA(corresponsingAirtTableFeature.arealm2)}</td>`;
      content += `<td style="padding: 5px; border: 1px solid black;">${formatNumber(parseFloat(corresponsingAirtTableFeature.carbon_stored) / 1000, 'nb-NO', 2)}</td>`;
      content += `<td style="padding: 5px; border: 1px solid black;">${formatNumber(parseFloat(corresponsingAirtTableFeature.carbon_captured_next_year) / 1000, 'nb-NO', 2)}</td>`;
      content += `<td style="padding: 5px; border: 1px solid black;">${formatNumber(parseFloat(corresponsingAirtTableFeature.volume_per_hectare_without_bark) / 10, 'nb-NO', 1)}</td>`;
      content += `<td style="padding: 5px; border: 1px solid black;">${formatNumber(parseFloat(corresponsingAirtTableFeature.volume_without_bark), 'nb-NO', 1)}</td>`;
      content += `<td style="padding: 5px; border: 1px solid black;">${formatNumber(parseFloat(corresponsingAirtTableFeature.volume_growth_factor) * 100, 'nb-NO', 2)}</td>`;
      content += `<td style="padding: 5px; border: 1px solid black;">${formatNumber(parseFloat(corresponsingAirtTableFeature.avg_price_m3), 'nb-NO', 1)}</td>`;
      content += `<td style="padding: 5px; border: 1px solid black;">${formatNumber(parseFloat(corresponsingAirtTableFeature.volume_at_maturity_without_bark) * parseFloat(corresponsingAirtTableFeature.avg_price_m3), 'nb-NO', 1)}</td>`;
      if (userSpeciesPrices.hogstUtkPrice) {
        content += `
        <td style="padding: 5px; border: 1px solid black;">
        ${formatNumber(
          parseFloat(
            corresponsingAirtTableFeature.volume_at_maturity_without_bark
          ) *
            (parseFloat(corresponsingAirtTableFeature.avg_price_m3) -
              parseFloat(userSpeciesPrices.hogstUtkPrice)),
          'nb-NO',
          1
        )}
        </td>`;
      }
      content += `<td style="padding: 5px; border: 1px solid black;">${corresponsingAirtTableFeature.years_to_maturity}</td>`;
      content += '</tr>';
    });

    content += '<tr>';
    content += `<td style="padding: 5px; border: 1px solid black; font-weight: bold">Total</td>`;
    content += `<td style="padding: 5px; border: 1px solid black; font-weight: bold"></td>`;
    content += `<td style="padding: 5px; border: 1px solid black; font-weight: bold"></td>`;
    content += `<td style="padding: 5px; border: 1px solid black; font-weight: bold"></td>`;
    content += `<td style="padding: 5px; border: 1px solid black; font-weight: bold"></td>`;
    content += `<td style="padding: 5px; border: 1px solid black; font-weight: bold">${sumObj.arealDAA}</td>`;
    content += `<td style="padding: 5px; border: 1px solid black; font-weight: bold">${sumObj.carbon_stored}</td>`;
    content += `<td style="padding: 5px; border: 1px solid black; font-weight: bold">${sumObj.carbon_captured_next_year}</td>`;
    content += `<td style="padding: 5px; border: 1px solid black; font-weight: bold"></td>`;
    content += `<td style="padding: 5px; border: 1px solid black; font-weight: bold">${formatNumber(parseFloat(sumObj.standVolumeMads), 'nb-NO', 1)}</td>`;
    content += `<td style="padding: 5px; border: 1px solid black; font-weight: bold"></td>`;
    content += `<td style="padding: 5px; border: 1px solid black; font-weight: bold"></td>`;
    content += `<td style="padding: 5px; border: 1px solid black; font-weight: bold">${formatNumber(parseFloat(sumObj.totalBruttoVerdi), 'nb-NO', 1)}</td>`;
    if (sumObj.totalNettoVerdi) {
      content += `<td style="padding: 5px; border: 1px solid black; font-weight: bold">${formatNumber(parseFloat(sumObj.totalNettoVerdi), 'nb-NO', 1)}</td>`;
    }
    content += '</tr>';
  } else {
    // Multi switch is off
    const selectedFeature = selectedFeatures[0];
    const corresponsingAirtTableFeature = airTableBestandFeatInfos.find(
      (featureData) =>
        featureData.fields.bestand_id === selectedFeature.properties.teig_best_
    ).fields;

    corresponsingAirtTableFeature.avg_price_m3 = calculateAvgPrice(
      corresponsingAirtTableFeature,
      userSpeciesPrices
    );

    sumObj.bestand_id = corresponsingAirtTableFeature.bestand_id;
    // Get Hogstklasse
    sumObj.hogstkl_verdi = corresponsingAirtTableFeature.hogstkl_verdi;

    // Get the Bonitet
    sumObj.bonitet = corresponsingAirtTableFeature.bonitet;

    // Get the Treslag
    sumObj.treslag = corresponsingAirtTableFeature.treslag;

    // Calculate arealDAA
    sumObj.arealDAA = convertAndformatTheStringArealM2ToDAA(
      parseFloat(corresponsingAirtTableFeature.arealm2)
    );

    // Get the Alder
    sumObj.alder = corresponsingAirtTableFeature.alder;

    // Get the volume_growth_factor
    sumObj.volume_growth_factor = formatNumber(
      parseFloat(corresponsingAirtTableFeature.volume_growth_factor) * 100,
      'nb-NO',
      2
    );

    // Get the years_to_maturity
    sumObj.years_to_maturity = parseInt(
      corresponsingAirtTableFeature.years_to_maturity
    );

    // Get the carbon_stored and convert it to Tonn
    sumObj.carbon_stored = formatNumber(
      parseFloat(corresponsingAirtTableFeature.carbon_stored) / 1000,
      'nb-NO',
      2
    );

    // Get the carbon_captured_next_year and convert it to Tonn
    sumObj.carbon_captured_next_year = formatNumber(
      parseFloat(corresponsingAirtTableFeature.carbon_captured_next_year) /
        1000,
      'nb-NO',
      2
    );

    let rowBGColor = getHKBGColor(sumObj.hogstkl_verdi);

    content +=
      // Add the ID row
      `<tr style="border: 1px solid black;">
        <td style="padding: 5px; border: 1px solid black;">${desiredFeatInfoAttrHKLayer['teig_best_']}</td>
        <td style="padding: 5px; border: 1px solid black; font-weight: bold">${sumObj.bestand_id}</td>
        <td style="padding: 5px; border: 1px solid black; text-align: center;">
          <span style="padding: 5px; background-color: transparent; text-align: center;">
            <span class="info-icon" data-tooltip="${bestand_idTT?.fields && bestand_idTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
              i
            </span>
          </span>
        </td>
      </tr>` +
      // Add Hogstklasse
      `<tr style="border: 1px solid black; background-color: ${rowBGColor}">
        <td style="padding: 5px; border: 1px solid black;">${desiredFeatInfoAttrHKLayer['hogstkl_ve']}</td>
        <td style="padding: 5px; border: 1px solid black; font-weight: bold;">${sumObj.hogstkl_verdi}</td>
        <td style="padding: 5px; border: 1px solid black; text-align: center;">
          <span style="padding: 5px; background-color: transparent; text-align: center;">
            <span class="info-icon" data-tooltip="${hogstkl_verdiTT?.fields && hogstkl_verdiTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
              i
            </span>
          </span>
        </td>
      </tr>` +
      // Add Bonitet
      `<tr style="border: 1px solid black;">
        <td style="padding: 5px; border: 1px solid black;">${desiredFeatInfoAttrHKLayer['bonitet_bes']}</td>
        <td style="padding: 5px; border: 1px solid black; font-weight: bold">${sumObj.bonitet}</td>
        <td style="padding: 5px; border: 1px solid black; text-align: center;">
          <span style="padding: 5px; background-color: transparent; text-align: center;">
            <span class="info-icon" data-tooltip="${bonitetTT?.fields && bonitetTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
              i
            </span>
          </span>
        </td>
      </tr>` +
      // Add the Treslag
      `<tr style="border: 1px solid black; background-color: ${rowBGColor}">
        <td style="padding: 5px; border: 1px solid black;">${desiredFeatInfoAttrHKLayer['bontre_be']}</td>
        <td style="padding: 5px; border: 1px solid black; font-weight: bold">${sumObj.treslag}</td>
        <td style="padding: 5px; border: 1px solid black; text-align: center;">
          <span style="padding: 5px; background-color: transparent; text-align: center;">
            <span class="info-icon" data-tooltip="${trelagTT?.fields && trelagTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
              i
            </span>
          </span>
        </td>
      </tr>` +
      // Add the ArealM2
      `<tr style="border: 1px solid black;">
          <td style="padding: 5px; border: 1px solid black; min-width: 110px">${desiredFeatInfoAttrHKLayer['areal']}</td>
          <td style="padding: 5px; display: flex; justify-content: space-between; min-width: 110px">
            <span style="font-weight: bold">${sumObj.arealDAA}</span>
            <span>daa</span>
          </td>
          <td style="padding: 5px; border: 1px solid black; text-align: center;">
            <span style="padding: 5px; background-color: transparent; text-align: center;">
              <span class="info-icon" data-tooltip="${arealTT?.fields && arealTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
                i
              </span>
            </span>
          </td>
        </tr>` +
      // Add the Alder
      `<tr style="border: 1px solid black; background-color: ${rowBGColor}">
          <td style="padding: 5px; border: 1px solid black;">${desiredFeatInfoAttrHKLayer['alder']}</td>
          <td style="padding: 5px; border: 1px solid black; font-weight: bold">${sumObj.alder}</td>
          <td style="padding: 5px; border: 1px solid black; text-align: center;">
            <span style="padding: 5px; background-color: transparent; text-align: center;">
              <span class="info-icon" data-tooltip="${alderTT?.fields && alderTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
                i
              </span>
            </span>
          </td>
        </tr>` +
      // Add the carbon_stored
      `<tr style="border: 1px solid black;">
            <td style="padding: 5px; border: 1px solid black;">${desiredFeatInfoAttrHKLayer['carbon_stored']}</td>
            <td style="padding: 5px; display: flex; justify-content: space-between;">
              <span style="font-weight: bold">${sumObj.carbon_stored}</span>
              <span>T</span>
            </td>
            <td style="padding: 5px; border: 1px solid black; text-align: center;">
              <span style="padding: 5px; background-color: transparent; text-align: center;">
                <span class="info-icon" data-tooltip="${carbon_storedTT?.fields && carbon_storedTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
                  i
                </span>
              </span>
            </td>
        </tr>` +
      // Add the carbon_captured_next_year
      `<tr style="border: 1px solid black; background-color: ${rowBGColor}">
          <td style="padding: 5px; border: 1px solid black;">${desiredFeatInfoAttrHKLayer['carbon_captured_next_year']}</td>
          <td style="padding: 5px; display: flex; justify-content: space-between;">
            <span style="font-weight: bold">${sumObj.carbon_captured_next_year}</span>
            <span>T</span>
          </td>
          <td style="padding: 5px; border: 1px solid black; text-align: center;">
              <span style="padding: 5px; background-color: transparent; text-align: center;">
                <span class="info-icon" data-tooltip="${carbon_captured_next_yearTT?.fields && carbon_captured_next_yearTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
                  i
                </span>
              </span>
            </td>
        </tr>`;
    content += `
            <tr style="border: 1px solid black;">
              <td style="padding: 5px; border: 1px solid black;">Tømmertetthet</td>
              <td style="padding: 5px; display: flex; justify-content: space-between;">
                <span style="font-weight: bold">${formatNumber(parseFloat(corresponsingAirtTableFeature.volume_per_hectare_without_bark) / 10, 'nb-NO', 1)}</span>
                <span>m^3/daa</span>
              </td>
              <td style="padding: 5px; border: 1px solid black; text-align: center;">
                <span style="padding: 5px; background-color: transparent; text-align: center;">
                  <span class="info-icon" data-tooltip="${volume_per_hectare_without_barkTT?.fields && volume_per_hectare_without_barkTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
                    i
                  </span>
                </span>
              </td>
            </tr>`;
    content += `
            <tr style="border: 1px solid black; background-color: ${rowBGColor}">
              <td style="padding: 5px; border: 1px solid black;">Tømmervolum</td>
              <td style="padding: 5px; display: flex; justify-content: space-between;">
                <span style="font-weight: bold">${formatNumber(parseFloat(sumObj.standVolumeMads), 'nb-NO', 1)}</span>
                <span>m^3</span>
              </td>
              <td style="padding: 5px; border: 1px solid black; text-align: center;">
                <span style="padding: 5px; background-color: transparent; text-align: center;">
                  <span class="info-icon" data-tooltip="${volume_without_barkTT?.fields && volume_without_barkTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
                    i
                  </span>
                </span>
              </td>
            </tr>`;
    // Add the volume_growth_factor
    content += `
            <tr style="border: 1px solid black;">
              <td style="padding: 5px; border: 1px solid black;">Årlig vekst</td>
              <td style="padding: 5px; display: flex; justify-content: space-between;">
                <span style="font-weight: bold">${sumObj.volume_growth_factor}</span>
                <span>%</span>
              </td>
              <td style="padding: 5px; border: 1px solid black; text-align: center;">
                <span style="padding: 5px; background-color: transparent; text-align: center;">
                  <span class="info-icon" data-tooltip="${volume_growth_factorTT?.fields && volume_growth_factorTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
                    i
                  </span>
                </span>
              </td>
            </tr>`;
    // The price of the timber for a species
    content += `
            <tr style="border: 1px solid black; background-color: ${rowBGColor}">
              <td style="padding: 5px; border: 1px solid black; min-width: 150px;">Forv. gj.sn pris per m^3</td>
              <td style="padding: 5px; display: flex; justify-content: space-between;">
                <span style="font-weight: bold">${formatNumber(parseFloat(sumObj.avgSpeciesPriceCalculated), 'nb-NO', 0)}</span>
                <span>kr</span>
              </td>
              <td style="padding: 5px; border: 1px solid black; text-align: center;">
                <span style="padding: 5px; background-color: transparent; text-align: center;">
                  <span class="info-icon" data-tooltip="${avg_price_m3TT?.fields && avg_price_m3TT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
                    i
                  </span>
                </span>
              </td>
            </tr>`;
    // Brutto verdi
    content += `
            <tr style="border: 1px solid black;">
              <td style="padding: 5px; border: 1px solid black;">Forv. brutto verdi</td>
              <td style="padding: 5px; display: flex; justify-content: space-between;">
                <span style="font-weight: bold">${formatNumber(parseFloat(sumObj.totalBruttoVerdi), 'nb-NO', 0)}</span>
                <span>kr</span>
              </td>
              <td style="padding: 5px; border: 1px solid black; text-align: center;">
                <span style="padding: 5px; background-color: transparent; text-align: center;">
                  <span class="info-icon" data-tooltip="${bruttoTT?.fields && bruttoTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
                    i
                  </span>
                </span>
              </td>
            </tr>`;
    // Netto verdi
    if (sumObj.totalNettoVerdi) {
      content += `
              <tr style="border: 1px solid black; background-color: ${rowBGColor}">
                <td style="padding: 5px; border: 1px solid black;">Forv. netto verdi</td>
                <td style="padding: 5px; display: flex; justify-content: space-between;">
                  <span style="font-weight: bold">${formatNumber(parseFloat(sumObj.totalNettoVerdi), 'nb-NO', 0)}</span>
                  <span>kr</span>
                </td>
                <td style="padding: 5px; border: 1px solid black; text-align: center;">
                  <span style="padding: 5px; background-color: transparent; text-align: center;">
                    <span class="info-icon" data-tooltip="${nettoTT?.fields && nettoTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
                      i
                    </span>
                  </span>
                </td>
              </tr>`;
      // Add the years_to_maturity
      content += `
            <tr style="border: 1px solid black;">
              <td style="padding: 5px; border: 1px solid black;">År til hogstmoden alder</td>
              <td style="padding: 5px; display: flex; justify-content: space-between;">
                <span style="font-weight: bold">${sumObj.years_to_maturity}</span>
              </td>
              <td style="padding: 5px; border: 1px solid black; text-align: center;">
                <span style="padding: 5px; background-color: transparent; text-align: center;">
                  <span class="info-icon" data-tooltip="${years_to_maturityTT?.fields && years_to_maturityTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
                    i
                  </span>
                </span>
              </td>
            </tr>`;
    } else {
      // Add the years_to_maturity
      content += `
            <tr style="border: 1px solid black;">
              <td style="padding: 5px; border: 1px solid black;">År til hogstmoden alder</td>
              <td style="padding: 5px; display: flex; justify-content: space-between;">
                <span style="font-weight: bold">${sumObj.years_to_maturity}</span>
              </td>
              <td style="padding: 5px; border: 1px solid black; text-align: center;">
                <span style="padding: 5px; background-color: transparent; text-align: center;">
                  <span class="info-icon" data-tooltip="${years_to_maturityTT?.fields && years_to_maturityTT.fields.Tooltip}" style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; border: 1px solid black; background-color: lightblue; cursor: pointer;">
                    i
                  </span>
                </span>
              </td>
            </tr>`;
    }
  }

  content += '</table>';
  return content;
};

export const createMISButton = (MISConetntDiv, MISFeature, e, map) => {
  const MISButton = document.createElement('button');
  MISButton.textContent = 'View MIS Content!';
  MISButton.style.padding = '10px 10px';
  MISButton.style.backgroundColor = '#ffc107';
  MISButton.style.border = 'none';
  MISButton.style.borderRadius = '4px';
  MISButton.style.color = 'white';

  const createCollapsibleContent = () => {
    const popup = document.querySelector('.leaflet-popup-content-wrapper');
    const originalWidth = popup.offsetWidth;
    const originalHeight = popup.offsetHeight;

    const originalHeader = MISConetntDiv.querySelector('h3').outerHTML;

    const MISContent = document.createElement('div');
    MISContent.className = 'mis-popup-inner';
    MISContent.innerHTML = originalHeader;
    MISContent.style.width = `${originalWidth}px`;
    MISContent.style.height = `${originalHeight}px`;
    MISContent.style.overflowY = 'auto';

    const MISCollapsibleContainer = document.createElement('div');
    MISCollapsibleContainer.className = 'mis-content-scrollable';

    MISFeature.forEach((feature) => {
      const MISFeatureDiv = document.createElement('div');
      MISFeatureDiv.className = 'mis-collapsible-row';

      const header = document.createElement('div');
      header.className = 'mis-collapsible';
      header.textContent = `Layer: ${feature.layerName}`;
      header.addEventListener('click', () => {
        header.classList.toggle('active');
        MISFeatureDetails.style.display =
          MISFeatureDetails.style.display === 'none' ? 'table' : 'none';
      });

      const MISFeatureDetails = document.createElement('table');
      MISFeatureDetails.className = 'mis-feature-table';
      MISFeatureDetails.style.display = 'none';

      const MISFeatureProperties = feature.getProperties();
      for (const key in MISFeatureProperties) {
        if (
          MISFeatureProperties.hasOwnProperty(key) &&
          MISFeatureProperties[key] &&
          unwantedMISFeatureKeys.indexOf(key) === -1
        ) {
          const row = document.createElement('tr');

          const cellKey = document.createElement('td');
          cellKey.textContent = key;
          cellKey.style.color = 'black';
          row.appendChild(cellKey);

          const cellValue = document.createElement('td');
          cellValue.textContent = MISFeatureProperties[key];
          cellValue.style.color = 'black';
          row.appendChild(cellValue);

          MISFeatureDetails.appendChild(row);
        }
      }

      MISFeatureDiv.appendChild(header);
      MISFeatureDiv.appendChild(MISFeatureDetails);
      MISCollapsibleContainer.appendChild(MISFeatureDiv);
    });

    MISContent.appendChild(MISCollapsibleContainer);

    const MISBackButtonContainer = document.createElement('div');
    MISBackButtonContainer.className = 'mis-back-button-container';

    const MISBackButton = document.createElement('button');
    MISBackButton.textContent = 'Go Back';
    MISBackButton.style.padding = '10px 10px';
    MISBackButton.style.backgroundColor = '#ffc107';
    MISBackButton.style.border = 'none';
    MISBackButton.style.borderRadius = '4px';
    MISBackButton.style.color = 'white';

    MISBackButton.addEventListener('click', () => {
      openHKPopupWithContent(MISConetntDiv, e, map);
    });

    MISBackButtonContainer.appendChild(MISBackButton);
    MISContent.appendChild(MISBackButtonContainer);

    openHKPopupWithContent(MISContent, e, map);
  };

  MISButton.addEventListener('click', createCollapsibleContent);
  MISConetntDiv.appendChild(MISButton);
  return MISConetntDiv;
};

export const openHKPopupWithContent = (content, e, map) => {
  const popup = L.popup({
    interactive: true,
    maxWidth: 'auto',
    minWidth: 300,
    maxHeight: 'auto',
  })
    .setLatLng(e.latlng)
    .setContent(content)
    .openOn(map);

  const popupContainer = popup.getElement();
  popupContainer.style.width = 'auto';
  popupContainer.style.height = 'auto';
  addPopupTooltipListeners();
};

// Function to add tooltip event listeners
function addPopupTooltipListeners() {
  document.querySelectorAll('.info-icon').forEach(function (icon) {
    icon.addEventListener('click', function () {
      let existingTooltip = document.querySelector('.custom-tooltip');
      if (existingTooltip) {
        existingTooltip.remove();
        if (
          existingTooltip.getAttribute('data-for') ===
          this.getAttribute('data-tooltip')
        ) {
          return;
        }
      }

      const tooltipText = this.getAttribute('data-tooltip');
      const tooltipElement = document.createElement('div');
      tooltipElement.className = 'custom-tooltip';
      tooltipElement.setAttribute(
        'data-for',
        this.getAttribute('data-tooltip')
      );
      tooltipElement.style.position = 'absolute';
      tooltipElement.style.backgroundColor = 'white';
      tooltipElement.style.border = '1px solid black';
      tooltipElement.style.padding = '0.25rem 0.5rem';
      tooltipElement.style.zIndex = '1000';
      tooltipElement.style.color = '#222a42';
      tooltipElement.style.borderRadius = '0.25rem';
      tooltipElement.innerText = tooltipText;

      document.body.appendChild(tooltipElement);

      const rect = this.getBoundingClientRect();
      tooltipElement.style.top = `${rect.bottom + window.scrollY + 5}px`;
      tooltipElement.style.left = `${rect.left + window.scrollX}px`;
    });
  });

  // Close tooltips when clicking outside
  document.addEventListener('click', function (event) {
    const tooltip = document.querySelector('.custom-tooltip');
    if (
      tooltip &&
      !event.target.closest('.info-icon') &&
      !tooltip.contains(event.target)
    ) {
      tooltip.remove();
    }
  });
}
