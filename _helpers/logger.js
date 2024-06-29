const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const util = require('util');

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf } = format;

// Define log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} ${level}: ${message}`;
  if (metadata && Object.keys(metadata).length > 0) {
    msg += JSON.stringify(metadata);
  }
  return message;
});

// Create a logger instance
const logger = createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console transport (for development)
    new transports.Console(),
    // File transport for daily rotation
    new DailyRotateFile({
      level: 'info',
      handleExceptions: true,
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',  // max size of each log file
      maxFiles: '14d'  // keep logs for 14 days
    }),
  ]
});

const stringifyParams = (params) => {
  return params.reduce((acc, curr) => `${acc} ${typeof curr === 'object' ? util.inspect(curr, false, null, false): curr}, '',`);
}

console.log = function(...args) {
  const arrArgs = [...args];
  logger.info(stringifyParams(arrArgs));
}

console.log = function(...args) {
  const arrArgs = [...args];
  logger.error(stringifyParams(arrArgs));
}

module.exports = logger;
