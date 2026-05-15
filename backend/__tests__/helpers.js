require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const router = require('../src/routes/router');
const { error } = require('../src/utils/jsonResponse');
const { Pool } = require('pg');

function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
  app.use(router);
  app.use((_req, res) => error(res, 'Ruta no encontrada', 404));
  return app;
}

function createTestPool() {
  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'library_test',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'admin123',
  });
}

module.exports = { createApp, createTestPool };
