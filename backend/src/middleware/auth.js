const jwt = require('jsonwebtoken');
const { error } = require('../utils/jsonResponse');

const JWT_SECRET = process.env.JWT_SECRET || 'biblioteca-secret-dev';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

function verifyToken(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return error(res, 'Token de autenticación requerido', 401);
  }

  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return error(res, 'Token inválido o expirado', 401);
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    } catch {
      // ignore invalid token
    }
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Token de autenticación requerido', 401);
    }
    if (!roles.includes(req.user.rol)) {
      return error(res, 'No tenés permisos para realizar esta acción', 403);
    }
    next();
  };
}

module.exports = { generateToken, verifyToken, optionalAuth, requireRole, JWT_SECRET };
