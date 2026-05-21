import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import type { WinstonModuleOptions } from 'nest-winston';

// S'assurer que le dossier de logs existe
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const isProd =
  process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production';

const defaultLevel =
  process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

export const winstonConfig: WinstonModuleOptions = {
  level: defaultLevel,
  format: jsonFormat,
  transports: isProd
    ? [
        new winston.transports.Console({ level: defaultLevel, format: jsonFormat }),
        new winston.transports.File({
          filename: path.join(logsDir, 'app.log'),
          level: 'info',
          maxsize: 10 * 1024 * 1024,
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
          maxsize: 10 * 1024 * 1024,
          maxFiles: 5,
        }),
      ]
    : [
        new winston.transports.Console({
          level: defaultLevel,
          format: winston.format.combine(
            winston.format.colorize(),
            nestWinstonModuleUtilities.format.nestLike('Facturio', {
              colors: true,
              prettyPrint: true,
            }),
          ),
        }),
        new winston.transports.File({
          filename: path.join(logsDir, 'app.log'),
          level: 'info',
          maxsize: 10 * 1024 * 1024,
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
          maxsize: 10 * 1024 * 1024,
          maxFiles: 5,
        }),
      ],
};

