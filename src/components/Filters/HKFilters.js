import ToggleSwitch from 'components/ToggleSwitch/ToggleSwitch';
import { useAirtable } from 'contexts/AirtableContext';
import { useAuth } from 'contexts/AuthContext';
import { MapFilterContext } from 'contexts/MapFilterContext';
import { useContext, useEffect, useState } from 'react';
import { Label } from 'reactstrap';
import {
  calculateAvgPrice,
  formatNumber,
} from 'utilities/Map/utililtyFunctions';

const labelStyle = {
  fontSize: '0.80rem',
};

const HKFilters = () => {
  const [mapFilter, setMapFilter] = useContext(MapFilterContext);
  const [volume, setVolume] = useState(0);
  const [ESTGrossValue, setESTGrossValue] = useState(0);
  const { airTableBestandInfos, isFetching } = useAirtable();
  const { userSpeciesPrices } = useAuth();

  // On HK5 change, go through the featureInfosData and find the rows where the hogstkl_verdi is 5
  // Then, get the sum of the values under the column Volume
  const calculateVolume = () => {
    let sumV = 0;
    let sumWorth = 0;
    airTableBestandInfos.forEach((row) => {
      const rowFields = row.fields;
      const rowV = parseFloat(rowFields.volume) || 0;
      rowFields.avg_price_m3 = calculateAvgPrice(rowFields, userSpeciesPrices);
      if (mapFilter.HK5 && rowFields.hogstkl_verdi === 5) {
        sumV += rowV;
        sumWorth += rowV * (rowFields.avg_price_m3 || 0);
      }
      if (mapFilter.HK4 && rowFields.hogstkl_verdi === 4) {
        sumV += rowV;
        sumWorth += rowV * (rowFields.avg_price_m3 || 0);
      }
    });
    return [sumV, sumWorth];
  };

  // whenever the mapFilter.HK5 changes, update the mapFilter.V
  useEffect(() => {
    const delay = isFetching ? 2000 : 0;
    setTimeout(() => {
      const [sumV, sumWorth] = calculateVolume();
      setVolume(sumV);
      setESTGrossValue(sumWorth);
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapFilter, isFetching]);
  return (
    <>
      {/* HK5 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Label style={labelStyle}>HK5</Label>
        <ToggleSwitch
          id="HK5"
          optionLabels={['ON', 'OFF']}
          small
          checked={mapFilter.HK5}
          onChange={() =>
            setMapFilter((prevState) => ({
              ...prevState,
              HK5: !prevState.HK5,
            }))
          }
        />
      </div>
      {/* HK4 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 10,
        }}
      >
        <Label style={labelStyle}>HK4</Label>
        <ToggleSwitch
          id="HK4"
          optionLabels={['ON', 'OFF']}
          small
          checked={mapFilter.HK4}
          onChange={() =>
            setMapFilter((prevState) => ({
              ...prevState,
              HK4: !prevState.HK4,
            }))
          }
        />
      </div>
      {/* Summaries */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 30,
        }}
      >
        <Label style={labelStyle}>
          <u>Summary</u>
        </Label>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 10,
        }}
      >
        <Label style={labelStyle}>Total Volume</Label>
        <Label style={labelStyle}>
          {formatNumber(Math.ceil(volume), 'nb-NO', 0)} m3
        </Label>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 10,
        }}
      >
        <Label style={labelStyle}>Est. Gross Value</Label>
        <Label style={labelStyle}>
          {formatNumber(Math.ceil(ESTGrossValue), 'nb-NO', 0)} kr
        </Label>
      </div>
      {/* <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 30,
              }}
            >
              <Label style={labelStyle}>
                <u>Species Prices</u>
              </Label>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 10,
              }}
            >
              <Label style={labelStyle}>{SPECIES.GRAN}</Label>
              <Label style={labelStyle}>{SPECIES_PRICES.GRAN} kr</Label>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 10,
              }}
            >
              <Label style={labelStyle}>{SPECIES.FURU}</Label>
              <Label style={labelStyle}>{SPECIES_PRICES.FURU} kr</Label>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 10,
              }}
            >
              <Label style={labelStyle}>{SPECIES.LAU}</Label>
              <Label style={labelStyle}>{SPECIES_PRICES.LAU} kr</Label>
            </div> */}
    </>
  );
};

export default HKFilters;
