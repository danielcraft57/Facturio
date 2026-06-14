import { PrismaService } from '../../prisma/prisma.service';

/**
 * Supprime factures et tables liées dans l'ordre des contraintes FK (échéancier inclus).
 *
 * @param prisma - Client Prisma
 * @param organizationId - Limite à une organisation (optionnel)
 */
export async function purgeInvoicesForE2e(
	prisma: PrismaService,
	organizationId?: number,
): Promise<void> {
	const invoiceScope = organizationId ? { organizationId } : {};
	const invoiceRelation = organizationId ? { invoice: invoiceScope } : {};
	await prisma.avoirApplication.deleteMany({
		where: organizationId ? { avoir: invoiceScope } : {},
	});
	await prisma.avoirLine.deleteMany({
		where: organizationId ? { avoir: invoiceScope } : {},
	});
	await prisma.avoir.deleteMany({ where: invoiceScope });
	await prisma.invoiceInstallment.deleteMany({ where: invoiceRelation });
	await prisma.payment.deleteMany({ where: invoiceRelation });
	await prisma.invoiceLine.deleteMany({ where: invoiceRelation });
	await prisma.refund.deleteMany({
		where: organizationId ? { OR: [{ invoice: invoiceScope }, invoiceScope] } : {},
	});
	await prisma.invoice.deleteMany({ where: invoiceScope });
}
