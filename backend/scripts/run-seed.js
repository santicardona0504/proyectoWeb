require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ...(process.env.NODE_ENV === 'production'
        ? { ssl: { rejectUnauthorized: false } }
        : {}),
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      database: process.env.DB_NAME || 'library',
      user: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || 'admin123',
    });

async function runSeeds() {
  const seedsDir = path.join(__dirname, '..', 'seeds');
  const files = fs.readdirSync(seedsDir).sort();

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
    await pool.query(sql);
    console.log(`Seed aplicado: ${file}`);
  }

  const adminExists = await pool.query(
    "SELECT id FROM usuarios WHERE email = 'admin@biblioteca.com'"
  );

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const password_hash = await bcrypt.hash(adminPassword, 10);

  if (adminExists.rows.length === 0) {
    await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES ('Admin', 'admin@biblioteca.com', $1, 'admin')`,
      [password_hash]
    );
    console.log(`Usuario admin creado (email: admin@biblioteca.com, password: ${adminPassword})`);
  } else {
    await pool.query(
      `UPDATE usuarios SET rol = 'admin', password_hash = $1 WHERE email = 'admin@biblioteca.com' AND (rol != 'admin' OR password_hash != $1)`,
      [password_hash]
    );
    console.log(`Usuario admin verificado (email: admin@biblioteca.com)`);
  }

  await pool.end();
  console.log('Todos los seeds se ejecutaron correctamente.');
}

runSeeds().catch((err) => {
  console.error('Error al ejecutar seeds:', err.message);
  process.exit(1);
});
