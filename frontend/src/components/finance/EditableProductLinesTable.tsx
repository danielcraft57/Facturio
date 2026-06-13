import { Delete } from '@mui/icons-material'
import {
  Autocomplete,
  Box,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  alpha,
} from '@mui/material'
import type { Product } from '../../types/product'
import { FinanceFormSectionTitle, financeFieldSx } from './FinanceFormDialog'
import { ProductAvatar } from '../../modules/products/components/ProductAvatar'
import { canRemoveProductLine } from './editableProductLinesUtils'

export type EditableLine = {
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  productId?: number | null
}

type Props = {
  title?: string
  lines: EditableLine[]
  products: Product[]
  taxHeader: string
  taxInputProps?: Record<string, number>
  showQuantity?: boolean
  quantityWidth?: number
  unitPriceWidth?: number
  taxWidth?: number
  descriptionWidth?: string
  onRemoveLine: (index: number) => void
  onLineChange: (index: number, field: keyof EditableLine, value: string | number) => void
  onProductPicked?: (index: number, product: Product) => void
}

export function EditableProductLinesTable({
  title = 'Lignes',
  lines,
  products,
  taxHeader,
  taxInputProps,
  showQuantity = false,
  quantityWidth = 72,
  unitPriceWidth = 96,
  taxWidth = 72,
  descriptionWidth = '60%',
  onRemoveLine,
  onLineChange,
  onProductPicked,
}: Props) {
  const productOptions = products
    .filter((p) => (p.description ?? p.name ?? '').trim().length > 0)
    .filter((p, index, arr) => {
      const cur = ((p.description ?? p.name ?? '').trim()).toLowerCase()
      return arr.findIndex((x) => ((x.description ?? x.name ?? '').trim()).toLowerCase() === cur) === index
    })

  return (
    <Stack spacing={1}>
      <FinanceFormSectionTitle sx={{ mb: 0 }}>{title}</FinanceFormSectionTitle>

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: 2, borderColor: (t) => alpha('#0f172a', t.palette.mode === 'dark' ? 0.2 : 0.1) }}
      >
        <Table size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: descriptionWidth }}>Description</TableCell>
              {showQuantity && <TableCell align="right">Qté</TableCell>}
              <TableCell align="right" sx={{ width: `${unitPriceWidth + 28}px` }}>Prix unit.</TableCell>
              <TableCell align="right" sx={{ width: `${taxWidth + 28}px` }}>{taxHeader}</TableCell>
              <TableCell width={48} />
            </TableRow>
          </TableHead>
          <TableBody>
            {lines.map((line, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Autocomplete
                    freeSolo
                    openOnFocus
                    options={productOptions}
                    inputValue={line.description}
                    value={null}
                    getOptionLabel={(option) =>
                      typeof option === 'string'
                        ? option
                        : (option.description ?? option.name ?? '').trim()
                    }
                    isOptionEqualToValue={(a, b) =>
                      typeof a !== 'string' &&
                      typeof b !== 'string' &&
                      String(a.id) === String(b.id)
                    }
                    filterOptions={(opts, state) => {
                      const q = state.inputValue.trim().toLowerCase()
                      if (!q) return opts.slice(0, 40)
                      return opts
                        .filter((p) => {
                          const label = ((p.description ?? p.name ?? '').trim()).toLowerCase()
                          return label.includes(q)
                        })
                        .slice(0, 40)
                    }}
                    onInputChange={(_event, value, reason) => {
                      if (reason === 'input' || reason === 'clear' || reason === 'reset') {
                        onLineChange(index, 'description', value)
                      }
                    }}
                    onChange={(_event, value) => {
                      if (value && typeof value !== 'string') {
                        if (onProductPicked) {
                          onProductPicked(index, value)
                          return
                        }
                        const label = (value.description ?? value.name ?? '').trim()
                        onLineChange(index, 'description', label)
                      }
                    }}
                    renderOption={(props, option) => {
                      if (typeof option === 'string') {
                        const { key, ...liProps } = props
                        return (
                          <li key={key} {...liProps}>
                            {option}
                          </li>
                        )
                      }
                      const label = (option.description ?? option.name ?? '').trim()
                      const { key, ...liProps } = props
                      return (
                        <Box component="li" key={key} {...liProps}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                            <ProductAvatar product={option} size={22} />
                            <Stack spacing={0} sx={{ minWidth: 0 }}>
                              <span>{label}</span>
                              {option.unitPrice != null && (
                                <small style={{ opacity: 0.7 }}>{Math.round(Number(option.unitPrice))} €</small>
                              )}
                            </Stack>
                          </Stack>
                        </Box>
                      )
                    }}
                    renderInput={(params) => (
                      <TextField {...params} size="small" fullWidth sx={financeFieldSx} />
                    )}
                  />
                </TableCell>
                {showQuantity && (
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      sx={{ width: quantityWidth, ...financeFieldSx }}
                      value={line.quantity}
                      onChange={(e) => onLineChange(index, 'quantity', e.target.value)}
                      inputProps={{ min: 1, step: 1 }}
                    />
                  </TableCell>
                )}
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="text"
                    sx={{ width: unitPriceWidth, ...financeFieldSx }}
                    value={line.unitPrice}
                    onChange={(e) => onLineChange(index, 'unitPrice', e.target.value.replace(/[^\d]/g, ''))}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    inputProps={taxInputProps}
                    sx={{ width: taxWidth, ...financeFieldSx }}
                    value={line.taxRate}
                    onChange={(e) => onLineChange(index, 'taxRate', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={!canRemoveProductLine(lines, index)}
                    onClick={() => onRemoveLine(index)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )
}
