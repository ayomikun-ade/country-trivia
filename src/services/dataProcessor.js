/**
 * Extract the first currency code from a country's currencies array
 * @param {Array} currencies - Array of currency objects
 * @returns {string|null} - Currency code or null
 */
function extractCurrencyCode(currencies) {
  if (!currencies || !Array.isArray(currencies) || currencies.length === 0) {
    return null;
  }

  const firstCurrency = currencies[0];
  return firstCurrency.code || null;
}

/**
 * Generate a random multiplier between 1000 and 2000
 * @returns {number} Random multiplier
 */
function generateRandomMultiplier() {
  return Math.random() * (2000 - 1000) + 1000;
}

/**
 * Calculate estimated GDP
 * @param {number} population - Country population
 * @param {number|null} exchangeRate - Exchange rate
 * @returns {number|null} - Estimated GDP or null
 */
function calculateEstimatedGDP(population, exchangeRate) {
  if (!population || !exchangeRate) {
    return null;
  }

  const multiplier = generateRandomMultiplier();
  const gdp = (population * multiplier) / exchangeRate;

  return parseFloat(gdp.toFixed(2));
}

/**
 * Process country data by matching with exchange rates
 * @param {Array} countries - Array of country objects from external API
 * @param {Object} exchangeRates - Object with currency codes as keys
 * @returns {Array} - Processed country objects
 */
function processCountryData(countries, exchangeRates) {
  return countries.map(country => {
    const currencyCode = extractCurrencyCode(country.currencies);
    let exchangeRate = null;
    let estimatedGdp = null;

    if (currencyCode && exchangeRates[currencyCode]) {
      exchangeRate = exchangeRates[currencyCode];
      estimatedGdp = calculateEstimatedGDP(country.population, exchangeRate);
    } else if (currencyCode) {
      // Currency code exists but not found in exchange rates
      exchangeRate = null;
      estimatedGdp = null;
    } else {
      // No currency code
      estimatedGdp = 0;
    }

    return {
      name: country.name || '',
      capital: country.capital || null,
      region: country.region || null,
      population: country.population || 0,
      currency_code: currencyCode,
      exchange_rate: exchangeRate,
      estimated_gdp: estimatedGdp === null ? null : estimatedGdp,
      flag_url: country.flag || null
    };
  });
}

module.exports = {
  extractCurrencyCode,
  generateRandomMultiplier,
  calculateEstimatedGDP,
  processCountryData
};
