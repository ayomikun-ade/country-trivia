const {
  fetchCountries,
  fetchExchangeRates,
} = require("../services/externalApi");
const { processCountryData } = require("../services/dataProcessor");
const {
  bulkUpsertCountries,
  getAllCountries,
  getCountryByName,
  deleteCountryByName,
  updateRefreshMetadata,
  getRefreshMetadata,
  getTopCountriesByGDP,
} = require("../services/countryService");
const { generateSummaryImage } = require("../services/imageGenerator");
const { AppError } = require("../middleware/errorHandler");
const { validateQueryParams } = require("../middleware/validator");
const path = require("path");
const fs = require("fs").promises;

/**
 * POST /countries/refresh
 * Fetch all countries and exchange rates, then cache them in the database
 */
async function refreshCountries(req, res, next) {
  try {
    // Fetch data from external APIs
    const [countries, exchangeRates] = await Promise.all([
      fetchCountries(),
      fetchExchangeRates(),
    ]);

    // Process country data
    const processedCountries = processCountryData(countries, exchangeRates);

    // Bulk upsert to database
    const count = await bulkUpsertCountries(processedCountries);

    // Update metadata
    await updateRefreshMetadata();

    // Generate summary image
    const metadata = await getRefreshMetadata();
    const topCountries = await getTopCountriesByGDP(5);

    await generateSummaryImage({
      total_countries: metadata.total_countries,
      top_countries: topCountries,
      last_refreshed_at: metadata.last_refreshed_at,
    });

    res.json({
      message: "Countries data refreshed successfully",
      countries_processed: count,
      last_refreshed_at: metadata.last_refreshed_at,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /countries
 * Get all countries from the DB with optional filters and sorting
 */
async function getCountries(req, res, next) {
  try {
    const validatedParams = validateQueryParams(req.query);

    const filters = {};
    if (validatedParams.region) {
      filters.region = validatedParams.region;
    }
    if (validatedParams.currency) {
      filters.currency = validatedParams.currency;
    }

    const countries = await getAllCountries(filters, validatedParams.sort);

    res.json(countries);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /countries/:name
 * Get one country by name
 */
async function getCountry(req, res, next) {
  try {
    const { name } = req.params;

    if (!name || name.trim() === "") {
      throw new AppError("Country name is required", 400);
    }

    const country = await getCountryByName(name);

    if (!country) {
      throw new AppError("Country not found", 404);
    }

    res.json(country);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /countries/:name
 * Delete a country record
 */
async function deleteCountry(req, res, next) {
  try {
    const { name } = req.params;

    if (!name || name.trim() === "") {
      throw new AppError("Country name is required", 400);
    }

    const deleted = await deleteCountryByName(name);

    if (!deleted) {
      throw new AppError("Country not found", 404);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

/**
 * GET /status
 * Show total countries and last refresh timestamp
 */
async function getStatus(req, res, next) {
  try {
    const metadata = await getRefreshMetadata();

    res.json({
      total_countries: metadata.total_countries,
      last_refreshed_at: metadata.last_refreshed_at,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /countries/image
 * Serve the generated summary image
 */
async function getSummaryImage(req, res, next) {
  try {
    const cacheDir = path.join(process.cwd(), process.env.CACHE_DIR || "cache");
    const imagePath = path.join(cacheDir, "summary.png");

    // Check if image exists
    try {
      await fs.access(imagePath);
    } catch (error) {
      throw new AppError("Summary image not found", 404);
    }

    // Serve the image
    res.sendFile(imagePath);
  } catch (error) {
    if (error.statusCode === 404) {
      res.status(404).json({ error: "Summary image not found" });
    } else {
      next(error);
    }
  }
}

module.exports = {
  refreshCountries,
  getCountries,
  getCountry,
  deleteCountry,
  getStatus,
  getSummaryImage,
};
