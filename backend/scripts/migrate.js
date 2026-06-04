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

function parseUpSql(sql) {
  const downMatch = sql.match(/^--\s*Down/m);
  return downMatch ? sql.substring(0, downMatch.index).trim() : sql.trim();
}

async function runMigrations(pool) {
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
    throw new Error(`No se encuentra el directorio de migraciones: ${migrationsDir}`);
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  console.log('[migrate] Archivos de migración encontrados:', files.length);

  if (files.length === 0) {
    throw new Error(`No hay archivos .sql en ${migrationsDir}`);
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
    const upSql = parseUpSql(rawSql);

    try {
      await pool.query(upSql);
    } catch (sqlErr) {
      throw new Error(`Error SQL en ${file}: ${sqlErr.message}\nSQL:\n${upSql.substring(0, 500)}`);
    }

    await pool.query('INSERT INTO pgmigrations (name, run_on) VALUES ($1, NOW())', [file]);
    console.log(`[migrate] Completada: ${file}`);
  }

  console.log('[migrate] ========================================');
  console.log('[migrate] Todas las migraciones aplicadas correctamente.');
  console.log('[migrate] ========================================');
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
        if (e.code) console.error('[migrate]    Código:', e.code);
      }
    }

    console.error('[migrate] Mensaje:', connErr.message || '(sin mensaje)');

    const isRefused = connErr.code === 'ECONNREFUSED' ||
      connErr.message?.includes('ECONNREFUSED') ||
      connErr.errors?.some?.(e => e.code === 'ECONNREFUSED');

    if (isRefused) {
      console.error('[migrate]');
      console.error('[migrate] CAUSA: El Web Service no puede alcanzar PostgreSQL.');
      console.error('[migrate] 1) Web Service y DB deben estar en la MISMA región de Render');
      console.error('[migrate] 2) DATABASE_URL debe ser la Internal Database URL de Render');
      if (process.env.DATABASE_URL) {
        console.error('[migrate] Host actual:', getHostFromUrl(process.env.DATABASE_URL));
      }
    } else if (connErr.code === '28P01') {
      console.error('[migrate] Autenticación fallida — usuario/contraseña incorrectos');
    } else if (connErr.code === '3D000') {
      console.error('[migrate] La base de datos no existe');
    } else if (connErr.message?.match(/SSL|ssl/)) {
      console.error('[migrate] Render requiere SSL — configurado automáticamente');
    }

    await pool.end();
    process.exit(1);
  }

  try {
    await runMigrations(pool);
  } catch (migrateErr) {
    console.error('[migrate] ERROR:', migrateErr.message);
    await pool.end();
    process.exit(1);
  }

  await pool.end();
}

if (require.main === module) {
  main();
}

module.exports = { runMigrations };
