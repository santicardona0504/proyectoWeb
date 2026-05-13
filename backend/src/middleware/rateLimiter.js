const logger = require('../utils/logger');

const requestCounts = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;

function rateLimiter(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }

  const timestamps = requestCounts.get(ip).filter(ts => now - ts < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    logger.warn({ ip }, 'Rate limit excedido');
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Demasiadas peticiones. Intenta de nuevo en 1 minuto.' }));
    return;
  }

  timestamps.push(now);
  requestCounts.set(ip, timestamps);
}

module.exports = rateLimiter;
