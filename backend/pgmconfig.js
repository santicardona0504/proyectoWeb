require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL || (() => {
  const {
    DB_USER = 'admin',
    DB_PASSWORD = 'admin123',
    DB_HOST = 'localhost',
    DB_PORT = '5432',
    DB_NAME = 'library',
  } = process.env;
  return `postgres://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
})();

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  url: databaseUrl,
  ...(isProduction ? { ssl: { rejectUnauthorized: false } } : {}),
};
