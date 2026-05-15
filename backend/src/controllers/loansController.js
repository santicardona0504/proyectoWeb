const pool = require('../config/db');
const { success, error } = require('../utils/jsonResponse');
const logger = require('../utils/logger');

async function create(req, res) {
  const client = await pool.connect();
  try {
    const { book_id, nombre_usuario } = req.body;

    if (!book_id || !nombre_usuario) {
      return error(res, 'book_id y nombre_usuario son obligatorios', 400);
    }

    await client.query('BEGIN');

    const book = await client.query(
      'SELECT id, disponible FROM books WHERE id = $1 FOR UPDATE',
      [book_id]
    );

    if (book.rows.length === 0) {
      await client.query('ROLLBACK');
      return error(res, 'Libro no encontrado', 404);
    }

    if (!book.rows[0].disponible) {
      await client.query('ROLLBACK');
      return error(res, 'El libro ya está prestado', 409);
    }

    const result = await client.query(
      `INSERT INTO prestamos (book_id, nombre_usuario, usuario_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [book_id, nombre_usuario.trim(), req.user?.id || null]
    );

    await client.query('UPDATE books SET disponible = false WHERE id = $1', [book_id]);

    await client.query('COMMIT');

    success(res, result.rows[0], 201);
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, 'Error en create loan');
    error(res, 'Error al registrar préstamo', 500);
  } finally {
    client.release();
  }
}

async function returnBook(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.body;
    if (!id) {
      return error(res, 'id del préstamo es obligatorio', 400);
    }

    await client.query('BEGIN');

    const loan = await client.query(
      `UPDATE prestamos SET estado = 'devuelto', fecha_devolucion = NOW()
       WHERE id = $1 AND estado = 'activo' RETURNING *`,
      [id]
    );

    if (loan.rows.length === 0) {
      await client.query('ROLLBACK');
      return error(res, 'Préstamo no encontrado o ya devuelto', 404);
    }

    await client.query('UPDATE books SET disponible = true WHERE id = $1', [loan.rows[0].book_id]);

    await client.query('COMMIT');

    success(res, loan.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, 'Error en returnBook');
    error(res, 'Error al devolver libro', 500);
  } finally {
    client.release();
  }
}

async function getAll(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM prestamos');
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
      `SELECT p.*, b.titulo AS libro_titulo
       FROM prestamos p
       JOIN books b ON b.id = p.book_id
       ORDER BY p.fecha_prestamo DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    success(res, {
      loans: result.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error({ err }, 'Error en getAll loans');
    error(res, 'Error al obtener préstamos', 500);
  }
}

async function getActive(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      "SELECT COUNT(*) FROM prestamos WHERE estado = 'activo'"
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
      `SELECT p.*, b.titulo AS libro_titulo
       FROM prestamos p
       JOIN books b ON b.id = p.book_id
       WHERE p.estado = 'activo'
       ORDER BY p.fecha_prestamo DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    success(res, {
      loans: result.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
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

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM prestamos WHERE nombre_usuario ILIKE $1',
      [`%${nombre}%`]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await pool.query(
      `SELECT p.*, b.titulo AS libro_titulo
       FROM prestamos p
       JOIN books b ON b.id = p.book_id
       WHERE p.nombre_usuario ILIKE $1
       ORDER BY p.fecha_prestamo DESC
       LIMIT $2 OFFSET $3`,
      [`%${nombre}%`, limit, offset]
    );

    success(res, {
      loans: result.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error({ err }, 'Error en getByUser loans');
    error(res, 'Error al obtener préstamos del usuario', 500);
  }
}

module.exports = { create, returnBook, getAll, getActive, getByUser };
