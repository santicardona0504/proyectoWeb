const pool = require('../config/db');
const { success, error } = require('../utils/jsonResponse');
const logger = require('../utils/logger');

async function create(req, res) {
  try {
    const { book_id, nombre_usuario } = req.body;

    if (!book_id || !nombre_usuario) {
      return error(res, 'book_id y nombre_usuario son obligatorios', 400);
    }

    const book = await pool.query('SELECT disponible FROM books WHERE id = $1', [book_id]);
    if (book.rows.length === 0) {
      return error(res, 'Libro no encontrado', 404);
    }
    if (!book.rows[0].disponible) {
      return error(res, 'El libro ya está prestado', 409);
    }

    const result = await pool.query(
      `INSERT INTO prestamos (book_id, nombre_usuario, usuario_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [book_id, nombre_usuario.trim(), req.user?.id || null]
    );

    await pool.query('UPDATE books SET disponible = false WHERE id = $1', [book_id]);

    success(res, result.rows[0], 201);
  } catch (err) {
    logger.error({ err }, 'Error en create loan');
    error(res, 'Error al registrar préstamo', 500);
  }
}

async function returnBook(req, res) {
  try {
    const { id } = req.body;
    if (!id) {
      return error(res, 'id del préstamo es obligatorio', 400);
    }

    const loan = await pool.query(
      `UPDATE prestamos SET estado = 'devuelto', fecha_devolucion = NOW()
       WHERE id = $1 AND estado = 'activo' RETURNING *`,
      [id]
    );

    if (loan.rows.length === 0) {
      return error(res, 'Préstamo no encontrado o ya devuelto', 404);
    }

    await pool.query('UPDATE books SET disponible = true WHERE id = $1', [loan.rows[0].book_id]);

    success(res, loan.rows[0]);
  } catch (err) {
    logger.error({ err }, 'Error en returnBook');
    error(res, 'Error al devolver libro', 500);
  }
}

async function getAll(req, res) {
  try {
    const result = await pool.query(
      `SELECT p.*, b.titulo AS libro_titulo
       FROM prestamos p
       JOIN books b ON b.id = p.book_id
       ORDER BY p.fecha_prestamo DESC`
    );
    success(res, result.rows);
  } catch (err) {
    logger.error({ err }, 'Error en getAll loans');
    error(res, 'Error al obtener préstamos', 500);
  }
}

async function getActive(req, res) {
  try {
    const result = await pool.query(
      `SELECT p.*, b.titulo AS libro_titulo
       FROM prestamos p
       JOIN books b ON b.id = p.book_id
       WHERE p.estado = 'activo'
       ORDER BY p.fecha_prestamo DESC`
    );
    success(res, result.rows);
  } catch (err) {
    logger.error({ err }, 'Error en getActive loans');
    error(res, 'Error al obtener préstamos activos', 500);
  }
}

async function getByUser(req, res) {
  try {
    const { nombre } = req.query;
    if (!nombre) {
      return error(res, 'nombre de usuario es obligatorio', 400);
    }
    const result = await pool.query(
      `SELECT p.*, b.titulo AS libro_titulo
       FROM prestamos p
       JOIN books b ON b.id = p.book_id
       WHERE p.nombre_usuario ILIKE $1
       ORDER BY p.fecha_prestamo DESC`,
      [`%${nombre}%`]
    );
    success(res, result.rows);
  } catch (err) {
    logger.error({ err }, 'Error en getByUser loans');
    error(res, 'Error al obtener préstamos del usuario', 500);
  }
}

module.exports = { create, returnBook, getAll, getActive, getByUser };
