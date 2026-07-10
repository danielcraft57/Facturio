import { Breadcrumbs, Link, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export type FinanceBreadcrumbItem = {
  label: string
  to?: string
}

type Props = {
  items: FinanceBreadcrumbItem[]
}

/**
 * Fil d'Ariane pour les pages détail facture / devis.
 */
export function FinanceDocumentBreadcrumb({ items }: Props) {
  if (items.length === 0) return null

  return (
    <Breadcrumbs aria-label="Fil d'Ariane" sx={{ mb: 1.5 }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        if (isLast || !item.to) {
          return (
            <Typography key={`${item.label}-${index}`} color="text.primary" fontWeight={isLast ? 700 : 500} fontSize="0.875rem">
              {item.label}
            </Typography>
          )
        }
        return (
          <Link
            key={`${item.label}-${index}`}
            component={RouterLink}
            to={item.to}
            underline="hover"
            color="inherit"
            fontSize="0.875rem"
          >
            {item.label}
          </Link>
        )
      })}
    </Breadcrumbs>
  )
}
