import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const isProd = (process.env.NODE_ENV || 'dev') === 'prod';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(PrismaService.name);

	constructor() {
		super({
			log: isProd
				? [
						{ emit: 'event', level: 'warn' },
						{ emit: 'event', level: 'error' },
					]
				: ['warn', 'error'],
		});

		if (isProd) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(this as any).$on('warn', (e: { message: string }) => {
				this.logger.warn(e.message);
			});
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(this as any).$on('error', (e: { message: string }) => {
				this.logger.error(e.message);
			});
		}
	}

	async onModuleInit(): Promise<void> {
		await this.$connect();
	}

	async onModuleDestroy(): Promise<void> {
		await this.$disconnect();
	}
}
