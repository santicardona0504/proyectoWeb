const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function run(step, cmd) {
  console.log(`[startup] ${step}...`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

run('migraciones', 'node scripts/migrate.js');
run('seed', 'node scripts/run-seed.js');
run('servidor', 'node src/server.js');
