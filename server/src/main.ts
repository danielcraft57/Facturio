import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create(AppModule, {
		logger: ['error', 'warn', 'log', 'debug', 'verbose'].includes(process.env.LOG_LEVEL || '')
			? undefined
			: ['error', 'warn', 'log']
	});

	const config = app.get(ConfigService);
	const logger = new Logger('Bootstrap');

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
		const compression = await import('compression');
		app.use(compression.default());
	}

	const port = config.port;
	await app.listen(port);

	logger.log(`🚀 API démarrée sur http://localhost:${port}`);
	logger.log(`📦 Environnement: ${config.environment}`);
	logger.log(`🗄️  Base de données: ${config.databaseUrl}`);
	logger.log(`🌐 CORS: ${Array.isArray(config.corsOrigin) ? config.corsOrigin.join(', ') : config.corsOrigin}`);
	logger.log(`📝 Log level: ${config.logLevel}`);
}

bootstrap();
