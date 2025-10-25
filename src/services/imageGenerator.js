const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

/**
 * Generate summary image with country statistics
 * @param {Object} data - Data to display in the image
 * @param {number} data.total_countries - Total number of countries
 * @param {Array} data.top_countries - Top 5 countries by GDP
 * @param {Date} data.last_refreshed_at - Last refresh timestamp
 * @returns {Promise<string>} - Path to the generated image
 */
async function generateSummaryImage(data) {
  const { total_countries, top_countries, last_refreshed_at } = data;

  // Canvas dimensions
  const width = 800;
  const height = 600;

  // Create SVG
  const svg = generateSVG(total_countries, top_countries, last_refreshed_at, width, height);

  // Convert SVG to PNG using Sharp
  const cacheDir = path.join(process.cwd(), process.env.CACHE_DIR || 'cache');
  await ensureDirectoryExists(cacheDir);

  const imagePath = path.join(cacheDir, 'summary.png');

  await sharp(Buffer.from(svg))
    .png()
    .toFile(imagePath);

  return imagePath;
}

/**
 * Generate SVG markup for the summary image
 * @param {number} totalCountries - Total number of countries
 * @param {Array} topCountries - Top 5 countries by GDP
 * @param {Date} lastRefreshed - Last refresh timestamp
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} - SVG markup
 */
function generateSVG(totalCountries, topCountries, lastRefreshed, width, height) {
  const timestamp = new Date(lastRefreshed).toISOString();

  let countriesHTML = '';
  let yPosition = 250;

  topCountries.forEach((country, index) => {
    const gdpFormatted = formatGDP(country.estimated_gdp);

    countriesHTML += `
      <text x="100" y="${yPosition}" fill="#ffd700" font-size="24" font-weight="bold">${index + 1}.</text>
      <text x="140" y="${yPosition}" fill="#ffffff" font-size="20">${escapeXml(country.name)}</text>
      <text x="140" y="${yPosition + 25}" fill="#00d9ff" font-size="18">GDP: $${gdpFormatted}</text>
    `;

    yPosition += 65;
  });

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bgGradient)" />

      <!-- Title -->
      <text x="${width / 2}" y="60" fill="#ffffff" font-size="36" font-weight="bold" text-anchor="middle" font-family="Arial, sans-serif">
        Country Trivia Summary
      </text>

      <!-- Total Countries -->
      <text x="${width / 2}" y="120" fill="#00d9ff" font-size="24" text-anchor="middle" font-family="Arial, sans-serif">
        Total Countries: ${totalCountries}
      </text>

      <!-- Divider Line -->
      <line x1="100" y1="150" x2="${width - 100}" y2="150" stroke="#00d9ff" stroke-width="2" />

      <!-- Top 5 Header -->
      <text x="${width / 2}" y="200" fill="#ffffff" font-size="28" font-weight="bold" text-anchor="middle" font-family="Arial, sans-serif">
        Top 5 Countries by Estimated GDP
      </text>

      <!-- Countries List -->
      <g font-family="Arial, sans-serif">
        ${countriesHTML}
      </g>

      <!-- Timestamp -->
      <text x="${width / 2}" y="${height - 30}" fill="#888888" font-size="16" text-anchor="middle" font-family="Arial, sans-serif">
        Last refreshed: ${timestamp}
      </text>
    </svg>
  `;
}

/**
 * Escape XML special characters
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format GDP value for display
 * @param {number} gdp - GDP value
 * @returns {string} - Formatted GDP string
 */
function formatGDP(gdp) {
  if (!gdp) return '0';

  if (gdp >= 1e12) {
    return (gdp / 1e12).toFixed(2) + 'T';
  } else if (gdp >= 1e9) {
    return (gdp / 1e9).toFixed(2) + 'B';
  } else if (gdp >= 1e6) {
    return (gdp / 1e6).toFixed(2) + 'M';
  } else if (gdp >= 1e3) {
    return (gdp / 1e3).toFixed(2) + 'K';
  }
  return gdp.toFixed(2);
}

/**
 * Ensure directory exists, create if it doesn't
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

module.exports = {
  generateSummaryImage
};
