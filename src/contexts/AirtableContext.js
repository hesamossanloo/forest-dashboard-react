// src/RecordsContext.js
import PropTypes from 'prop-types';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  fetchBestandRecords,
  fetchPricesRecords,
  fetchTooltipsRecords,
} from '../services/airtable';

const AirtableContext = createContext();
export const useAirtable = () => useContext(AirtableContext);
const AirtableProvider = ({ children }) => {
  // Add 'children' to props validation
  AirtableProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };
  const [airTableBestandInfos, setAirTableBestandInfos] = useState([]);
  const [airTablePricesCosts, setAirTablePricesCosts] = useState([]);
  const [airTableTooltips, setAirTableTooltips] = useState([]);
  const [isFetchingAirtableRecords, setIsFetchingAirtableRecords] =
    useState(true);

  useEffect(() => {
    const getBestandRecords = async () => {
      try {
        const records = await fetchBestandRecords();
        setAirTableBestandInfos(records);
      } catch (error) {
        console.error('Error fetching Bestand records:', error);
      }
    };
    const getTooltipsRecords = async () => {
      try {
        const records = await fetchTooltipsRecords();
        setAirTableTooltips(records);
      } catch (error) {
        console.error('Error fetching Tooltips records:', error);
      }
    };
    const getPricesRecords = async () => {
      try {
        const records = await fetchPricesRecords();
        // map the records to this format const initialPrices = {
        //   granSagtommerPrice: '',
        //   granMassevirkePrice: '',
        //   furuSagtommerPrice: '',
        //   furuMassevirkePrice: '',
        //   lauvSagtommerPrice: '',
        //   lauvMassevirkePrice: '',
        //   hogstUtkPrice: '',
        // };
        const prices = records.reduce((acc, record) => {
          const {
            specie,
            price_saw_wood,
            price_pulp_wood,
            cost_harvest_per_m3,
          } = record.fields;
          return {
            ...acc,
            [`${specie}SagtommerPrice`]: price_saw_wood || 0,
            [`${specie}MassevirkePrice`]: price_pulp_wood || 0,
            [`hogstUtkPrice`]: cost_harvest_per_m3 || 0,
          };
        }, {});

        setAirTablePricesCosts(prices);
      } catch (error) {
        console.error('Error fetching Prices records:', error);
      }
    };
    const fetchData = async () => {
      setIsFetchingAirtableRecords(true);
      await Promise.all([
        getPricesRecords(),
        getBestandRecords(),
        getTooltipsRecords(),
      ]);
      setIsFetchingAirtableRecords(false);
    };

    fetchData();
  }, []);

  return (
    <AirtableContext.Provider
      value={{
        airTableBestandInfos,
        airTablePricesCosts,
        airTableTooltips,
        isFetchingAirtableRecords,
      }}
    >
      {children}
    </AirtableContext.Provider>
  );
};

export { AirtableContext, AirtableProvider };
