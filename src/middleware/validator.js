const { AppError } = require('./errorHandler');

/**
 * Validate country data
 * @param {Object} countryData - Country data to validate
 * @throws {AppError} - Validation error
 */
function validateCountryData(countryData) {
  const errors = {};

  if (!countryData.name || countryData.name.trim() === '') {
    errors.name = 'is required';
  }

  if (countryData.population === undefined || countryData.population === null) {
    errors.population = 'is required';
  } else if (typeof countryData.population !== 'number' || countryData.population < 0) {
    errors.population = 'must be a non-negative number';
  }

  if (!countryData.currency_code && countryData.currency_code !== null) {
    // If currency_code is undefined (not provided), it's an error
    // If it's null (no currencies), it's acceptable
    if (countryData.currency_code === undefined) {
      errors.currency_code = 'is required';
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }
}

/**
 * Validate query parameters for GET /countries
 * @param {Object} query - Query parameters
 * @returns {Object} - Validated and sanitized query parameters
 */
function validateQueryParams(query) {
  const validatedParams = {};

  if (query.region) {
    validatedParams.region = query.region.trim();
  }

  if (query.currency) {
    validatedParams.currency = query.currency.trim().toUpperCase();
  }

  if (query.sort) {
    const validSorts = ['gdp_desc', 'gdp_asc', 'population_desc', 'population_asc', 'name_asc', 'name_desc'];
    if (validSorts.includes(query.sort)) {
      validatedParams.sort = query.sort;
    }
  }

  return validatedParams;
}

module.exports = {
  validateCountryData,
  validateQueryParams
};
