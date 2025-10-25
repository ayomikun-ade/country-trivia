const { pool } = require('../config/database');

/**
 * Upsert (insert or update) a country record
 * @param {Object} countryData - Country data object
 * @returns {Promise<void>}
 */
async function upsertCountry(countryData) {
  const {
    name,
    capital,
    region,
    population,
    currency_code,
    exchange_rate,
    estimated_gdp,
    flag_url
  } = countryData;

  const query = `
    INSERT INTO countries (name, capital, region, population, currency_code, exchange_rate, estimated_gdp, flag_url, last_refreshed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      capital = VALUES(capital),
      region = VALUES(region),
      population = VALUES(population),
      currency_code = VALUES(currency_code),
      exchange_rate = VALUES(exchange_rate),
      estimated_gdp = VALUES(estimated_gdp),
      flag_url = VALUES(flag_url),
      last_refreshed_at = NOW()
  `;

  await pool.query(query, [
    name,
    capital,
    region,
    population,
    currency_code,
    exchange_rate,
    estimated_gdp,
    flag_url
  ]);
}

/**
 * Bulk upsert countries
 * @param {Array} countries - Array of country data objects
 * @returns {Promise<number>} - Number of countries processed
 */
async function bulkUpsertCountries(countries) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const country of countries) {
      await connection.query(
        `INSERT INTO countries (name, capital, region, population, currency_code, exchange_rate, estimated_gdp, flag_url, last_refreshed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           capital = VALUES(capital),
           region = VALUES(region),
           population = VALUES(population),
           currency_code = VALUES(currency_code),
           exchange_rate = VALUES(exchange_rate),
           estimated_gdp = VALUES(estimated_gdp),
           flag_url = VALUES(flag_url),
           last_refreshed_at = NOW()`,
        [
          country.name,
          country.capital,
          country.region,
          country.population,
          country.currency_code,
          country.exchange_rate,
          country.estimated_gdp,
          country.flag_url
        ]
      );
    }

    await connection.commit();
    return countries.length;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get all countries with optional filters and sorting
 * @param {Object} filters - Filter options (region, currency)
 * @param {string} sort - Sort option
 * @returns {Promise<Array>} - Array of country objects
 */
async function getAllCountries(filters = {}, sort = null) {
  let query = 'SELECT * FROM countries WHERE 1=1';
  const params = [];

  // Apply filters
  if (filters.region) {
    query += ' AND region = ?';
    params.push(filters.region);
  }

  if (filters.currency) {
    query += ' AND currency_code = ?';
    params.push(filters.currency);
  }

  // Apply sorting
  if (sort === 'gdp_desc') {
    query += ' ORDER BY estimated_gdp DESC';
  } else if (sort === 'gdp_asc') {
    query += ' ORDER BY estimated_gdp ASC';
  } else if (sort === 'population_desc') {
    query += ' ORDER BY population DESC';
  } else if (sort === 'population_asc') {
    query += ' ORDER BY population ASC';
  } else if (sort === 'name_asc') {
    query += ' ORDER BY name ASC';
  } else if (sort === 'name_desc') {
    query += ' ORDER BY name DESC';
  } else {
    query += ' ORDER BY name ASC'; // Default sorting
  }

  const [rows] = await pool.query(query, params);

  // Format the response
  return rows.map(formatCountryResponse);
}

/**
 * Get a single country by name
 * @param {string} name - Country name
 * @returns {Promise<Object|null>} - Country object or null
 */
async function getCountryByName(name) {
  const query = 'SELECT * FROM countries WHERE LOWER(name) = LOWER(?) LIMIT 1';
  const [rows] = await pool.query(query, [name]);

  if (rows.length === 0) {
    return null;
  }

  return formatCountryResponse(rows[0]);
}

/**
 * Delete a country by name
 * @param {string} name - Country name
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
async function deleteCountryByName(name) {
  const query = 'DELETE FROM countries WHERE LOWER(name) = LOWER(?)';
  const [result] = await pool.query(query, [name]);

  return result.affectedRows > 0;
}

/**
 * Update refresh metadata
 * @returns {Promise<void>}
 */
async function updateRefreshMetadata() {
  const [countResult] = await pool.query('SELECT COUNT(*) as total FROM countries');
  const totalCountries = countResult[0].total;

  await pool.query(
    'UPDATE refresh_metadata SET last_refreshed_at = NOW(), total_countries = ? WHERE id = 1',
    [totalCountries]
  );
}

/**
 * Get refresh metadata
 * @returns {Promise<Object>} - Metadata object
 */
async function getRefreshMetadata() {
  const [rows] = await pool.query('SELECT * FROM refresh_metadata WHERE id = 1');

  if (rows.length === 0) {
    return {
      total_countries: 0,
      last_refreshed_at: null
    };
  }

  return {
    total_countries: rows[0].total_countries,
    last_refreshed_at: rows[0].last_refreshed_at
  };
}

/**
 * Get top countries by GDP for image generation
 * @param {number} limit - Number of top countries to retrieve
 * @returns {Promise<Array>} - Array of top countries
 */
async function getTopCountriesByGDP(limit = 5) {
  const query = `
    SELECT name, estimated_gdp, flag_url
    FROM countries
    WHERE estimated_gdp IS NOT NULL
    ORDER BY estimated_gdp DESC
    LIMIT ?
  `;

  const [rows] = await pool.query(query, [limit]);
  return rows;
}

/**
 * Format country response object
 * @param {Object} row - Database row
 * @returns {Object} - Formatted country object
 */
function formatCountryResponse(row) {
  return {
    id: row.id,
    name: row.name,
    capital: row.capital,
    region: row.region,
    population: row.population,
    currency_code: row.currency_code,
    exchange_rate: row.exchange_rate ? parseFloat(row.exchange_rate) : null,
    estimated_gdp: row.estimated_gdp ? parseFloat(row.estimated_gdp) : (row.estimated_gdp === 0 ? 0 : null),
    flag_url: row.flag_url,
    last_refreshed_at: row.last_refreshed_at
  };
}

module.exports = {
  upsertCountry,
  bulkUpsertCountries,
  getAllCountries,
  getCountryByName,
  deleteCountryByName,
  updateRefreshMetadata,
  getRefreshMetadata,
  getTopCountriesByGDP
};
