require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function runSeeds(pool) {
  // Control de seeds ya ejecutados
  await pool.query(`
    CREATE TABLE IF NOT EXISTS seedmigrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      run_on TIMESTAMP DEFAULT NOW()
    )
  `);

  const seedsDir = path.join(__dirname, '..', 'seeds');

  if (!fs.existsSync(seedsDir)) {
    throw new Error(`No se encuentra el directorio de seeds: ${seedsDir}`);
  }

  const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort();
  const { rows: ran } = await pool.query('SELECT name FROM seedmigrations');
  const ranNames = new Set(ran.map(r => r.name));

  for (const file of files) {
    if (ranNames.has(file)) {
      console.log(`Seed ya aplicado: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');

    if (sql.trim()) {
      await pool.query(sql);
    }

    await pool.query(
      'INSERT INTO seedmigrations (name, run_on) VALUES ($1, NOW())',
      [file]
    );
    console.log(`Seed aplicado: ${file}`);
  }

  // Manejo del usuario admin
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const { rows: existing } = await pool.query(
    "SELECT password_hash, rol FROM usuarios WHERE email = 'admin@biblioteca.com'"
  );

  if (existing.length === 0) {
    const password_hash = await bcrypt.hash(adminPassword, 10);
    await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES ('Admin', 'admin@biblioteca.com', $1, 'admin')`,
      [password_hash]
    );
    console.log('Usuario admin creado (email: admin@biblioteca.com)');
  } else {
    const user = existing[0];
    const passwordOk = await bcrypt.compare(adminPassword, user.password_hash);

    if (!passwordOk || user.rol !== 'admin') {
      const password_hash = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        `UPDATE usuarios SET rol = 'admin', password_hash = $1 WHERE email = 'admin@biblioteca.com'`,
        [password_hash]
      );
      console.log('Usuario admin actualizado');
    } else {
      console.log('Usuario admin sin cambios');
    }
  }

  console.log('Todos los seeds se ejecutaron correctamente.');
}

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  const isProduction = process.env.NODE_ENV === 'production';

  const pool = DATABASE_URL
    ? new Pool({
        connectionString: DATABASE_URL,
        connectionTimeoutMillis: 10000,
        ...(isProduction ? { ssl: { rejectUnauthorized: false } } : {}),
      })
    : new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_NAME || 'library',
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'admin123',
        connectionTimeoutMillis: 10000,
      });

  try {
    await runSeeds(pool);
  } catch (err) {
    console.error('Error al ejecutar seeds:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { runSeeds };