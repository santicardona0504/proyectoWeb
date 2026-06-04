const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ...(process.env.NODE_ENV === 'production'
          ? { ssl: { rejectUnauthorized: false } }
          : {}),
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_NAME || 'library',
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'admin123',
      }
);

pool.on('error', (err) => {
  logger.error({ err }, 'Error inesperado en el pool de PostgreSQL');
});

module.exports = pool;
