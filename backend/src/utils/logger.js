const pino = require('pino');

const logger = pino({
  name: 'biblioteca-api',
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

module.exports = logger;
