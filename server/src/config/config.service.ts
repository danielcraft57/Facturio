import { Injectable } from '@nestjs/common';

export type Environment = 'dev' | 'test' | 'prod';

@Injectable()
export class ConfigService {
	private readonly env: Environment;
	private readonly isDevelopment: boolean;
	private readonly isTest: boolean;
	private readonly isProduction: boolean;

	constructor() {
		const nodeEnv = process.env.NODE_ENV || 'dev';
		this.env = (nodeEnv === 'development' ? 'dev' : nodeEnv) as Environment;
		this.isDevelopment = this.env === 'dev';
		this.isTest = this.env === 'test';
		this.isProduction = this.env === 'prod';
	}

	get environment(): Environment {
		return this.env;
	}

	get isDev(): boolean {
		return this.isDevelopment;
	}

	get isTestEnv(): boolean {
		return this.isTest;
	}

	get isProd(): boolean {
		return this.isProduction;
	}

	get port(): number {
		return process.env.PORT ? Number(process.env.PORT) : 3000;
	}

	get databaseUrl(): string {
		return process.env.DATABASE_URL || 'file:./prisma/dev.db';
	}

	get corsOrigin(): string | string[] | boolean {
		const origin = process.env.CORS_ORIGIN;
		if (!origin) {
			return this.isProduction ? false : true;
		}
		if (origin.includes(',')) {
			return origin.split(',').map((o) => o.trim());
		}
		return origin;
	}

	get logLevel(): string {
		return process.env.LOG_LEVEL || (this.isProduction ? 'info' : 'debug');
	}

	get frontendUrl(): string {
		return process.env.FRONTEND_URL || 'http://localhost:5173';
	}

	get enableSwagger(): boolean {
		return !this.isProduction;
	}

	get enableCors(): boolean {
		return true;
	}
}

