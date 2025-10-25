const axios = require('axios');
require('dotenv').config();

const COUNTRIES_API_URL = process.env.COUNTRIES_API_URL || 'https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies';
const EXCHANGE_RATE_API_URL = process.env.EXCHANGE_RATE_API_URL || 'https://open.er-api.com/v6/latest/USD';

/**
 * Fetch all countries from the external API
 * @returns {Promise<Array>} Array of country objects
 */
async function fetchCountries() {
  try {
    const response = await axios.get(COUNTRIES_API_URL, {
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Countries API request timed out');
    }
    throw new Error(`Could not fetch data from Countries API: ${error.message}`);
  }
}

/**
 * Fetch exchange rates from the external API
 * @returns {Promise<Object>} Object with exchange rates
 */
async function fetchExchangeRates() {
  try {
    const response = await axios.get(EXCHANGE_RATE_API_URL, {
      timeout: 30000
    });

    if (response.data && response.data.rates) {
      return response.data.rates;
    }

    throw new Error('Invalid response format from Exchange Rate API');
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Exchange Rate API request timed out');
    }
    throw new Error(`Could not fetch data from Exchange Rate API: ${error.message}`);
  }
}

module.exports = {
  fetchCountries,
  fetchExchangeRates
};
