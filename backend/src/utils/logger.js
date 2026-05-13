const pino = require('pino');

const logger = pino({
  name: 'biblioteca-api',
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino/file',
    options: { destination: 1 }
  },
  formatters: {
    level: (label) => ({ level: label })
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

module.exports = logger;
