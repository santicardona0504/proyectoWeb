const { Pool } = require('pg');
const logger = require('../utils/logger');

if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
  logger.fatal(
    'No se encontró configuración de base de datos. ' +
    'Define DATABASE_URL o DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD.'
  );
  process.exit(1);
}

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 10000,
        ...(process.env.NODE_ENV === 'production'
          ? { ssl: { rejectUnauthorized: false } }
          : {}),
      }
    : {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_NAME || 'library',
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'admin123',
        connectionTimeoutMillis: 10000,
      }
);

pool.on('error', (err) => {
  logger.error({ err }, 'Error inesperado en el pool de PostgreSQL');
});

module.exports = pool;
