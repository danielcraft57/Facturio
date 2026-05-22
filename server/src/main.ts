import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { normalizeDatabaseUrl, redactDatabaseUrl } from './config/database-url.util';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { winstonConfig } from './logger/winston.config';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const nodeEnv = process.env.NODE_ENV || 'dev';
if (nodeEnv === 'prod' && process.env.DATABASE_URL) {
	process.env.DATABASE_URL = normalizeDatabaseUrl(process.env.DATABASE_URL, true);
}

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create(AppModule, {
		logger: WinstonModule.createLogger(winstonConfig),
		rawBody: true
	});

	const config = app.get(ConfigService);
	const logger = new Logger('Bootstrap');

	if (config.isProd) {
		const httpAdapter = app.getHttpAdapter();
		const instance = httpAdapter.getInstance() as { set?: (key: string, value: number) => void };
		instance.set?.('trust proxy', 1);
	}

	// Cookie parser pour gérer les cookies de session
	app.use(cookieParser());

	// Exception filter global pour normaliser les erreurs
	app.useGlobalFilters(new HttpExceptionFilter());

	// Validation globale
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidUnknownValues: false,
			disableErrorMessages: config.isProd, // Désactiver les messages d'erreur détaillés en prod
			exceptionFactory: (errors) => {
				// Formater les erreurs de validation de manière lisible
				const messages = errors.map(error => {
					const constraints = error.constraints || {};
					return Object.values(constraints).join(', ');
				});
				return new ValidationPipe().createExceptionFactory()(errors);
			}
		})
	);

	// CORS
	if (config.enableCors) {
		app.enableCors({
			origin: config.corsOrigin,
			credentials: true,
			methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
			allowedHeaders: ['Content-Type', 'Authorization']
		});
	}

	// Préfixe global pour l'API
	app.setGlobalPrefix('api');

	// Compression (en production)
	if (config.isProd) {
		const compressionModule = await import('compression');
		const compression = compressionModule.default || compressionModule;
		app.use(compression());
	}

	const port = config.port;
	if (config.isProd) {
		await app.listen(port, '0.0.0.0');
		logger.log(`🚀 API démarrée sur http://0.0.0.0:${port}`);
	} else {
		await app.listen(port);
		logger.log(`🚀 API démarrée sur http://localhost:${port}`);
	}
	logger.log(`📦 Environnement: ${config.environment}`);
	logger.log(`🗄️  Base de données: ${redactDatabaseUrl(config.databaseUrl)}`);
	const dbUrl = config.databaseUrl;
	if (dbUrl.startsWith('file:')) {
		const path = await import('path');
		const filePath = path.resolve(process.cwd(), dbUrl.replace(/^file:\/?/, ''));
		logger.log(`🗄️  Fichier DB (absolu): ${filePath}`);
	}
	logger.log(`🌐 CORS: ${Array.isArray(config.corsOrigin) ? config.corsOrigin.join(', ') : config.corsOrigin}`);
	logger.log(`📝 Log level: ${config.logLevel}`);
}

bootstrap();
