import winston from 'winston';

const logFormat = winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    process.env.NODE_ENV === 'production' ? winston.format.json() : logFormat
  ),
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              winston.format.errors({ stack: true }),
              winston.format.splat(),
              logFormat
            ),
    }),
  ],
});

