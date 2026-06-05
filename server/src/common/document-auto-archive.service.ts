import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';

export type AutoArchiveResult = {
	invoices: number;
	quotes: number;
	payableDebts: number;
	clients: number;
};

/**
 * Archive automatique des documents terminés après un délai configurable.
 * Délai : FACTURIO_AUTO_ARCHIVE_MONTHS (défaut 12). Mettre 0 pour désactiver.
 */
@Injectable()
export class DocumentAutoArchiveService {
	private readonly logger = new Logger(DocumentAutoArchiveService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly config: ConfigService,
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_3AM)
	async runScheduledArchive(): Promise<void> {
		if (this.config.autoArchiveMonths <= 0) return;
		try {
			const result = await this.archiveStaleDocuments();
			const total = result.invoices + result.quotes + result.payableDebts + result.clients;
			if (total > 0) {
				this.logger.log(
					`Auto-archive : ${result.invoices} facture(s), ${result.quotes} devis, ${result.payableDebts} dette(s), ${result.clients} client(s)`,
				);
			}
		} catch (err) {
			this.logger.warn(`Auto-archive échoué : ${(err as Error).message}`);
		}
	}

	async archiveStaleDocuments(): Promise<AutoArchiveResult> {
		const months = this.config.autoArchiveMonths;
		if (months <= 0) {
			return { invoices: 0, quotes: 0, payableDebts: 0, clients: 0 };
		}

		const cutoff = new Date();
		cutoff.setMonth(cutoff.getMonth() - months);
		const now = new Date();

		const invoices = await this.prisma.invoice.updateMany({
			where: {
				archivedAt: null,
				status: { in: ['PAID', 'CANCELLED'] },
				updatedAt: { lt: cutoff },
			},
			data: { archivedAt: now },
		});

		const quotes = await this.prisma.quote.updateMany({
			where: {
				archivedAt: null,
				status: { in: ['ACCEPTED', 'REJECTED', 'EXPIRED'] },
				updatedAt: { lt: cutoff },
			},
			data: { archivedAt: now },
		});

		const payableDebts = await this.prisma.payableDebt.updateMany({
			where: {
				archivedAt: null,
				status: { in: ['PAID', 'CANCELLED'] },
				updatedAt: { lt: cutoff },
			},
			data: { archivedAt: now },
		});

		const staleClients = await this.prisma.client.findMany({
			where: {
				archivedAt: null,
				status: 'INACTIVE',
				updatedAt: { lt: cutoff },
			},
			select: { id: true },
		});

		let clients = 0;
		for (const client of staleClients) {
			const [openInvoices, openQuotes] = await Promise.all([
				this.prisma.invoice.count({
					where: {
						clientId: client.id,
						archivedAt: null,
						status: { in: ['DRAFT', 'SENT', 'OVERDUE'] },
					},
				}),
				this.prisma.quote.count({
					where: {
						clientId: client.id,
						archivedAt: null,
						status: { in: ['DRAFT', 'SENT'] },
					},
				}),
			]);
			if (openInvoices === 0 && openQuotes === 0) {
				await this.prisma.client.update({
					where: { id: client.id },
					data: { archivedAt: now },
				});
				clients += 1;
			}
		}

		return {
			invoices: invoices.count,
			quotes: quotes.count,
			payableDebts: payableDebts.count,
			clients,
		};
	}
}
