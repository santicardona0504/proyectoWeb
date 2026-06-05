const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { success, error } = require('../utils/jsonResponse');
const logger = require('../utils/logger');

async function getAll(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, rol, created_at FROM usuarios ORDER BY created_at DESC'
    );
    success(res, { users: result.rows });
  } catch (err) {
    logger.error({ err }, 'Error al listar usuarios');
    error(res, 'Error al obtener usuarios', 500);
  }
}

async function getById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, nombre, email, rol, created_at FROM usuarios WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return error(res, 'Usuario no encontrado', 404);
    }
    success(res, { user: result.rows[0] });
  } catch (err) {
    logger.error({ err }, 'Error al obtener usuario');
    error(res, 'Error al obtener usuario', 500);
  }
}

async function updateRole(req, res) {
  try {
    const { id } = req.params;
    const { rol } = req.body;
    if (!rol || !['admin', 'bibliotecario', 'usuario'].includes(rol)) {
      return error(res, 'Rol inválido. Debe ser: admin, bibliotecario o usuario', 400);
    }

    if (req.user.id === parseInt(id, 10) && rol !== 'admin') {
      return error(res, 'No puedes cambiarte el rol a ti mismo', 400);
    }

    const result = await pool.query(
      'UPDATE usuarios SET rol = $1 WHERE id = $2 RETURNING id, nombre, email, rol, created_at',
      [rol, id]
    );
    if (result.rows.length === 0) {
      return error(res, 'Usuario no encontrado', 404);
    }
    success(res, { user: result.rows[0] });
  } catch (err) {
    logger.error({ err }, 'Error al actualizar rol');
    error(res, 'Error al actualizar rol', 500);
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;

    if (req.user.id === parseInt(id, 10)) {
      return error(res, 'No puedes eliminarte a ti mismo', 400);
    }

    const result = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING id, nombre, email',
      [id]
    );
    if (result.rows.length === 0) {
      return error(res, 'Usuario no encontrado', 404);
    }
    success(res, { message: 'Usuario eliminado correctamente' });
  } catch (err) {
    logger.error({ err }, 'Error al eliminar usuario');
    error(res, 'Error al eliminar usuario', 500);
  }
}

async function resetPassword(req, res) {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || password.length < 6) {
      return error(res, 'La contraseña debe tener al menos 6 caracteres', 400);
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'UPDATE usuarios SET password_hash = $1 WHERE id = $2 RETURNING id, nombre, email, rol',
      [password_hash, id]
    );
    if (result.rows.length === 0) {
      return error(res, 'Usuario no encontrado', 404);
    }
    success(res, { message: 'Contraseña restablecida correctamente' });
  } catch (err) {
    logger.error({ err }, 'Error al restablecer contraseña');
    error(res, 'Error al restablecer contraseña', 500);
  }
}

module.exports = { getAll, getById, updateRole, remove, resetPassword };
