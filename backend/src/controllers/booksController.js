const pool = require('../config/db');
const { success, error } = require('../utils/jsonResponse');

async function getAll(req, res) {
  try {
    const result = await pool.query('SELECT * FROM books ORDER BY id');
    success(res, result.rows);
  } catch (err) {
    console.error('Error en getAll:', err.message);
    error(res, 'Error al obtener los libros de la base de datos', 500);
  }
}

async function getById(req, res, id) {
  try {
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return error(res, `Libro con id ${id} no encontrado`, 404);
    }
    success(res, result.rows[0]);
  } catch (err) {
    console.error('Error en getById:', err.message);
    error(res, 'Error al obtener el libro', 500);
  }
}

async function create(req, res) {
  try {
    const { titulo, autor, categoria, isbn, anio, disponible } = req.body;

    if (!titulo || !autor || !categoria) {
      return error(res, 'Los campos titulo, autor y categoria son obligatorios', 400);
    }

    const result = await pool.query(
      `INSERT INTO books (titulo, autor, categoria, isbn, anio, disponible)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [titulo, autor, categoria, isbn || null, anio || null, disponible !== undefined ? disponible : true]
    );

    success(res, result.rows[0], 201);
  } catch (err) {
    console.error('Error en create:', err.message);
    error(res, 'Error al crear el libro', 500);
  }
}

async function update(req, res, id) {
  try {
    const { titulo, autor, categoria, isbn, anio, disponible } = req.body;

    if (!titulo || !autor || !categoria) {
      return error(res, 'Los campos titulo, autor y categoria son obligatorios', 400);
    }

    const result = await pool.query(
      `UPDATE books
       SET titulo = $1, autor = $2, categoria = $3, isbn = $4, anio = $5, disponible = $6
       WHERE id = $7
       RETURNING *`,
      [titulo, autor, categoria, isbn || null, anio || null, disponible !== undefined ? disponible : true, id]
    );

    if (result.rows.length === 0) {
      return error(res, `Libro con id ${id} no encontrado`, 404);
    }

    success(res, result.rows[0]);
  } catch (err) {
    console.error('Error en update:', err.message);
    error(res, 'Error al actualizar el libro', 500);
  }
}

async function patch(req, res, id) {
  try {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(req.body)) {
      const allowed = ['titulo', 'autor', 'categoria', 'isbn', 'anio', 'disponible'];
      if (allowed.includes(key)) {
        fields.push(`${key} = $${idx++}`);
        values.push(value);
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
    console.error('Error en patch:', err.message);
    error(res, 'Error al actualizar el libro', 500);
  }
}

async function remove(req, res, id) {
  try {
    const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return error(res, `Libro con id ${id} no encontrado`, 404);
    }
    success(res, { mensaje: `Libro "${result.rows[0].titulo}" eliminado correctamente` });
  } catch (err) {
    console.error('Error en remove:', err.message);
    error(res, 'Error al eliminar el libro', 500);
  }
}

module.exports = { getAll, getById, create, update, patch, remove };
