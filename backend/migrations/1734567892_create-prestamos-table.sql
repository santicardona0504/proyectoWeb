-- Up
CREATE TABLE IF NOT EXISTS prestamos (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  nombre_usuario VARCHAR(255) NOT NULL,
  fecha_prestamo TIMESTAMP DEFAULT NOW(),
  fecha_devolucion TIMESTAMP,
  estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'devuelto'))
);

-- Down
DROP TABLE IF EXISTS prestamos;
