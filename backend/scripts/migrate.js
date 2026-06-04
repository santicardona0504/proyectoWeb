const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool(
  DATABASE_URL
    ? {
        connectionString: DATABASE_URL,
        ...(isProduction ? { ssl: { rejectUnauthorized: false } } : {}),
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_NAME || 'library',
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'admin123',
      }
);

function parseUpSql(sql) {
  const downMatch = sql.match(/^--\s*Down/m);
  if (downMatch) {
    return sql.substring(0, downMatch.index).trim();
  }
  return sql.trim();
}

async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pgmigrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      run_on TIMESTAMP DEFAULT NOW()
    )
  `);

  const migrationsDir = path.resolve(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  const { rows: ran } = await pool.query('SELECT name FROM pgmigrations');
  const ranNames = new Set(ran.map(r => r.name));

  for (const file of files) {
    if (ranNames.has(file)) {
      console.log(`Migración ya aplicada: ${file}`);
      continue;
    }
    console.log(`Aplicando migración: ${file}`);
    const sql = parseUpSql(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
    await pool.query(sql);
    await pool.query('INSERT INTO pgmigrations (name, run_on) VALUES ($1, NOW())', [file]);
    console.log(`Migración completada: ${file}`);
  }

  await pool.end();
  console.log('Todas las migraciones aplicadas correctamente.');
}

runMigrations().catch((err) => {
  console.error('Error al ejecutar migraciones:', err.message);
  process.exit(1);
});
