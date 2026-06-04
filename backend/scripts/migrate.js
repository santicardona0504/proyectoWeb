const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('[migrate] Iniciando...');
  console.log('[migrate] NODE_ENV:', process.env.NODE_ENV);
  console.log('[migrate] DATABASE_URL definida:', !!process.env.DATABASE_URL);

  const DATABASE_URL = process.env.DATABASE_URL;
  const isProduction = process.env.NODE_ENV === 'production';

  const poolConfig = DATABASE_URL
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
      };

  console.log('[migrate] Conectando a PostgreSQL...');
  const pool = new Pool(poolConfig);

  try {
    const client = await pool.connect();
    console.log('[migrate] Conexión exitosa');
    client.release();
  } catch (connErr) {
    console.error('[migrate] ERROR DE CONEXIÓN:', connErr.message);
    console.error('[migrate] Stack:', connErr.stack);
    if (connErr.code === 'ECONNREFUSED') {
      console.error('[migrate] Servidor PostgreSQL no está disponible o la URL es incorrecta');
    } else if (connErr.code === '28P01') {
      console.error('[migrate] Autenticación fallida - usuario/contraseña incorrectos');
    } else if (connErr.code === '3D000') {
      console.error('[migrate] La base de datos no existe');
    } else if (connErr.message?.includes('SSL')) {
      console.error('[migrate] Error SSL - Render requiere conexión SSL');
    }
    await pool.end();
    process.exit(1);
  }

  console.log('[migrate] Verificando tabla pgmigrations...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pgmigrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      run_on TIMESTAMP DEFAULT NOW()
    )
  `);

  const migrationsDir = path.resolve(__dirname, '..', 'migrations');
  console.log('[migrate] Directorio de migraciones:', migrationsDir);

  if (!fs.existsSync(migrationsDir)) {
    console.error('[migrate] ERROR: No se encuentra el directorio de migraciones:', migrationsDir);
    await pool.end();
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  console.log('[migrate] Archivos de migración encontrados:', files.length);

  if (files.length === 0) {
    console.error('[migrate] ERROR: No hay archivos .sql en el directorio de migraciones');
    await pool.end();
    process.exit(1);
  }

  const { rows: ran } = await pool.query('SELECT name FROM pgmigrations');
  const ranNames = new Set(ran.map(r => r.name));
  console.log('[migrate] Migraciones ya aplicadas:', ranNames.size);

  for (const file of files) {
    if (ranNames.has(file)) {
      console.log(`[migrate] Ya aplicada: ${file}`);
      continue;
    }

    console.log(`[migrate] Aplicando: ${file}`);
    const filePath = path.join(migrationsDir, file);

    if (!fs.existsSync(filePath)) {
      console.error(`[migrate] ERROR: Archivo no encontrado: ${filePath}`);
      continue;
    }

    const rawSql = fs.readFileSync(filePath, 'utf8');
    const downMatch = rawSql.match(/^--\s*Down/m);
    const upSql = downMatch ? rawSql.substring(0, downMatch.index).trim() : rawSql.trim();

    try {
      await pool.query(upSql);
    } catch (sqlErr) {
      console.error(`[migrate] ERROR SQL en ${file}:`, sqlErr.message);
      console.error('[migrate] SQL que falló:');
      console.error(upSql.substring(0, 500));
      await pool.end();
      process.exit(1);
    }

    await pool.query('INSERT INTO pgmigrations (name, run_on) VALUES ($1, NOW())', [file]);
    console.log(`[migrate] Completada: ${file}`);
  }

  await pool.end();
  console.log('[migrate] Todas las migraciones aplicadas correctamente.');
}

main().catch((err) => {
  console.error('[migrate] ERROR FATAL:', err.message);
  console.error('[migrate] Stack:', err.stack);
  process.exit(1);
});
