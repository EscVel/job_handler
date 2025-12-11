require('dotenv').config();
const { Pool } = require('pg');

// define connection details
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD, // Successfully loads 'worker_pass_123'
  port: parseInt(process.env.DB_PORT, 10), // Port should be parsed as an integer
});

// Verification: Try to connect immediately to catch errors early
pool.connect((err) => {
  if (err) {
    console.error('Connection error', err.stack);
  } else {
    console.log('Connected to PostgreSQL successfully');
  }
});

module.exports = {
  // We export a query function that logs every query (optional but good for debugging)
  query: (text, params) => pool.query(text, params),
};