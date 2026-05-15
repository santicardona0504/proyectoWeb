const pool = require('../config/db');
const { success, error } = require('../utils/jsonResponse');
const logger = require('../utils/logger');

const ALLOWED_FIELDS = ['titulo', 'autor', 'categoria', 'isbn', 'anio', 'disponible'];
const MAX_STR_LENGTH = 255;

function validateISBN(isbn) {
  if (!isbn) return true;
  return /^(?:\d{9}[\dXx]|\d{13}|(?:\d{1,7}-){3,4}[\dX])$/.test(isbn);
}

function validateBookInput(body, requireAll) {
  const errors = [];
  const { titulo, autor, categoria, isbn, anio } = body;

  if (requireAll || titulo !== undefined) {
    if (!titulo || typeof titulo !== 'string' || !titulo.trim()) {
      errors.push('titulo debe ser un texto no vacío');
    } else if (titulo.length > MAX_STR_LENGTH) {
      errors.push(`titulo no debe exceder ${MAX_STR_LENGTH} caracteres`);
    }
  }

  if (requireAll || autor !== undefined) {
    if (!autor || typeof autor !== 'string' || !autor.trim()) {
      errors.push('autor debe ser un texto no vacío');
    } else if (autor.length > MAX_STR_LENGTH) {
      errors.push(`autor no debe exceder ${MAX_STR_LENGTH} caracteres`);
    }
  }

  if (requireAll || categoria !== undefined) {
    if (!categoria || typeof categoria !== 'string' || !categoria.trim()) {
      errors.push('categoria debe ser un texto no vacío');
    } else if (categoria.length > 100) {
      errors.push('categoria no debe exceder 100 caracteres');
    }
  }

  if (isbn !== undefined && isbn !== null && isbn !== '') {
    if (typeof isbn !== 'string' || !validateISBN(isbn)) {
      errors.push('isbn tiene un formato inválido');
    } else if (isbn.length > 20) {
      errors.push('isbn no debe exceder 20 caracteres');
    }
  }

  if (anio !== undefined && anio !== null && anio !== '') {
    const anioNum = parseInt(anio, 10);
    if (isNaN(anioNum) || anioNum < 1000 || anioNum > new Date().getFullYear()) {
      errors.push(`anio debe ser un número entre 1000 y ${new Date().getFullYear()}`);
    }
  }

  return errors;
}

async function getAll(req, res) {
  try {
    const search = req.query?.search || '';
    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit, 10) || 50));
    const offset = (page - 1) * limit;

    if (search) {
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM books WHERE titulo ILIKE $1 OR autor ILIKE $1 OR categoria ILIKE $1',
        [`%${search}%`]
      );
      const total = parseInt(countResult.rows[0].count, 10);
      const result = await pool.query(
        'SELECT * FROM books WHERE titulo ILIKE $1 OR autor ILIKE $1 OR categoria ILIKE $1 ORDER BY id DESC LIMIT $2 OFFSET $3',
        [`%${search}%`, limit, offset]
      );
      success(res, {
        books: result.rows,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } else {
      const countResult = await pool.query('SELECT COUNT(*) FROM books');
      const total = parseInt(countResult.rows[0].count, 10);
      const result = await pool.query(
        'SELECT * FROM books ORDER BY id DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      success(res, {
        books: result.rows,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    }
  } catch (err) {
    logger.error({ err }, 'Error en getAll');
    error(res, 'Error al obtener los libros', 500);
  }
}

async function getStats(req, res) {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE disponible = true) AS available,
              COUNT(*) FILTER (WHERE disponible = false) AS borrowed
       FROM books`
    );
    success(res, result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'Error en getStats');
    error(res, 'Error al obtener estadísticas', 500);
  }
}

async function getById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return error(res, `Libro con id ${id} no encontrado`, 404);
    }
    success(res, result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'Error en getById');
    error(res, 'Error al obtener el libro', 500);
  }
}

async function create(req, res) {
  try {
    const { titulo, autor, categoria, isbn, anio, disponible } = req.body;
    const errors = validateBookInput(req.body, true);

    if (errors.length > 0) {
      return error(res, `Datos inválidos: ${errors.join('. ')}`, 400);
    }

    const result = await pool.query(
      `INSERT INTO books (titulo, autor, categoria, isbn, anio, disponible)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [titulo.trim(), autor.trim(), categoria.trim(), isbn || null, anio || null, disponible !== undefined ? disponible : true]
    );

    success(res, result.rows[0], 201);
  } catch (err) {
    if (err.code === '23505') {
      return error(res, 'El ISBN ya existe en la base de datos', 409);
    }
    logger.error({ err }, 'Error en create');
    error(res, 'Error al crear el libro', 500);
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const { titulo, autor, categoria, isbn, anio, disponible } = req.body;
    const errors = validateBookInput(req.body, true);

    if (errors.length > 0) {
      return error(res, `Datos inválidos: ${errors.join('. ')}`, 400);
    }

    const result = await pool.query(
      `UPDATE books
       SET titulo = $1, autor = $2, categoria = $3, isbn = $4, anio = $5, disponible = $6
       WHERE id = $7
       RETURNING *`,
      [titulo.trim(), autor.trim(), categoria.trim(), isbn || null, anio || null, disponible !== undefined ? disponible : true, id]
    );

    if (result.rows.length === 0) {
      return error(res, `Libro con id ${id} no encontrado`, 404);
    }

    success(res, result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return error(res, 'El ISBN ya existe en la base de datos', 409);
    }
    logger.error({ err }, 'Error en update');
    error(res, 'Error al actualizar el libro', 500);
  }
}

async function patch(req, res) {
  try {
    const { id } = req.params;
    const errors = validateBookInput(req.body, false);
    if (errors.length > 0) {
      return error(res, `Datos inválidos: ${errors.join('. ')}`, 400);
    }

    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(req.body)) {
      if (ALLOWED_FIELDS.includes(key)) {
        const val = (key === 'titulo' || key === 'autor' || key === 'categoria') && typeof value === 'string'
          ? value.trim() : value;
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }

    if (fields.length === 0) {
      return error(res, 'No se enviaron campos válidos para actualizar', 400);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE books SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return error(res, `Libro con id ${id} no encontrado`, 404);
    }

    success(res, result.rows[0]);
  } catch (err) {
    logger.error({ err }, 'Error en patch');
    error(res, 'Error al actualizar el libro', 500);
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return error(res, `Libro con id ${id} no encontrado`, 404);
    }
    success(res, { mensaje: `Libro "${result.rows[0].titulo}" eliminado correctamente` });
  } catch (err) {
    logger.error({ err }, 'Error en remove');
    error(res, 'Error al eliminar el libro', 500);
  }
}

module.exports = { getAll, getById, create, update, patch, remove, getStats };
