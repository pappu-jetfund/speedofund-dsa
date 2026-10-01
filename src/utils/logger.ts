import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'preprod';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

export const logger = pino({
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: isProduction
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true } },
  base: {
    service: 'attribution-service',
    environment: process.env.NODE_ENV || 'development',
  },
});
