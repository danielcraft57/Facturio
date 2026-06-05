import type { SvgIconComponent } from '@mui/icons-material'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'

export type WorkspacePreparationResource =
  | 'factures'
  | 'devis'
  | 'clients'
  | 'dettes'
  | 'creances'
  | 'archives-factures'
  | 'archives-devis'
  | 'archives-dettes'
  | 'catalogue'

export type WorkspacePreparationConfig = {
  title: string
  steps: readonly string[]
  Icon: SvgIconComponent
  resourceLabel: string
}

const CONFIG: Record<WorkspacePreparationResource, WorkspacePreparationConfig> = {
  factures: {
    title: 'Ouverture de l’espace factures',
    steps: [
      'Chargement des factures…',
      'Organisation des dossiers…',
      'Préparation de l’espace factures…',
    ],
    Icon: ReceiptLongOutlinedIcon,
    resourceLabel: 'factures',
  },
  devis: {
    title: 'Ouverture de l’espace devis',
    steps: [
      'Chargement des devis…',
      'Organisation des dossiers…',
      'Préparation de l’espace devis…',
    ],
    Icon: RequestQuoteOutlinedIcon,
    resourceLabel: 'devis',
  },
  clients: {
    title: 'Ouverture de l’espace clients',
    steps: [
      'Chargement des clients…',
      'Organisation des dossiers…',
      'Préparation de l’espace clients…',
    ],
    Icon: PeopleOutlineIcon,
    resourceLabel: 'clients',
  },
  dettes: {
    title: 'Ouverture de l’espace dettes',
    steps: [
      'Chargement des dettes…',
      'Organisation des dossiers…',
      'Préparation de l’espace dettes…',
    ],
    Icon: AccountBalanceWalletOutlinedIcon,
    resourceLabel: 'dettes',
  },
  creances: {
    title: 'Ouverture de l’espace créances',
    steps: [
      'Chargement des créances…',
      'Calcul des encours…',
      'Préparation de l’espace créances…',
    ],
    Icon: TrendingUpOutlinedIcon,
    resourceLabel: 'créances',
  },
  'archives-factures': {
    title: 'Ouverture des archives factures',
    steps: [
      'Chargement des archives…',
      'Classement par période…',
      'Préparation de l’affichage…',
    ],
    Icon: ArchiveOutlinedIcon,
    resourceLabel: 'archives factures',
  },
  'archives-devis': {
    title: 'Ouverture des archives devis',
    steps: [
      'Chargement des archives…',
      'Classement par période…',
      'Préparation de l’affichage…',
    ],
    Icon: ArchiveOutlinedIcon,
    resourceLabel: 'archives devis',
  },
  'archives-dettes': {
    title: 'Ouverture des archives dettes',
    steps: [
      'Chargement des archives…',
      'Classement par période…',
      'Préparation de l’affichage…',
    ],
    Icon: ArchiveOutlinedIcon,
    resourceLabel: 'archives dettes',
  },
  catalogue: {
    title: 'Ouverture du catalogue',
    steps: [
      'Chargement du catalogue…',
      'Organisation des prestations…',
      'Préparation de l’affichage…',
    ],
    Icon: Inventory2OutlinedIcon,
    resourceLabel: 'catalogue',
  },
}

export function getWorkspacePreparationConfig(
  resource: WorkspacePreparationResource,
): WorkspacePreparationConfig {
  return CONFIG[resource]
}
