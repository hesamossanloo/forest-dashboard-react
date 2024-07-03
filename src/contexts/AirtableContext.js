// src/RecordsContext.js
import PropTypes from 'prop-types';
import { createContext, useContext, useEffect, useState } from 'react';
import { fetchBestandRecords, fetchPricesRecords } from '../services/airtable';

const AirtableContext = createContext();
export const useAirtable = () => useContext(AirtableContext);
const AirtableProvider = ({ children }) => {
  // Add 'children' to props validation
  AirtableProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };
  const [airTableBestandInfos, setAirTableBestandInfos] = useState([]);
  const [airTablePricesCosts, setAirTablePricesCosts] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    // Fetch Airtable Bestandsdata
    const getBestandRecords = async () => {
      setIsFetching(true);
      try {
        const records = await fetchBestandRecords();
        setAirTableBestandInfos(records);
      } catch (error) {
        console.error('Error fetching records:', error);
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
        console.error('Error fetching records:', error);
      } finally {
        setIsFetching(false);
      }
    };
    getPricesRecords();
    getBestandRecords();
  }, []);

  return (
    <AirtableContext.Provider
      value={{
        airTableBestandInfos,
        airTablePricesCosts,
        isFetching,
      }}
    >
      {children}
    </AirtableContext.Provider>
  );
};

export { AirtableContext, AirtableProvider };
