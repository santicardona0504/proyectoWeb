const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function sanitizeUrl(url) {
  if (!url) return '(no definida)';
  return url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}

function getHostFromUrl(url) {
  try {
    const match = url.match(/@([^:]+)/);
    return match ? match[1] : '(no se pudo extraer)';
  } catch {
    return '(error al parsear)';
  }
}

async function main() {
  console.log('[migrate] ========================================');
  console.log('[migrate] Iniciando migraciones...');
  console.log('[migrate] ========================================');
  console.log('[migrate] NODE_ENV:', process.env.NODE_ENV);
  console.log('[migrate] DATABASE_URL presente:', !!process.env.DATABASE_URL);

  if (process.env.DATABASE_URL) {
    console.log('[migrate] Host extraído de DATABASE_URL:', getHostFromUrl(process.env.DATABASE_URL));
    console.log('[migrate] DATABASE_URL (oculta):', sanitizeUrl(process.env.DATABASE_URL));
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  const isProduction = process.env.NODE_ENV === 'production';

  const poolConfig = DATABASE_URL
    ? {
        connectionString: DATABASE_URL,
        connectionTimeoutMillis: 10000,
        ...(isProduction ? { ssl: { rejectUnauthorized: false } } : {}),
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_NAME || 'library',
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'admin123',
        connectionTimeoutMillis: 10000,
      };

  console.log('[migrate] Conectando a PostgreSQL...');
  const pool = new Pool(poolConfig);

  try {
    const client = await pool.connect();
    console.log('[migrate] Conexión exitosa a PostgreSQL');
    client.release();
  } catch (connErr) {
    console.error('[migrate] ========== ERROR DE CONEXIÓN ==========');

    if (connErr.name === 'AggregateError' && connErr.errors) {
      for (const e of connErr.errors) {
        console.error('[migrate]  - Error interno:', e.message || e.code || e);
        console.error('[migrate]    Código:', e.code);
        if (e.hint) console.error('[migrate]    Sugerencia:', e.hint);
      }
    }

    console.error('[migrate] Mensaje:', connErr.message || '(sin mensaje)');
    console.error('[migrate] Código:', connErr.code);

    if (connErr.code === 'ECONNREFUSED' || connErr.message?.includes('ECONNREFUSED') ||
        connErr.errors?.some?.(e => e.code === 'ECONNREFUSED')) {
      console.error('[migrate]');
      console.error('[migrate] CAUSA MÁS PROBABLE:');
      console.error('[migrate] El Web Service NO puede alcanzar la base de datos PostgreSQL.');
      console.error('[migrate]');
      console.error('[migrate] Posibles razones:');
      console.error('[migrate] 1) Web Service y PostgreSQL están en DISTINTAS regiones de Render.');
      console.error('[migrate]    → Ambos deben estar en la misma región (ej: Oregon, Frankfurt, etc.)');
      console.error('[migrate] 2) La DATABASE_URL no es la Internal Database URL de Render.');
      console.error('[migrate]    → En Render Dashboard > PostgreSQL > biblioteca-db >');
      console.error('[migrate]      copia la "Internal Database URL" y pégala en');
      console.error('[migrate]      Web Service > Environment > DATABASE_URL');
      console.error('[migrate] 3) La base de datos no existe o fue eliminada.');
      console.error('[migrate]');
      if (process.env.DATABASE_URL) {
        console.error('[migrate] Host actual:', getHostFromUrl(process.env.DATABASE_URL));
      }
    } else if (connErr.code === '28P01') {
      console.error('[migrate] Autenticación fallida — usuario o contraseña incorrectos');
    } else if (connErr.code === '3D000') {
      console.error('[migrate] La base de datos especificada no existe');
    } else if (connErr.message?.includes('SSL') || connErr.message?.includes('ssl')) {
      console.error('[migrate] Error SSL — Render requiere conexión SSL');
    }

    console.error('[migrate] Stack:', connErr.stack);
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
    console.error('[migrate] ERROR: No se encuentra el directorio:', migrationsDir);
    await pool.end();
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  console.log('[migrate] Archivos de migración encontrados:', files.length);

  if (files.length === 0) {
    console.error('[migrate] ERROR: No hay archivos .sql en', migrationsDir);
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

    const rawSql = fs.readFileSync(filePath, 'utf8');
    const downMatch = rawSql.match(/^--\s*Down/m);
    const upSql = downMatch ? rawSql.substring(0, downMatch.index).trim() : rawSql.trim();

    try {
      await pool.query(upSql);
    } catch (sqlErr) {
      console.error(`[migrate] ERROR SQL en ${file}:`, sqlErr.message);
      console.error('[migrate] SQL que falló (primeros 500 chars):');
      console.error(upSql.substring(0, 500));
      await pool.end();
      process.exit(1);
    }

    await pool.query('INSERT INTO pgmigrations (name, run_on) VALUES ($1, NOW())', [file]);
    console.log(`[migrate] Completada: ${file}`);
  }

  await pool.end();
  console.log('[migrate] ========================================');
  console.log('[migrate] Todas las migraciones aplicadas correctamente.');
  console.log('[migrate] ========================================');
}

main().catch((err) => {
  console.error('[migrate] ERROR FATAL:', err.message);
  console.error('[migrate] Stack:', err.stack);
  process.exit(1);
});
