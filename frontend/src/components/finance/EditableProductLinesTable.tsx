import { Add, Delete } from '@mui/icons-material'
import {
  Autocomplete,
  Button,
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
import { financeOutlinedButtonSx } from './financeStyles'
import { FinanceFormSectionTitle, financeFieldSx } from './FinanceFormDialog'

export type EditableLine = {
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
}

type Props = {
  title?: string
  addLabel?: string
  lines: EditableLine[]
  products: Product[]
  taxHeader: string
  taxInputProps?: Record<string, number>
  quantityWidth?: number
  unitPriceWidth?: number
  taxWidth?: number
  onAddLine: () => void
  onRemoveLine: (index: number) => void
  onLineChange: (index: number, field: keyof EditableLine, value: string | number) => void
}

export function EditableProductLinesTable({
  title = 'Lignes',
  addLabel = 'Ajouter une ligne',
  lines,
  products,
  taxHeader,
  taxInputProps,
  quantityWidth = 72,
  unitPriceWidth = 96,
  taxWidth = 72,
  onAddLine,
  onRemoveLine,
  onLineChange,
}: Props) {
  const productOptions = products
    .map((p) => (p.description ?? p.name ?? '').trim())
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index)

  return (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <FinanceFormSectionTitle sx={{ mb: 0 }}>{title}</FinanceFormSectionTitle>
        <Button size="small" startIcon={<Add />} onClick={onAddLine} sx={financeOutlinedButtonSx}>
          {addLabel}
        </Button>
      </Stack>

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: 2, borderColor: (t) => alpha('#0f172a', t.palette.mode === 'dark' ? 0.2 : 0.1) }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell align="right">Qté</TableCell>
              <TableCell align="right">Prix unit.</TableCell>
              <TableCell align="right">{taxHeader}</TableCell>
              <TableCell width={48} />
            </TableRow>
          </TableHead>
          <TableBody>
            {lines.map((line, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Autocomplete
                    freeSolo
                    options={productOptions}
                    value={line.description}
                    onInputChange={(_event, value) => onLineChange(index, 'description', value)}
                    renderInput={(params) => <TextField {...params} size="small" fullWidth sx={financeFieldSx} />}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    sx={{ width: quantityWidth, ...financeFieldSx }}
                    value={line.quantity}
                    onChange={(e) => onLineChange(index, 'quantity', e.target.value)}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    sx={{ width: unitPriceWidth, ...financeFieldSx }}
                    value={line.unitPrice}
                    onChange={(e) => onLineChange(index, 'unitPrice', e.target.value)}
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
                    disabled={lines.length <= 1}
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
