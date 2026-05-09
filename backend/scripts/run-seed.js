require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
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

  await pool.end();
  console.log('Todos los seeds se ejecutaron correctamente.');
}

runSeeds().catch((err) => {
  console.error('Error al ejecutar seeds:', err.message);
  process.exit(1);
});
