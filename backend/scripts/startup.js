const { Pool } = require('pg');

async function main() {
  console.log('[startup] ========================================');
  console.log('[startup] Iniciando migraciones, seed y servidor...');
  console.log('[startup] ========================================');
  console.log('[startup] NODE_ENV:', process.env.NODE_ENV);
  console.log('[startup] DATABASE_URL presente:', !!process.env.DATABASE_URL);

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
    const { runSeed } = require('./run-seed');
    console.log('[startup] Ejecutando seed...');
    await runSeed(pool);
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

main();
