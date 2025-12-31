import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	HttpException,
	HttpStatus,
	Logger
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '../../config/config.service';

/**
 * Exception filter global pour normaliser toutes les erreurs HTTP
 * 
 * Ce filter intercepte toutes les exceptions et les transforme en réponses
 * JSON standardisées avec :
 * - Code de statut HTTP approprié
 * - Message d'erreur clair
 * - Détails de validation (si applicable)
 * - Timestamp
 * - Path de la requête
 * 
 * @example
 * // Erreur 400 Bad Request
 * {
 *   "statusCode": 400,
 *   "message": "Validation failed",
 *   "errors": ["name should not be empty", "email must be an email"],
 *   "timestamp": "2024-12-20T10:30:00.000Z",
 *   "path": "/api/clients"
 * }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);
	private readonly isTestEnv: boolean;

	constructor() {
		// Détecter l'environnement de test
		this.isTestEnv = process.env.NODE_ENV === 'test';
	}

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		let status: number;
		let message: string | string[];
		let errors: string[] | undefined;

		if (exception instanceof HttpException) {
			status = exception.getStatus();
			const exceptionResponse = exception.getResponse();

			if (typeof exceptionResponse === 'string') {
				message = exceptionResponse;
			} else if (typeof exceptionResponse === 'object') {
				const responseObj = exceptionResponse as any;
				message = responseObj.message || exception.message;
				
				// Extraire les erreurs de validation si présentes
				if (Array.isArray(responseObj.message)) {
					errors = responseObj.message;
					message = 'Validation failed';
				} else if (responseObj.errors) {
					errors = Array.isArray(responseObj.errors) 
						? responseObj.errors 
						: [responseObj.errors];
				}
			} else {
				message = exception.message;
			}
		} else {
			// Erreur non gérée (500)
			status = HttpStatus.INTERNAL_SERVER_ERROR;
			message = 'Internal server error';
			
			// Logger l'erreur complète en développement (pas en test)
			if (!this.isTestEnv) {
				this.logger.error(
					`Unhandled exception: ${exception instanceof Error ? exception.stack : JSON.stringify(exception)}`,
					exception instanceof Error ? exception.stack : undefined
				);
			}
		}

		// Construire la réponse standardisée
		const errorResponse = {
			statusCode: status,
			message,
			...(errors && { errors }),
			timestamp: new Date().toISOString(),
			path: request.url
		};

		// Logger selon le niveau de sévérité (pas en test pour réduire le bruit)
		if (!this.isTestEnv) {
			if (status >= 500) {
				this.logger.error(
					`${request.method} ${request.url} - ${status} - ${message}`,
					exception instanceof Error ? exception.stack : undefined
				);
			} else if (status >= 400) {
				this.logger.warn(
					`${request.method} ${request.url} - ${status} - ${message}`
				);
			}
		}

		response.status(status).json(errorResponse);
	}
}

