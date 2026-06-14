import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service de dashboard
 * 
 * Fournit des statistiques agrégées pour le tableau de bord :
 * - Revenus (total, mensuel, croissance)
 * - Statistiques de factures (par statut)
 * - Statistiques de clients
 * - Top clients
 * - Évolution des revenus
 * 
 * Utilise des agrégations SQL pour optimiser les performances.
 * 
 * @see DashboardController pour les endpoints API
 */
@Injectable()
export class DashboardService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Récupère les statistiques du dashboard
	 * 
	 * Calcule :
	 * - Revenus totaux sur la période
	 * - Revenus du mois en cours vs mois précédent (croissance)
	 * - Répartition des factures par statut
	 * - Nombre de clients
	 * - Top clients (par CA)
	 * - Évolution des revenus (mensuelle)
	 * 
	 * @param startDate - Date de début (optionnel, défaut: début du mois)
	 * @param endDate - Date de fin (optionnel, défaut: maintenant)
	 * @returns Statistiques complètes du dashboard
	 */
	async getStats(startDate?: string, endDate?: string, organizationId?: number) {
		const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
		const end = endDate ? new Date(endDate) : new Date();
		const orgFilter = organizationId != null ? { organizationId } : {};

		// Revenus (optimisé: agrégations SQL au lieu de charger toutes les factures)
		const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
		const thisMonthEnd = new Date();
		const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
		const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0);

		const [totalRevenueData, thisMonthRevenueData, lastMonthRevenueData] = await Promise.all([
			this.prisma.invoice.aggregate({
				where: { ...orgFilter, status: { in: ['PAID', 'SENT'] }, date: { gte: start, lte: end } },
				_sum: { total: true }
			}),
			this.prisma.invoice.aggregate({
				where: { ...orgFilter, status: { in: ['PAID', 'SENT'] }, date: { gte: thisMonthStart, lte: thisMonthEnd } },
				_sum: { total: true }
			}),
			this.prisma.invoice.aggregate({
				where: { ...orgFilter, status: { in: ['PAID', 'SENT'] }, date: { gte: lastMonthStart, lte: lastMonthEnd } },
				_sum: { total: true }
			})
		]);

		const totalRevenue = Number(totalRevenueData._sum.total || 0);
		const thisMonthRevenue = Number(thisMonthRevenueData._sum.total || 0);
		const lastMonthRevenue = Number(lastMonthRevenueData._sum.total || 0);
		const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

		// Factures
		const invoiceStats = await this.prisma.invoice.groupBy({
			by: ['status'],
			where: orgFilter,
			_count: { id: true }
		});
		const invoiceCounts = invoiceStats.reduce((acc, s) => {
			acc[s.status.toLowerCase()] = s._count.id;
			return acc;
		}, {} as Record<string, number>);

		const thisMonthInvoiceCount = await this.prisma.invoice.count({
			where: { ...orgFilter, date: { gte: thisMonthStart, lte: thisMonthEnd } }
		});
		const lastMonthInvoiceCount = await this.prisma.invoice.count({
			where: { ...orgFilter, date: { gte: lastMonthStart, lte: lastMonthEnd } }
		});

		// Clients
		const totalClients = await this.prisma.client.count({ where: orgFilter });
		const activeClients = await this.prisma.client.count({
			where: {
				...orgFilter,
				invoices: { some: { date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } }
			}
		});
		const newClientsThisMonth = await this.prisma.client.count({
			where: { ...orgFilter, createdAt: { gte: thisMonthStart, lte: thisMonthEnd } }
		});
		const prospectClients = await this.prisma.client.count({
			where: { ...orgFilter, status: 'PROSPECT' }
		});

		// Top clients par revenus (optimisé: une seule requête au lieu de N+1)
		const topClientsData = await this.prisma.invoice.groupBy({
			by: ['clientId'],
			_sum: { total: true },
			where: { ...orgFilter, status: { in: ['PAID', 'SENT'] }, date: { gte: start, lte: end } },
			orderBy: { _sum: { total: 'desc' } },
			take: 5
		});

		const clientIds = topClientsData.map((item) => item.clientId);
		const clients = await this.prisma.client.findMany({
			where: { ...orgFilter, id: { in: clientIds } },
			select: { id: true, name: true }
		});
		const clientMap = new Map(clients.map((c) => [c.id, c]));
		const topClients = topClientsData.map((item) => ({
			client: {
				id: String(item.clientId),
				name: clientMap.get(item.clientId)?.name || ''
			},
			revenue: Number(item._sum.total || 0)
		}));

		// Activité récente (optimisé: select au lieu de include)
		const recentInvoices = await this.prisma.invoice.findMany({
			where: orgFilter,
			take: 10,
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				number: true,
				total: true,
				createdAt: true,
				client: {
					select: {
						name: true
					}
				}
			}
		});

		const recentActivity = recentInvoices.map((inv) => ({
			type: 'invoice',
			message: `Facture ${inv.number} créée pour ${inv.client.name}`,
			amount: Number(inv.total),
			date: inv.createdAt.toISOString()
		}));

		// Revenus mensuels (12 derniers mois) - optimisé avec agrégations
		const monthlyRevenuePromises = [];
		for (let i = 11; i >= 0; i--) {
			const monthStart = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
			const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0);
			monthlyRevenuePromises.push(
				this.prisma.invoice.aggregate({
					where: { ...orgFilter, status: { in: ['PAID', 'SENT'] }, date: { gte: monthStart, lte: monthEnd } },
					_sum: { total: true }
				}).then((result) => ({
					month: monthStart.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
					revenue: Number(result._sum.total || 0)
				}))
			);
		}
		const monthlyRevenue = await Promise.all(monthlyRevenuePromises);

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
				prospects: prospectClients,
				newThisMonth: newClientsThisMonth
			},
			topClients,
			recentActivity,
			monthlyRevenue,
			chartData
		};
	}
}




