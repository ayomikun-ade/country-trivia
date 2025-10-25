const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'country_trivia',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection and create database if it doesn't exist
async function initializeDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'country_trivia'}`);
    await connection.end();

    // Create tables
    await createTables();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error.message);
    throw error;
  }
}

async function createTables() {
  const createCountriesTable = `
    CREATE TABLE IF NOT EXISTS countries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      capital VARCHAR(255),
      region VARCHAR(100),
      population BIGINT NOT NULL,
      currency_code VARCHAR(10),
      exchange_rate DECIMAL(20, 6),
      estimated_gdp DECIMAL(30, 2),
      flag_url TEXT,
      last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_name (name),
      INDEX idx_region (region),
      INDEX idx_currency_code (currency_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createMetadataTable = `
    CREATE TABLE IF NOT EXISTS refresh_metadata (
      id INT AUTO_INCREMENT PRIMARY KEY,
      last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      total_countries INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.query(createCountriesTable);
    await pool.query(createMetadataTable);

    // Initialize metadata if not exists
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM refresh_metadata');
    if (rows[0].count === 0) {
      await pool.query('INSERT INTO refresh_metadata (total_countries) VALUES (0)');
    }
  } catch (error) {
    console.error('Error creating tables:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  initializeDatabase
};
