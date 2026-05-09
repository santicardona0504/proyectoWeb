-- Up
CREATE TABLE IF NOT EXISTS books (
  id         SERIAL PRIMARY KEY,
  titulo     VARCHAR(255) NOT NULL,
  autor      VARCHAR(255) NOT NULL,
  categoria  VARCHAR(100) NOT NULL,
  isbn       VARCHAR(20),
  anio       INTEGER,
  disponible BOOLEAN DEFAULT true
);

-- Down
DROP TABLE IF EXISTS books;
