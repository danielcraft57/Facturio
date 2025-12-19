import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { App } from './App'

// On mocke le client API pour éviter les vraies requêtes HTTP
vi.mock('../../services/api', () => {
  return {
    apiClient: {
      getCached: vi.fn(async () => ({
        success: true,
        data: {
          revenue: {
            total: 0,
            thisMonth: 0,
            lastMonth: 0,
            growth: 0,
          },
          invoices: {
            total: 0,
            paid: 0,
            overdue: 0,
            draft: 0,
            sent: 0,
            thisMonth: 0,
            lastMonth: 0,
          },
          clients: {
            total: 0,
            active: 0,
            inactive: 0,
            prospects: 0,
            newThisMonth: 0,
          },
          topClients: [],
          recentActivity: [],
          monthlyRevenue: [],
          chartData: {
            revenueEvolution: { labels: [], datasets: [] },
            topClients: { labels: [], datasets: [] },
            invoiceStatus: { labels: [], datasets: [] },
          },
        },
      })),
    },
  }
})

describe('App (frontend)', () => {
  beforeEach(() => {
    // Nettoyer le DOM entre les tests
    document.body.innerHTML = ''
  })

  it('affiche la barre d application et la navigation principale', () => {
    render(<App />)

    // Titre de l'app (peut apparaître plusieurs fois selon le layout)
    const titles = screen.getAllByText(/facturio/i)
    expect(titles.length).toBeGreaterThan(0)

    // Liens de navigation principaux (au moins une occurrence)
    const clientsLabels = screen.getAllByText(/clients/i)
    expect(clientsLabels.length).toBeGreaterThan(0)

    const facturesLabels = screen.getAllByText(/factures/i)
    expect(facturesLabels.length).toBeGreaterThan(0)
  })

  it('se monte sans erreur avec le router et les loaders', () => {
    render(<App />)

    // On vérifie simplement qu un élément du layout est présent,
    // ce qui garantit que le montage global (ThemeProvider, Router, AppLayout)
    // fonctionne correctement.
    const titles = screen.getAllByText(/facturio/i)
    expect(titles.length).toBeGreaterThan(0)
  })
})


