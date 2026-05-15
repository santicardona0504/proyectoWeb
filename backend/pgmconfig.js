require('dotenv').config();

const {
  DB_USER = 'admin',
  DB_PASSWORD = 'admin123',
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'library',
} = process.env;

const databaseUrl = `postgres://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

module.exports = {
  url: databaseUrl,
};
