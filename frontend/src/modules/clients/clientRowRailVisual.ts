import type { SvgIconComponent } from '@mui/icons-material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import type { Client } from '../../services/clients'
import type { DocumentFolderRailVisual } from '../../components/finance/documentFolderRowRailVisual'

export function resolveClientRailVisual(client: Pick<Client, 'status'>): DocumentFolderRailVisual {
  switch (client.status) {
    case 'active':
      return {
        accent: '#16a34a',
        accentMuted: 'rgba(22, 163, 74, 0.14)',
        Icon: CheckCircleIcon,
        iconTitle: 'Client actif',
      }
    case 'inactive':
      return {
        accent: '#94a3b8',
        accentMuted: 'rgba(148, 163, 184, 0.18)',
        Icon: PauseCircleFilledIcon,
        iconTitle: 'Client inactif',
      }
    case 'prospect':
      return {
        accent: '#d97706',
        accentMuted: 'rgba(217, 119, 6, 0.14)',
        Icon: PersonAddAlt1Icon,
        iconTitle: 'Prospect',
      }
    default:
      return {
        accent: '#64748b',
        accentMuted: 'rgba(100, 116, 139, 0.14)',
        Icon: PersonAddAlt1Icon as SvgIconComponent,
        iconTitle: 'Client',
      }
  }
}
