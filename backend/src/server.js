require('dotenv').config();
const http = require('http');
const router = require('./routes/router');
const { setCorsHeaders, handlePreflight } = require('./middleware/cors');
const { error } = require('./utils/jsonResponse');

const PORT = parseInt(process.env.PORT, 10) || 3000;

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
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
  });
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (handlePreflight(req, res)) return;

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    req.body = await parseBody(req);
  } else {
    req.body = {};
  }

  try {
    await router(req, res);
  } catch (err) {
    console.error('Error no manejado:', err);
    error(res, 'Error interno del servidor', 500);
  }
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
