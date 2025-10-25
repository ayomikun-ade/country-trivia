const express = require('express');
const router = express.Router();
const { getStatus } = require('../controllers/countryController');

// GET /status - Get system status
router.get('/', getStatus);

module.exports = router;
