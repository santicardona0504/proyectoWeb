require('dotenv').config();
const http = require('http');
const router = require('./routes/router');
const { setCorsHeaders, handlePreflight } = require('./middleware/cors');
const rateLimiter = require('./middleware/rateLimiter');
const { error } = require('./utils/jsonResponse');
const logger = require('./utils/logger');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const MAX_BODY_SIZE = 1024 * 1024; // 1MB

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        req.destroy();
        return reject(new Error('Body excede el límite de 1MB'));
      }
      body += chunk.toString();
    });

    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });

    req.on('error', () => resolve({}));
  });
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (handlePreflight(req, res)) return;

  rateLimiter(req, res);
  if (res.headersSent) return;

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
      return error(res, 'Content-Type debe ser application/json', 415);
    }
    try {
      req.body = await parseBody(req);
    } catch {
      return error(res, 'Body demasiado grande (máx 1MB)', 413);
    }
  } else {
    req.body = {};
  }

  try {
    await router(req, res);
  } catch (err) {
    logger.error({ err }, 'Error no manejado');
    error(res, 'Error interno del servidor', 500);
  }
});

server.listen(PORT, () => {
  logger.info({ port: PORT }, 'Servidor iniciado');
});
