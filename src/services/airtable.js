const airtableBestandTableURL = `https://api.airtable.com/v0/${process.env.REACT_APP_AIRTABLE_BASE_ID}/${process.env.REACT_APP_AIRTABLE_BESTAND_TABLE_ID}`;
const airtablePricesTableURL = `https://api.airtable.com/v0/${process.env.REACT_APP_AIRTABLE_BASE_ID}/${process.env.REACT_APP_AIRTABLE_PRICES_N_COST_TABLE_ID}`;
const airtableTooltipsTableURL = `https://api.airtable.com/v0/${process.env.REACT_APP_AIRTABLE_BASE_ID}/${process.env.REACT_APP_AIRTABLE_TOOLTIPS_TABLE_ID}`;

const fetchAirtablePrices = async () => {
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
      const { specie, price_saw_wood, price_pulp_wood, cost_harvest_per_m3 } =
        record.fields;
      return {
        ...acc,
        [`${specie}SagtommerPrice`]: price_saw_wood || 0,
        [`${specie}MassevirkePrice`]: price_pulp_wood || 0,
        [`hogstUtkPrice`]: cost_harvest_per_m3 || 0,
      };
    }, {});
    return prices;
  } catch (error) {
    console.error('Error fetching Prices records:', error);
  }
};

const fetchAirtableRecords = async (url) => {
  let allRecords = [];
  let offset;

  try {
    do {
      const response = await fetch(`${url}?offset=${offset || ''}`, {
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
        },
      });
      const data = await response.json();
      allRecords = allRecords.concat(data.records);
      offset = data.offset; // Airtable provides an offset if there are more records to fetch
    } while (offset); // Continue fetching until there's no offset, indicating all records have been fetched

    return allRecords;
  } catch (error) {
    console.error('Error fetching records from Airtable', error);
    throw error;
  }
};

// Now, use the generic function for specific cases
const fetchBestandRecords = () => fetchAirtableRecords(airtableBestandTableURL);
const fetchPricesRecords = () => fetchAirtableRecords(airtablePricesTableURL);
const fetchTooltipsRecords = () =>
  fetchAirtableRecords(airtableTooltipsTableURL);

export {
  fetchAirtablePrices,
  fetchBestandRecords,
  fetchPricesRecords,
  fetchTooltipsRecords,
};
