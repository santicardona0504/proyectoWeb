const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { success, error } = require('../utils/jsonResponse');
const { generateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

async function register(req, res) {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return error(res, 'nombre, email y password son obligatorios', 400);
    }
    if (password.length < 6) {
      return error(res, 'password debe tener al menos 6 caracteres', 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return error(res, 'email inválido', 400);
    }

    const exists = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return error(res, 'El email ya está registrado', 409);
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, email, rol, created_at`,
      [nombre.trim(), email.toLowerCase(), password_hash]
    );

    const user = result.rows[0];
    const token = generateToken({ id: user.id, email: user.email, rol: user.rol });

    success(res, { user, token }, 201);
  } catch (err) {
    logger.error({ err }, 'Error en register');
    error(res, 'Error al registrar usuario', 500);
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'email y password son obligatorios', 400);
    }

    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return error(res, 'Credenciales inválidas', 401);
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return error(res, 'Credenciales inválidas', 401);
    }

    const token = generateToken({ id: user.id, email: user.email, rol: user.rol });
    success(res, {
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
      token
    });
  } catch (err) {
    logger.error({ err }, 'Error en login');
    error(res, 'Error al iniciar sesión', 500);
  }
}

module.exports = { register, login };
