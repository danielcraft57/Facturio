export interface DemoClient {
  id: string
  name: string
  email: string
  phone?: string
  address?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  company?: {
    name: string
    siret?: string
    tva?: string
  }
  status: 'active' | 'inactive' | 'prospect'
  createdAt: string
  updatedAt: string
}

export interface DemoInvoice {
  id: string
  number: string
  clientName: string
  amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  dueDate: string
  createdAt: string
}

export interface DemoQuote {
  id: string
  number: string
  clientName: string
  amount: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  validUntil: string
  createdAt: string
}

export interface DemoProduct {
  id: string
  name: string
  description: string
  price: number
  category: string
  stock: number
  active: boolean
}

export const DEMO_CLIENTS: DemoClient[] = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    email: 'contact@techcorp.com',
    phone: '+33 1 23 45 67 89',
    address: {
      street: '123 Rue de la Tech',
      city: 'Paris',
      postalCode: '75001',
      country: 'France'
    },
    company: {
      name: 'TechCorp Solutions SARL',
      siret: '12345678901234',
      tva: 'FR12345678901'
    },
    status: 'active',
    createdAt: '2023-06-01T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z'
  },
  {
    id: '2',
    name: 'Design Studio Pro',
    email: 'hello@designstudio.com',
    phone: '+33 1 98 76 54 32',
    address: {
      street: '456 Avenue des Arts',
      city: 'Paris',
      postalCode: '75008',
      country: 'France'
    },
    company: {
      name: 'Design Studio Pro SAS',
      siret: '98765432109876',
      tva: 'FR98765432109'
    },
    status: 'active',
    createdAt: '2023-08-15T09:00:00Z',
    updatedAt: '2024-01-10T16:20:00Z'
  },
  {
    id: '3',
    name: 'Green Energy Co',
    email: 'info@greenenergy.com',
    phone: '+33 1 55 44 33 22',
    address: {
      street: '789 Boulevard Écologique',
      city: 'Paris',
      postalCode: '75016',
      country: 'France'
    },
    company: {
      name: 'Green Energy Co EURL',
      siret: '11223344556677',
      tva: 'FR11223344556'
    },
    status: 'prospect',
    createdAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-01-05T11:00:00Z'
  },
  {
    id: '4',
    name: 'Restaurant Le Gourmet',
    email: 'reservation@legourmet.com',
    phone: '+33 1 11 22 33 44',
    address: {
      street: '321 Rue Gastronomique',
      city: 'Paris',
      postalCode: '75006',
      country: 'France'
    },
    company: {
      name: 'Restaurant Le Gourmet SAS',
      siret: '55443322110099',
      tva: 'FR55443322110'
    },
    status: 'active',
    createdAt: '2023-09-20T12:00:00Z',
    updatedAt: '2024-01-12T10:30:00Z'
  },
  {
    id: '5',
    name: 'Consulting Experts',
    email: 'contact@consultingexperts.com',
    phone: '+33 1 66 77 88 99',
    address: {
      street: '654 Place des Affaires',
      city: 'Paris',
      postalCode: '75002',
      country: 'France'
    },
    company: {
      name: 'Consulting Experts SARL',
      siret: '99887766554433',
      tva: 'FR99887766554'
    },
    status: 'inactive',
    createdAt: '2023-03-10T08:00:00Z',
    updatedAt: '2023-12-20T17:15:00Z'
  }
]

export const DEMO_INVOICES: DemoInvoice[] = [
  {
    id: '1',
    number: 'FAC-2024-001',
    clientName: 'TechCorp Solutions',
    amount: 8500,
    status: 'paid',
    dueDate: '2024-01-15',
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    number: 'FAC-2024-002',
    clientName: 'Design Studio Pro',
    amount: 4200,
    status: 'sent',
    dueDate: '2024-02-10',
    createdAt: '2024-01-10'
  },
  {
    id: '3',
    number: 'FAC-2024-003',
    clientName: 'Restaurant Le Gourmet',
    amount: 3200,
    status: 'overdue',
    dueDate: '2024-01-12',
    createdAt: '2024-01-12'
  },
  {
    id: '4',
    number: 'FAC-2024-004',
    clientName: 'TechCorp Solutions',
    amount: 12000,
    status: 'draft',
    dueDate: '2024-02-15',
    createdAt: '2024-01-15'
  },
  {
    id: '5',
    number: 'FAC-2024-005',
    clientName: 'Consulting Experts',
    amount: 5500,
    status: 'sent',
    dueDate: '2024-02-20',
    createdAt: '2024-01-18'
  }
]

// Nouvelles données de démo pour les factures avec la structure Invoice
export const DEMO_INVOICES_FULL = [
  {
    id: '1',
    number: 'FAC-2024-001',
    clientId: '1',
    client: {
      id: '1',
      name: 'TechCorp Solutions',
      email: 'contact@techcorp.com'
    },
    status: 'paid',
    issueDate: '2024-01-01T00:00:00Z',
    dueDate: '2024-01-15T00:00:00Z',
    items: [
      {
        id: '1',
        description: 'Développement site web',
        quantity: 1,
        unitPrice: 5000,
        taxRate: 20,
        total: 5000,
        totalWithTax: 6000
      },
      {
        id: '2',
        description: 'Formation équipe',
        quantity: 2,
        unitPrice: 800,
        taxRate: 20,
        total: 1600,
        totalWithTax: 1920
      }
    ],
    subtotal: 6600,
    taxTotal: 1320,
    total: 7920,
    currency: 'EUR',
    notes: 'Facture pour développement site web et formation',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
    paidAt: '2024-01-15T14:30:00Z'
  },
  {
    id: '2',
    number: 'FAC-2024-002',
    clientId: '2',
    client: {
      id: '2',
      name: 'Design Studio Pro',
      email: 'hello@designstudio.com'
    },
    status: 'sent',
    issueDate: '2024-01-10T00:00:00Z',
    dueDate: '2024-02-10T00:00:00Z',
    items: [
      {
        id: '3',
        description: 'Création logo',
        quantity: 1,
        unitPrice: 800,
        taxRate: 20,
        total: 800,
        totalWithTax: 960
      },
      {
        id: '4',
        description: 'Charte graphique',
        quantity: 1,
        unitPrice: 1200,
        taxRate: 20,
        total: 1200,
        totalWithTax: 1440
      }
    ],
    subtotal: 2000,
    taxTotal: 400,
    total: 2400,
    currency: 'EUR',
    notes: 'Création identité visuelle complète',
    createdAt: '2024-01-10T11:00:00Z',
    updatedAt: '2024-01-10T11:00:00Z'
  },
  {
    id: '3',
    number: 'FAC-2024-003',
    clientId: '4',
    client: {
      id: '4',
      name: 'Restaurant Le Gourmet',
      email: 'reservation@legourmet.com'
    },
    status: 'overdue',
    issueDate: '2024-01-12T00:00:00Z',
    dueDate: '2024-01-12T00:00:00Z',
    items: [
      {
        id: '5',
        description: 'Maintenance site web',
        quantity: 1,
        unitPrice: 300,
        taxRate: 20,
        total: 300,
        totalWithTax: 360
      }
    ],
    subtotal: 300,
    taxTotal: 60,
    total: 360,
    currency: 'EUR',
    notes: 'Maintenance mensuelle site web',
    createdAt: '2024-01-12T14:00:00Z',
    updatedAt: '2024-01-12T14:00:00Z'
  }
]

export const DEMO_QUOTES: DemoQuote[] = [
  {
    id: '1',
    number: 'DEV-2024-001',
    clientName: 'Green Energy Co',
    amount: 25000,
    status: 'sent',
    validUntil: '2024-02-15',
    createdAt: '2024-01-05'
  },
  {
    id: '2',
    number: 'DEV-2024-002',
    clientName: 'TechCorp Solutions',
    amount: 18000,
    status: 'accepted',
    validUntil: '2024-02-01',
    createdAt: '2024-01-08'
  },
  {
    id: '3',
    number: 'DEV-2024-003',
    clientName: 'Design Studio Pro',
    amount: 8500,
    status: 'draft',
    validUntil: '2024-02-20',
    createdAt: '2024-01-12'
  },
  {
    id: '4',
    number: 'DEV-2024-004',
    clientName: 'Restaurant Le Gourmet',
    amount: 12000,
    status: 'rejected',
    validUntil: '2024-01-25',
    createdAt: '2024-01-15'
  }
]

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: '1',
    name: 'Consultation stratégique',
    description: 'Séance de conseil en stratégie d\'entreprise',
    price: 150,
    category: 'Services',
    stock: -1,
    active: true
  },
  {
    id: '2',
    name: 'Développement web',
    description: 'Création de site web sur mesure',
    price: 2500,
    category: 'Services',
    stock: -1,
    active: true
  },
  {
    id: '3',
    name: 'Design graphique',
    description: 'Création d\'identité visuelle complète',
    price: 800,
    category: 'Services',
    stock: -1,
    active: true
  },
  {
    id: '4',
    name: 'Formation équipe',
    description: 'Session de formation personnalisée',
    price: 1200,
    category: 'Formation',
    stock: -1,
    active: true
  },
  {
    id: '5',
    name: 'Maintenance mensuelle',
    description: 'Service de maintenance et support',
    price: 300,
    category: 'Services',
    stock: -1,
    active: true
  }
]

export const DEMO_STATS = {
  revenue: {
    total: 61580,
    thisMonth: 19800,
    lastMonth: 9720,
    growth: 103.7
  },
  invoices: {
    total: 6,
    paid: 2,
    overdue: 1,
    draft: 1,
    sent: 2,
    thisMonth: 3,
    lastMonth: 2
  },
  clients: {
    total: 8,
    active: 6,
    inactive: 1,
    prospects: 1,
    newThisMonth: 2
  },
  topClients: [
    {
      client: { id: '7', name: 'Clinique Médicale' },
      revenue: 19800
    },
    {
      client: { id: '1', name: 'Entreprise ABC' },
      revenue: 7920
    },
    {
      client: { id: '8', name: 'École de Formation' },
      revenue: 9600
    }
  ],
  recentActivity: [
    {
      type: 'invoice_paid',
      message: 'Facture FAC-2024-005 payée',
      amount: 19800,
      date: '2024-03-25T10:15:00Z'
    },
    {
      type: 'invoice_sent',
      message: 'Facture FAC-2024-006 envoyée',
      amount: 9600,
      date: '2024-03-18T15:45:00Z'
    },
    {
      type: 'client_created',
      message: 'Nouveau client : Agence Web',
      date: '2024-03-10T15:20:00Z'
    },
    {
      type: 'invoice_overdue',
      message: 'Facture FAC-2024-003 en retard',
      amount: 2400,
      date: '2024-03-15T00:00:00Z'
    }
  ],
  monthlyRevenue: [
    { month: 'Jan', revenue: 0 },
    { month: 'Fév', revenue: 0 },
    { month: 'Mar', revenue: 19800 },
    { month: 'Avr', revenue: 0 },
    { month: 'Mai', revenue: 0 },
    { month: 'Juin', revenue: 0 },
    { month: 'Juil', revenue: 0 },
    { month: 'Août', revenue: 0 },
    { month: 'Sep', revenue: 0 },
    { month: 'Oct', revenue: 0 },
    { month: 'Nov', revenue: 0 },
    { month: 'Déc', revenue: 0 }
  ],
  chartData: {
    revenueEvolution: {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
      datasets: [
        {
          label: 'Chiffre d\'affaires',
          data: [12500, 15800, 19800, 14200, 18900, 22100, 18500, 16200, 23400, 19800, 25600, 28900],
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)'
        }
      ]
    },
    topClients: {
      labels: ['Clinique Médicale', 'Entreprise ABC', 'École de Formation'],
      datasets: [
        {
          label: 'CA par client',
          data: [19800, 7920, 9600],
          backgroundColor: ['#667eea', '#f093fb', '#4facfe'],
          borderColor: ['#667eea', '#f093fb', '#4facfe'],
          borderWidth: 1
        }
      ]
    },
    invoiceStatus: {
      labels: ['Payées', 'Envoyées', 'En retard', 'Brouillons'],
      datasets: [
        {
          data: [2, 2, 1, 1],
          backgroundColor: ['#43e97b', '#4facfe', '#f5576c', '#f093fb'],
          borderColor: ['#43e97b', '#4facfe', '#f5576c', '#f093fb'],
          borderWidth: 2
        }
      ]
    }
  }
}
