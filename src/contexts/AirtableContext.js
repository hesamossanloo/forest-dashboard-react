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
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    // Fetch Airtable Bestandsdata
    const getBestandRecords = async () => {
      setIsFetching(true);
      try {
        const records = await fetchBestandRecords();
        setAirTableBestandInfos(records);
      } catch (error) {
        console.error('Error fetching Bestand records:', error);
      } finally {
        setIsFetching(false);
      }
    };
    const getTooltipsRecords = async () => {
      setIsFetching(true);
      try {
        const records = await fetchTooltipsRecords();
        setAirTableTooltips(records);
      } catch (error) {
        console.error('Error fetching Tooltips records:', error);
      } finally {
        setIsFetching(false);
      }
    };
    const getPricesRecords = async () => {
      setIsFetching(true);
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
      } finally {
        setIsFetching(false);
      }
    };
    getPricesRecords();
    getBestandRecords();
    getTooltipsRecords();
  }, []);

  return (
    <AirtableContext.Provider
      value={{
        airTableBestandInfos,
        airTablePricesCosts,
        airTableTooltips,
        isFetching,
      }}
    >
      {children}
    </AirtableContext.Provider>
  );
};

export { AirtableContext, AirtableProvider };
