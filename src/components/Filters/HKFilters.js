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
  const { airTableBestandInfos, isFetchingAirtableRecords } = useAirtable();
  const { userSpeciesPrices } = useAuth();

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

  useEffect(() => {
    const [sumV, sumWorth] = calculateVolume();
    setVolume(sumV);
    setESTGrossValue(sumWorth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapFilter, isFetchingAirtableRecords]);

  // Show loading indicator when fetching records
  if (isFetchingAirtableRecords) {
    return <div>Loading...</div>;
  }

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
          disabled={isFetchingAirtableRecords}
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
          disabled={isFetchingAirtableRecords}
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
    </>
  );
};

export default HKFilters;
