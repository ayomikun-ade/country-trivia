const express = require('express');
const router = express.Router();
const {
  refreshCountries,
  getCountries,
  getCountry,
  deleteCountry,
  getStatus,
  getSummaryImage
} = require('../controllers/countryController');

// POST /countries/refresh - Refresh country data from external APIs
router.post('/refresh', refreshCountries);

// GET /countries/image - Serve summary image (must be before /:name to avoid conflict)
router.get('/image', getSummaryImage);

// GET /countries - Get all countries with optional filters
router.get('/', getCountries);

// GET /countries/:name - Get single country by name
router.get('/:name', getCountry);

// DELETE /countries/:name - Delete country by name
router.delete('/:name', deleteCountry);

module.exports = router;
