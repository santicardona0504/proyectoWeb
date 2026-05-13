function getAllowedOrigin() {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    return process.env.CORS_ORIGIN || 'https://tudominio.com';
  }
  return '*';
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', getAllowedOrigin());
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
}

module.exports = { setCorsHeaders, handlePreflight };
