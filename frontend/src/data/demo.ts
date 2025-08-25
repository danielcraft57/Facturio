export interface DemoClient {
  id: string
  name: string
  email: string
  phone: string
  address: string
  status: 'active' | 'inactive' | 'prospect'
  totalRevenue: number
  lastInvoice: string
  createdAt: string
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
    address: '123 Rue de la Tech, 75001 Paris',
    status: 'active',
    totalRevenue: 45000,
    lastInvoice: '2024-01-15',
    createdAt: '2023-06-01'
  },
  {
    id: '2',
    name: 'Design Studio Pro',
    email: 'hello@designstudio.com',
    phone: '+33 1 98 76 54 32',
    address: '456 Avenue des Arts, 75008 Paris',
    status: 'active',
    totalRevenue: 32000,
    lastInvoice: '2024-01-10',
    createdAt: '2023-08-15'
  },
  {
    id: '3',
    name: 'Green Energy Co',
    email: 'info@greenenergy.com',
    phone: '+33 1 55 44 33 22',
    address: '789 Boulevard Écologique, 75016 Paris',
    status: 'prospect',
    totalRevenue: 0,
    lastInvoice: '',
    createdAt: '2024-01-05'
  },
  {
    id: '4',
    name: 'Restaurant Le Gourmet',
    email: 'reservation@legourmet.com',
    phone: '+33 1 11 22 33 44',
    address: '321 Rue Gastronomique, 75006 Paris',
    status: 'active',
    totalRevenue: 28000,
    lastInvoice: '2024-01-12',
    createdAt: '2023-09-20'
  },
  {
    id: '5',
    name: 'Consulting Experts',
    email: 'contact@consultingexperts.com',
    phone: '+33 1 66 77 88 99',
    address: '654 Place des Affaires, 75002 Paris',
    status: 'inactive',
    totalRevenue: 15000,
    lastInvoice: '2023-12-20',
    createdAt: '2023-03-10'
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
  totalRevenue: 120000,
  pendingInvoices: 18900,
  overdueInvoices: 3200,
  activeClients: 4,
  totalClients: 5,
  monthlyGrowth: 12.5,
  conversionRate: 68.2
}
