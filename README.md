# Country Trivia API

A RESTful API that fetches country data from external APIs, processes exchange rates, calculates estimated GDP, stores data in MySQL, and provides comprehensive CRUD operations with image generation capabilities.

## Features

- Fetch country data from [REST Countries API](https://restcountries.com)
- Fetch real-time exchange rates from [Exchange Rate API](https://open.er-api.com)
- Calculate estimated GDP based on population and exchange rates
- Store and cache data in MySQL database
- Filter countries by region and currency
- Sort countries by GDP, population, or name
- Generate visual summary images with top countries
- Comprehensive error handling and validation
- RESTful API design with JSON responses

## Prerequisites

Before running this project, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MySQL](https://www.mysql.com/) (v5.7 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository or navigate to the project directory:

```bash
cd country-trivia
```

2. Install dependencies:

```bash
npm install
```

3. Configure the database:

   - Make sure MySQL is running
   - Update the `.env` file with your MySQL credentials:

   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=country_trivia
   DB_PORT=3306
   ```

4. The application will automatically create the database and tables on first run.

## Configuration

Edit the `.env` file to customize settings:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=country_trivia
DB_PORT=3306

# External APIs (default values provided)
COUNTRIES_API_URL=https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies
EXCHANGE_RATE_API_URL=https://open.er-api.com/v6/latest/USD

# Cache Directory
CACHE_DIR=cache
```

## Running the Application

### Development Mode (with auto-reload):

```bash
npm run dev
```

### Production Mode:

```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`)

## API Endpoints

### 1. Refresh Country Data

**POST** `/countries/refresh`

Fetches country data and exchange rates from external APIs, processes them, and caches in the database. Also generates a summary image.

**Response:**

```json
{
  "message": "Countries data refreshed successfully",
  "countries_processed": 250,
  "last_refreshed_at": "2025-10-22T18:00:00.000Z"
}
```

**Error Response (503):**

```json
{
  "error": "External data source unavailable",
  "details": "Could not fetch data from Countries API"
}
```

### 2. Get All Countries

**GET** `/countries`

Retrieve all countries with optional filtering and sorting.

**Query Parameters:**

- `region` - Filter by region (e.g., `?region=Africa`)
- `currency` - Filter by currency code (e.g., `?currency=NGN`)
- `sort` - Sort results:
  - `gdp_desc` - Sort by GDP descending
  - `gdp_asc` - Sort by GDP ascending
  - `population_desc` - Sort by population descending
  - `population_asc` - Sort by population ascending
  - `name_asc` - Sort by name A-Z
  - `name_desc` - Sort by name Z-A

**Example:**

```bash
GET /countries?region=Africa&sort=gdp_desc
```

**Response:**

```json
[
  {
    "id": 1,
    "name": "Nigeria",
    "capital": "Abuja",
    "region": "Africa",
    "population": 206139589,
    "currency_code": "NGN",
    "exchange_rate": 1600.23,
    "estimated_gdp": 25767448125.2,
    "flag_url": "https://flagcdn.com/ng.svg",
    "last_refreshed_at": "2025-10-22T18:00:00.000Z"
  }
]
```

### 3. Get Single Country

**GET** `/countries/:name`

Get a specific country by name (case-insensitive).

**Example:**

```bash
GET /countries/Nigeria
```

**Response:**

```json
{
  "id": 1,
  "name": "Nigeria",
  "capital": "Abuja",
  "region": "Africa",
  "population": 206139589,
  "currency_code": "NGN",
  "exchange_rate": 1600.23,
  "estimated_gdp": 25767448125.2,
  "flag_url": "https://flagcdn.com/ng.svg",
  "last_refreshed_at": "2025-10-22T18:00:00.000Z"
}
```

**Error Response (404):**

```json
{
  "error": "Country not found"
}
```

### 4. Delete Country

**DELETE** `/countries/:name`

Delete a country record from the database.

**Example:**

```bash
DELETE /countries/Nigeria
```

**Response**:

- `204 No Content`: The Country was successfully deleted.

**Error Response (404):**

```json
{
  "error": "Country not found"
}
```

### 5. Get Status

**GET** `/status`

Get system status including total countries and last refresh timestamp.

**Response:**

```json
{
  "total_countries": 250,
  "last_refreshed_at": "2025-10-22T18:00:00.000Z"
}
```

### 6. Get Summary Image

**GET** `/countries/image`

Serves the generated summary image showing total countries, top 5 by GDP, and last refresh time.

**Response:**

- Returns PNG image file

**Error Response (404):**

```json
{
  "error": "Summary image not found"
}
```

## Database Schema

### Countries Table

```sql
CREATE TABLE countries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  capital VARCHAR(255),
  region VARCHAR(100),
  population BIGINT NOT NULL,
  currency_code VARCHAR(10),
  exchange_rate DECIMAL(20, 6),
  estimated_gdp DECIMAL(30, 2),
  flag_url TEXT,
  last_refreshed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Refresh Metadata Table

```sql
CREATE TABLE refresh_metadata (
  id INT AUTO_INCREMENT PRIMARY KEY,
  last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_countries INT DEFAULT 0
);
```

## Data Processing Logic

### Currency Handling

1. **Multiple currencies**: Only the first currency code is stored
2. **No currencies**: `currency_code`, `exchange_rate` set to `null`, `estimated_gdp` set to `0`
3. **Currency not in exchange rates**: `exchange_rate` and `estimated_gdp` set to `null`

### GDP Calculation

```
estimated_gdp = (population × random(1000-2000)) ÷ exchange_rate
```

A fresh random multiplier (1000-2000) is generated on each refresh for each country.

### Update vs Insert

- Countries are matched by name (case-insensitive)
- Existing countries are updated with fresh data
- New countries are inserted
- Each refresh recalculates all fields including GDP

## Error Handling

All errors return consistent JSON responses:

- **400 Bad Request**: Validation errors
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server errors
- **503 Service Unavailable**: External API failures

**Example Validation Error:**

```json
{
  "error": "Validation failed",
  "details": {
    "currency_code": "is required"
  }
}
```

## Project Structure

```
country-trivia/
├── src/
│   ├── config/
│   │   └── database.js          # Database connection and initialization
│   ├── controllers/
│   │   └── countryController.js # Request handlers
│   ├── middleware/
│   │   ├── errorHandler.js      # Error handling middleware
│   │   └── validator.js         # Validation functions
│   ├── routes/
│   │   ├── countryRoutes.js     # Country endpoints
│   │   └── statusRoutes.js      # Status endpoint
│   ├── services/
│   │   ├── countryService.js    # Database operations
│   │   ├── dataProcessor.js     # Data processing logic
│   │   ├── externalApi.js       # External API calls
│   │   └── imageGenerator.js    # Image generation
│   └── index.js                 # Application entry point
├── cache/                       # Generated images
├── .env                         # Environment configuration
├── .env.example                 # Environment template
├── .gitignore
├── package.json
└── README.md
```

## Testing the API

### Using cURL

1. **Refresh data:**

```bash
curl -X POST http://localhost:3000/countries/refresh
```

2. **Get all countries:**

```bash
curl http://localhost:3000/countries
```

3. **Filter by region:**

```bash
curl "http://localhost:3000/countries?region=Africa"
```

4. **Get specific country:**

```bash
curl http://localhost:3000/countries/Nigeria
```

5. **Delete country:**

```bash
curl -X DELETE http://localhost:3000/countries/Nigeria
```

6. **Get status:**

```bash
curl http://localhost:3000/status
```

7. **Download summary image:**

```bash
curl http://localhost:3000/countries/image --output summary.png
```

### Using Postman or Thunder Client

Import the following collection or manually create requests:

- Base URL: `http://localhost:3000`
- Set headers: `Content-Type: application/json`

## Dependencies

- **express**: Web framework
- **mysql2**: MySQL database driver with Promise support
- **dotenv**: Environment variable management
- **axios**: HTTP client for external API calls
- **canvas**: Image generation library
- **nodemon**: Development auto-reload (dev dependency)

## Troubleshooting

### Database Connection Issues

- Ensure MySQL is running
- Verify credentials in `.env`
- Check if the database user has proper permissions

### External API Errors

- Check internet connection
- External APIs may have rate limits
- Verify API URLs in `.env`

### Image Generation Issues

- Ensure the `cache` directory is writable
- On Linux, you may need to install additional dependencies for `canvas`:
  ```bash
  sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
  ```

### Port Already in Use

Change the `PORT` value in `.env` to an available port.

## License

ISC

## Support

For issues or questions, please create an issue in the repository.
