require('dotenv').config();
const { Pool } = require('pg');

function sanitizeUrl(url) {
  if (!url) return '(no definida)';
  return url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}

async function main() {
  console.log('[startup] ========================================');
  console.log('[startup] Iniciando migraciones, seed y servidor...');
  console.log('[startup] ========================================');
  console.log('[startup] NODE_ENV:', process.env.NODE_ENV);
  console.log('[startup] DATABASE_URL presente:', !!process.env.DATABASE_URL);
  if (process.env.DATABASE_URL) {
    console.log('[startup] DATABASE_URL (oculta):', sanitizeUrl(process.env.DATABASE_URL));
  } else {
    console.log('[startup] DB_HOST:', process.env.DB_HOST || '(no definido)');
    console.log('[startup] DB_PORT:', process.env.DB_PORT || '(no definido)');
  }

  if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
    console.error('[startup] ERROR FATAL: No hay DATABASE_URL ni DB_HOST definidos.');
    console.error('[startup] En Render, asegúrate de que el servicio de base de datos');
    console.error('[startup] esté creado en https://dashboard.render.com -> PostgreSQL');
    console.error('[startup] y vinculado al servicio web.');
    process.exit(1);
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

  console.log('[startup] Conectando a PostgreSQL...');
  const pool = new Pool(poolConfig);

  try {
    const client = await pool.connect();
    console.log('[startup] Conexión exitosa a PostgreSQL');
    client.release();
  } catch (connErr) {
    console.error('[startup] ERROR DE CONEXIÓN:');
    console.error(connErr);
    if (connErr.errors) {
      for (const e of connErr.errors) {
        console.error('  →', e.message || e.code || e);
      }
    }
    console.error('[startup] Stack:', connErr.stack);
    process.exit(1);
  }

  try {
    const { runMigrations } = require('./migrate');
    console.log('[startup] Ejecutando migraciones...');
    await runMigrations(pool);
  } catch (err) {
    console.error('[startup] ERROR EN MIGRACIONES:', err.message);
    console.error('[startup] Stack completo:', err.stack);
    await pool.end();
    process.exit(1);
  }

  try {
    const { runSeeds } = require('./run-seed');
    console.log('[startup] Ejecutando seed...');
    await runSeeds(pool);
  } catch (err) {
    console.error('[startup] ERROR EN SEED:', err.message);
    console.error('[startup] Stack completo:', err.stack);
    await pool.end();
    process.exit(1);
  }

  await pool.end();
  console.log('[startup] Migraciones y seed completados. Iniciando servidor...');

  require('../src/server');
}

main().catch(err => {
  console.error('[startup] Error fatal no capturado:', err);
  process.exit(1);
});
