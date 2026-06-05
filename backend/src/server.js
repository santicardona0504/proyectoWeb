require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const router = require('./routes/router');
const setupSwagger = require('./config/swagger');
const { error } = require('./utils/jsonResponse');
const logger = require('./utils/logger');

if (!process.env.JWT_SECRET) {
  logger.fatal('JWT_SECRET no está definido en las variables de entorno');
  process.exit(1);
}

const PORT = parseInt(process.env.PORT, 10) || 3000;
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGIN || `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`)
    : 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiadas peticiones. Intenta de nuevo en 1 minuto.' },
});
app.use(limiter);

app.use(cookieParser());

app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) &&
      (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json'))) {
    return error(res, 'Content-Type debe ser application/json', 415);
  }
  next();
});

app.use(express.json({ limit: '1mb' }));

app.use((err, _req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return error(res, 'JSON inválido en el body', 400);
  }
  if (err.type === 'entity.too.large') {
    return error(res, 'Body demasiado grande (máx 1MB)', 413);
  }
  next(err);
});

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
});

setupSwagger(app);

app.use(router);

app.use(express.static(PUBLIC_DIR, {
  index: false,
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
}));

app.get('/{*path}', (req, res) => {
  const apiPatterns = ['/auth', '/books', '/loans', '/users', '/health', '/api-docs'];
  if (apiPatterns.some(p => req.path.startsWith(p)) || path.extname(req.path)) {
    return error(res, 'Ruta no encontrada', 404);
  }
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    error(res, 'Frontend no disponible — ejecutá npm run build primero', 503);
  }
});

app.use((err, _req, res, _next) => {
  logger.error({ err }, 'Error no manejado');
  error(res, 'Error interno del servidor', 500);
});

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Servidor iniciado');
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido, cerrando servidor');
  server.close(() => process.exit(0));
});
