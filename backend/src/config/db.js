const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'library',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin123',
});

pool.on('error', (err) => {
  logger.error({ err }, 'Error inesperado en el pool de PostgreSQL');
});

module.exports = pool;
