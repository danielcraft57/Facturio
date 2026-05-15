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
		return process.env.DATABASE_URL || 'file:./prisma/prisma/dev.db';
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

	// ========================================
	// TAXES ET IMPÔTS
	// ========================================

	get defaultVatRate(): number {
		return process.env.DEFAULT_VAT_RATE ? Number(process.env.DEFAULT_VAT_RATE) : 0.2;
	}

	// Impôt sur les Sociétés (IS)
	get isRateTranche1(): number {
		return process.env.IS_RATE_TRANCHE_1 ? Number(process.env.IS_RATE_TRANCHE_1) : 0.15;
	}

	get isThresholdTranche1(): number {
		return process.env.IS_THRESHOLD_TRANCHE_1 ? Number(process.env.IS_THRESHOLD_TRANCHE_1) : 38120;
	}

	get isRateTranche2(): number {
		return process.env.IS_RATE_TRANCHE_2 ? Number(process.env.IS_RATE_TRANCHE_2) : 0.28;
	}

	get isThresholdTranche2(): number {
		return process.env.IS_THRESHOLD_TRANCHE_2 ? Number(process.env.IS_THRESHOLD_TRANCHE_2) : 75000;
	}

	get isRateTranche3(): number {
		return process.env.IS_RATE_TRANCHE_3 ? Number(process.env.IS_RATE_TRANCHE_3) : 0.31;
	}

	// Impôt sur le Revenu (IR)
	get irRateTranche1(): number {
		return process.env.IR_RATE_TRANCHE_1 ? Number(process.env.IR_RATE_TRANCHE_1) : 0;
	}

	get irThresholdTranche1(): number {
		return process.env.IR_THRESHOLD_TRANCHE_1 ? Number(process.env.IR_THRESHOLD_TRANCHE_1) : 10777;
	}

	get irRateTranche2(): number {
		return process.env.IR_RATE_TRANCHE_2 ? Number(process.env.IR_RATE_TRANCHE_2) : 0.11;
	}

	get irThresholdTranche2(): number {
		return process.env.IR_THRESHOLD_TRANCHE_2 ? Number(process.env.IR_THRESHOLD_TRANCHE_2) : 27478;
	}

	get irRateTranche3(): number {
		return process.env.IR_RATE_TRANCHE_3 ? Number(process.env.IR_RATE_TRANCHE_3) : 0.30;
	}

	get irThresholdTranche3(): number {
		return process.env.IR_THRESHOLD_TRANCHE_3 ? Number(process.env.IR_THRESHOLD_TRANCHE_3) : 78570;
	}

	get irRateTranche4(): number {
		return process.env.IR_RATE_TRANCHE_4 ? Number(process.env.IR_RATE_TRANCHE_4) : 0.41;
	}

	get irThresholdTranche4(): number {
		return process.env.IR_THRESHOLD_TRANCHE_4 ? Number(process.env.IR_THRESHOLD_TRANCHE_4) : 168994;
	}

	get irRateTranche5(): number {
		return process.env.IR_RATE_TRANCHE_5 ? Number(process.env.IR_RATE_TRANCHE_5) : 0.45;
	}

	// Charges sociales
	get socialRateEmployee(): number {
		return process.env.SOCIAL_RATE_EMPLOYEE ? Number(process.env.SOCIAL_RATE_EMPLOYEE) : 0.22;
	}

	get socialRateEmployer(): number {
		return process.env.SOCIAL_RATE_EMPLOYER ? Number(process.env.SOCIAL_RATE_EMPLOYER) : 0.45;
	}

	// ========================================
	// URSSAF
	// ========================================

	get urssafRateVente(): number {
		return process.env.URSSAF_RATE_VENTE ? Number(process.env.URSSAF_RATE_VENTE) : 0.128;
	}

	get urssafThresholdVente(): number {
		return process.env.URSSAF_THRESHOLD_VENTE ? Number(process.env.URSSAF_THRESHOLD_VENTE) : 72600;
	}

	get urssafRateServiceBic(): number {
		return process.env.URSSAF_RATE_SERVICE_BIC ? Number(process.env.URSSAF_RATE_SERVICE_BIC) : 0.22;
	}

	get urssafThresholdServiceBic(): number {
		return process.env.URSSAF_THRESHOLD_SERVICE_BIC ? Number(process.env.URSSAF_THRESHOLD_SERVICE_BIC) : 176200;
	}

	get urssafRateServiceBnc(): number {
		return process.env.URSSAF_RATE_SERVICE_BNC ? Number(process.env.URSSAF_RATE_SERVICE_BNC) : 0.22;
	}

	get urssafThresholdServiceBnc(): number {
		return process.env.URSSAF_THRESHOLD_SERVICE_BNC ? Number(process.env.URSSAF_THRESHOLD_SERVICE_BNC) : 176200;
	}

	get urssafFiscalRateVente(): number {
		return process.env.URSSAF_FISCAL_RATE_VENTE ? Number(process.env.URSSAF_FISCAL_RATE_VENTE) : 0.01;
	}

	get urssafFiscalRateServiceBic(): number {
		return process.env.URSSAF_FISCAL_RATE_SERVICE_BIC ? Number(process.env.URSSAF_FISCAL_RATE_SERVICE_BIC) : 0.017;
	}

	get urssafFiscalRateServiceBnc(): number {
		return process.env.URSSAF_FISCAL_RATE_SERVICE_BNC ? Number(process.env.URSSAF_FISCAL_RATE_SERVICE_BNC) : 0.022;
	}

	// ========================================
	// PROSPECTLAB
	// ========================================

	get prospectLabApiUrl(): string {
		return process.env.PROSPECTLAB_API_URL || 'https://prospectlab.danielcraft.fr';
	}

	get prospectLabApiKey(): string {
		return process.env.PROSPECTLAB_API_KEY || '';
	}

	get prospectLabConfigured(): boolean {
		return !!process.env.PROSPECTLAB_API_KEY?.trim();
	}

	// ========================================
	// STRIPE
	// ========================================

	get stripeSecretKey(): string {
		return process.env.STRIPE_SECRET_KEY || '';
	}

	get stripePublishableKey(): string {
		return process.env.STRIPE_PUBLISHABLE_KEY || '';
	}

	get stripeWebhookSecret(): string {
		return process.env.STRIPE_WEBHOOK_SECRET || '';
	}

	get stripeConfigured(): boolean {
		return !!this.stripeSecretKey.trim();
	}
}

