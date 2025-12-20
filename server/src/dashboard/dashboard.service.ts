import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
	constructor(private readonly prisma: PrismaService) {}

	async getStats(startDate?: string, endDate?: string) {
		const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
		const end = endDate ? new Date(endDate) : new Date();

		// Revenus
		const allInvoices = await this.prisma.invoice.findMany({
			where: {
				status: { in: ['PAID', 'SENT'] },
				date: { gte: start, lte: end }
			},
			include: { client: true }
		});

		const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
		const thisMonthEnd = new Date();
		const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
		const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0);

		const thisMonthInvoices = allInvoices.filter(inv => {
			const d = new Date(inv.date);
			return d >= thisMonthStart && d <= thisMonthEnd;
		});
		const lastMonthInvoices = allInvoices.filter(inv => {
			const d = new Date(inv.date);
			return d >= lastMonthStart && d <= lastMonthEnd;
		});

		const totalRevenue = allInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
		const thisMonthRevenue = thisMonthInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
		const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
		const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

		// Factures
		const invoiceStats = await this.prisma.invoice.groupBy({
			by: ['status'],
			_count: { id: true }
		});
		const invoiceCounts = invoiceStats.reduce((acc, s) => {
			acc[s.status.toLowerCase()] = s._count.id;
			return acc;
		}, {} as Record<string, number>);

		const thisMonthInvoiceCount = await this.prisma.invoice.count({
			where: { date: { gte: thisMonthStart, lte: thisMonthEnd } }
		});
		const lastMonthInvoiceCount = await this.prisma.invoice.count({
			where: { date: { gte: lastMonthStart, lte: lastMonthEnd } }
		});

		// Clients
		const totalClients = await this.prisma.client.count();
		const activeClients = await this.prisma.client.count({
			where: {
				invoices: { some: { date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } }
			}
		});
		const newClientsThisMonth = await this.prisma.client.count({
			where: { createdAt: { gte: thisMonthStart, lte: thisMonthEnd } }
		});

		// Top clients par revenus
		const topClientsData = await this.prisma.invoice.groupBy({
			by: ['clientId'],
			_sum: { total: true },
			where: { status: { in: ['PAID', 'SENT'] }, date: { gte: start, lte: end } },
			orderBy: { _sum: { total: 'desc' } },
			take: 5
		});

		const topClients = await Promise.all(
			topClientsData.map(async (item) => {
				const client = await this.prisma.client.findUnique({ where: { id: item.clientId } });
				return {
					client: { id: String(client?.id), name: client?.name || '' },
					revenue: Number(item._sum.total || 0)
				};
			})
		);

		// Activité récente
		const recentInvoices = await this.prisma.invoice.findMany({
			take: 10,
			orderBy: { createdAt: 'desc' },
			include: { client: true }
		});

		const recentActivity = recentInvoices.map((inv) => ({
			type: 'invoice',
			message: `Facture ${inv.number} créée pour ${inv.client.name}`,
			amount: Number(inv.total),
			date: inv.createdAt.toISOString()
		}));

		// Revenus mensuels (12 derniers mois)
		const monthlyRevenue = [];
		for (let i = 11; i >= 0; i--) {
			const monthStart = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
			const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0);
			const monthInvoices = await this.prisma.invoice.findMany({
				where: {
					status: { in: ['PAID', 'SENT'] },
					date: { gte: monthStart, lte: monthEnd }
				}
			});
			const monthRev = monthInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
			monthlyRevenue.push({
				month: monthStart.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
				revenue: monthRev
			});
		}

		// Données pour graphiques
		const chartData = {
			revenueEvolution: {
				labels: monthlyRevenue.map((m) => m.month),
				datasets: [
					{
						label: 'Revenus',
						data: monthlyRevenue.map((m) => m.revenue),
						borderColor: 'rgb(59, 130, 246)',
						backgroundColor: 'rgba(59, 130, 246, 0.1)'
					}
				]
			},
			topClients: {
				labels: topClients.map((tc) => tc.client.name),
				datasets: [
					{
						label: 'Revenus',
						data: topClients.map((tc) => tc.revenue),
						backgroundColor: [
							'rgba(59, 130, 246, 0.8)',
							'rgba(16, 185, 129, 0.8)',
							'rgba(245, 158, 11, 0.8)',
							'rgba(239, 68, 68, 0.8)',
							'rgba(139, 92, 246, 0.8)'
						],
						borderColor: [
							'rgb(59, 130, 246)',
							'rgb(16, 185, 129)',
							'rgb(245, 158, 11)',
							'rgb(239, 68, 68)',
							'rgb(139, 92, 246)'
						],
						borderWidth: 1
					}
				]
			},
			invoiceStatus: {
				labels: ['Brouillon', 'Envoyée', 'Payée', 'En retard', 'Annulée'],
				datasets: [
					{
						data: [
							invoiceCounts.draft || 0,
							invoiceCounts.sent || 0,
							invoiceCounts.paid || 0,
							invoiceCounts.overdue || 0,
							invoiceCounts.cancelled || 0
						],
						backgroundColor: [
							'rgba(107, 114, 128, 0.8)',
							'rgba(59, 130, 246, 0.8)',
							'rgba(16, 185, 129, 0.8)',
							'rgba(239, 68, 68, 0.8)',
							'rgba(156, 163, 175, 0.8)'
						],
						borderColor: [
							'rgb(107, 114, 128)',
							'rgb(59, 130, 246)',
							'rgb(16, 185, 129)',
							'rgb(239, 68, 68)',
							'rgb(156, 163, 175)'
						],
						borderWidth: 1
					}
				]
			}
		};

		return {
			revenue: {
				total: totalRevenue,
				thisMonth: thisMonthRevenue,
				lastMonth: lastMonthRevenue,
				growth: Math.round(revenueGrowth * 100) / 100
			},
			invoices: {
				total: await this.prisma.invoice.count(),
				paid: invoiceCounts.paid || 0,
				overdue: invoiceCounts.overdue || 0,
				draft: invoiceCounts.draft || 0,
				sent: invoiceCounts.sent || 0,
				thisMonth: thisMonthInvoiceCount,
				lastMonth: lastMonthInvoiceCount
			},
			clients: {
				total: totalClients,
				active: activeClients,
				inactive: totalClients - activeClients,
				prospects: 0, // TODO: à implémenter quand on aura le modèle Prospect
				newThisMonth: newClientsThisMonth
			},
			topClients,
			recentActivity,
			monthlyRevenue,
			chartData
		};
	}
}




