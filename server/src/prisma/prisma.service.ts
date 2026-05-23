import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { entityIdExtension } from './entity-id.extension'

const isProd = (process.env.NODE_ENV || 'dev') === 'prod'

const ExtendedPrismaClient = class extends PrismaClient {
	constructor() {
		super({
			log: isProd
				? [
						{ emit: 'event', level: 'warn' },
						{ emit: 'event', level: 'error' },
					]
				: ['warn', 'error'],
		})
		return this.$extends(entityIdExtension) as unknown as this
	}
} as new () => PrismaClient & ReturnType<PrismaClient['$extends']>

@Injectable()
export class PrismaService extends ExtendedPrismaClient implements OnModuleInit, OnModuleDestroy {
	async onModuleInit(): Promise<void> {
		await this.$connect()
	}

	async onModuleDestroy(): Promise<void> {
		await this.$disconnect()
	}
}
