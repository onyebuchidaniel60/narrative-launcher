import pino from 'pino';
import type { Logger, LoggerOptions, DestinationStream } from 'pino';

export const REDACTION_PATHS = [
  'authorization',
  '*.authorization',
  'apiKey',
  '*.apiKey',
  'jwt',
  '*.jwt',
  'secretKey',
  '*.secretKey',
  'privateKey',
  '*.privateKey',
  'token',
  '*.token',
];

export function createLogger(
  options: LoggerOptions = {},
  destination?: DestinationStream
): Logger {
  const isProduction = process.env.NODE_ENV === 'production';

  const baseOptions: LoggerOptions = {
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    // Apply caller options first so the redaction configuration below cannot
    // be silently overridden or disabled.
    ...options,
    redact: {
      paths: REDACTION_PATHS,
      censor: '[Redacted]',
    },
  };

  if (destination) {
    return pino(baseOptions, destination);
  }

  if (isProduction) {
    return pino(baseOptions);
  }

  // In non-production, use pino-pretty transport if no explicit destination
  return pino({
    ...baseOptions,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  });
}

export const logger = createLogger();
