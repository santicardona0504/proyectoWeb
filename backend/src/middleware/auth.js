const jwt = require('jsonwebtoken');
const { error } = require('../utils/jsonResponse');

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!REFRESH_SECRET) {
  const logger = require('../utils/logger');
  logger.fatal('REFRESH_SECRET no está definido en las variables de entorno');
  process.exit(1);
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

function setTokenCookies(res, accessToken, refreshToken) {
  res.cookie('access_token', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refresh_token', refreshToken, {
    ...COOKIE_OPTIONS,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearTokenCookies(res) {
  res.clearCookie('access_token', { ...COOKIE_OPTIONS });
  res.clearCookie('refresh_token', { ...COOKIE_OPTIONS, path: '/' });
}

function verifyToken(req, res, next) {
  const accessToken = req.cookies?.access_token;

  if (accessToken) {
    try {
      req.user = jwt.verify(accessToken, JWT_SECRET);
      return next();
    } catch {
      // access token expired or invalid, try refresh
    }
  }

  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) {
    return error(res, 'Token de autenticación requerido', 401);
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const payload = { id: decoded.id, email: decoded.email, rol: decoded.rol };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    res.cookie('access_token', newAccessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', newRefreshToken, {
      ...COOKIE_OPTIONS,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    req.user = decoded;
    next();
  } catch {
    clearTokenCookies(res);
    return error(res, 'Sesión expirada. Iniciá sesión nuevamente.', 401);
  }
}

function optionalAuth(req, res, next) {
  const accessToken = req.cookies?.access_token;
  if (accessToken) {
    try {
      req.user = jwt.verify(accessToken, JWT_SECRET);
      return next();
    } catch {
      // ignore
    }
  }

  const refreshToken = req.cookies?.refresh_token;
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
      const payload = { id: decoded.id, email: decoded.email, rol: decoded.rol };
      const newAccessToken = generateAccessToken(payload);
      const newRefreshToken = generateRefreshToken(payload);
      res.cookie('access_token', newAccessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      });
      res.cookie('refresh_token', newRefreshToken, {
        ...COOKIE_OPTIONS,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      req.user = decoded;
    } catch {
      // ignore
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

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  setTokenCookies,
  clearTokenCookies,
  verifyToken,
  optionalAuth,
  requireRole,
};
