import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrash,
  faScaleBalanced,
  faClock,
  faLink,
  faPen,
} from '@fortawesome/free-solid-svg-icons';
import type { DeliverableCatalogItem } from '../../../types/product';
import type { ProductDeliverable } from '../utils/productDeliverables';
import {
  sumDeliverableAmounts,
  sumKnownDeliverableAmounts,
  sumDeliverableHours,
  deliverablesHaveAmounts,
  allLabeledRowsHaveAmounts,
  labeledDeliverables,
  distributeAmountEvenly,
  distributeAmountByHours,
} from '../utils/productDeliverables';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { productService } from '../../../services/productService';

type Props = {
  items: ProductDeliverable[];
  unitPrice: number | '';
  estimatedHours: number | '';
  onChange: (items: ProductDeliverable[]) => void;
  onUnitPriceChange: (price: number | '') => void;
  onEstimatedHoursChange: (hours: number | '') => void;
};

function formatEuro(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(n);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

type DeliverableLabelCellProps = {
  value: string;
  onLabelChange: (label: string) => void;
  onCatalogSelect: (item: DeliverableCatalogItem) => void;
};

function DeliverableLabelCell({ value, onLabelChange, onCatalogSelect }: DeliverableLabelCellProps) {
  const [options, setOptions] = useState<DeliverableCatalogItem[]>([]);
  const [inputValue, setInputValue] = useState(value);
  const debouncedQuery = useDebouncedValue(inputValue, 250);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    productService
      .searchDeliverableCatalog(debouncedQuery)
      .then(items => {
        if (!cancelled) setOptions(items);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  return (
    <Autocomplete<DeliverableCatalogItem | string, false, false, true>
      freeSolo
      options={options}
      filterOptions={opts => opts}
      getOptionLabel={opt => (typeof opt === 'string' ? opt : opt.label)}
      isOptionEqualToValue={(a, b) =>
        (typeof a === 'string' ? a : a.label).toLowerCase() ===
        (typeof b === 'string' ? b : b.label).toLowerCase()
      }
      inputValue={inputValue}
      onInputChange={(_, next) => {
        setInputValue(next);
        onLabelChange(next);
      }}
      onChange={(_, next) => {
        if (!next) return;
        if (typeof next === 'string') {
          onLabelChange(next);
          return;
        }
        onCatalogSelect(next);
      }}
      renderOption={(props, option) => {
        const { key, ...rest } = props;
        if (typeof option === 'string') {
          return (
            <li key={key} {...rest}>
              {option}
            </li>
          );
        }
        const hint = [
          option.defaultAmount != null ? `${option.defaultAmount} €` : null,
          option.defaultHours != null ? `${option.defaultHours} h` : null,
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <li key={key} {...rest}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2">{option.label}</Typography>
              {hint ? (
                <Typography variant="caption" color="text.secondary">
                  {hint}
                </Typography>
              ) : null}
            </Box>
          </li>
        );
      }}
      renderInput={params => (
        <TextField
          {...params}
          placeholder="ex. Intégration WordPress"
          size="small"
          variant="standard"
          fullWidth
        />
      )}
    />
  );
}

export function ProductDeliverablesField({
  items,
  unitPrice,
  estimatedHours,
  onChange,
  onUnitPriceChange,
  onEstimatedHoursChange,
}: Props) {
  const [priceManual, setPriceManual] = useState(false);
  const [hoursManual, setHoursManual] = useState(false);
  const skipPriceSync = useRef(false);
  const skipHoursSync = useRef(false);

  const lineSumComplete = sumDeliverableAmounts(items);
  const lineSumKnown = sumKnownDeliverableAmounts(items);
  const hoursSum = sumDeliverableHours(items);
  const labeledCount = labeledDeliverables(items).length;
  const allAmountsComplete = allLabeledRowsHaveAmounts(items);
  const hasPartialAmounts = deliverablesHaveAmounts(items) && lineSumComplete == null;
  const total = unitPrice === '' ? null : Number(unitPrice);
  const mismatch =
    lineSumComplete != null && total != null && Math.abs(lineSumComplete - total) > 0.02;

  const syncPriceFromLines = useCallback(() => {
    if (lineSumKnown > 0) {
      skipPriceSync.current = true;
      onUnitPriceChange(round2(lineSumKnown));
      setPriceManual(false);
    }
  }, [lineSumKnown, onUnitPriceChange]);

  const syncHoursFromLines = useCallback(() => {
    if (hoursSum > 0) {
      skipHoursSync.current = true;
      onEstimatedHoursChange(hoursSum);
      setHoursManual(false);
    }
  }, [hoursSum, onEstimatedHoursChange]);

  useEffect(() => {
    if (priceManual || skipPriceSync.current) {
      skipPriceSync.current = false;
      return;
    }
    if (lineSumKnown > 0 && labeledCount > 0) {
      onUnitPriceChange(round2(lineSumKnown));
    }
  }, [lineSumKnown, labeledCount, priceManual, onUnitPriceChange]);

  useEffect(() => {
    if (hoursManual || skipHoursSync.current) {
      skipHoursSync.current = false;
      return;
    }
    if (hoursSum > 0) {
      onEstimatedHoursChange(hoursSum);
    }
  }, [hoursSum, hoursManual, onEstimatedHoursChange]);

  const updateRow = (index: number, patch: Partial<ProductDeliverable>) => {
    setPriceManual(false);
    if (!('hours' in patch)) setHoursManual(false);
    onChange(items.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    onChange([...items, { label: '', amount: undefined, hours: undefined }]);
  };

  const removeRow = (index: number) => {
    setPriceManual(false);
    setHoursManual(false);
    onChange(items.filter((_, i) => i !== index));
  };

  const splitEvenly = () => {
    if (total == null || total <= 0 || !labeledCount) return;
    setPriceManual(false);
    onChange(distributeAmountEvenly(items, total));
  };

  const splitByHours = () => {
    if (total == null || total <= 0 || !labeledCount) return;
    setPriceManual(false);
    onChange(distributeAmountByHours(items, total));
  };

  const showDistributeActions =
    total != null && total > 0 && labeledCount > 0 && !allAmountsComplete;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Livrables et répartition du prix
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Saisissez libellé, montant et heures — le total HT et la charge se mettent à jour
          automatiquement.
        </Typography>
      </Box>

      <Table
        size="small"
        sx={{
          '& .MuiTableCell-root': { py: 0.75, px: 1 },
          '& .MuiTableFooter-root .MuiTableCell-root': {
            borderTop: 1,
            borderColor: 'divider',
            fontWeight: 600,
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Livrable</TableCell>
            <TableCell align="right" sx={{ width: 108 }}>
              Montant HT €
            </TableCell>
            <TableCell align="right" sx={{ width: 72 }}>
              Heures
            </TableCell>
            <TableCell align="right" sx={{ width: 72 }}>
              TJM indicatif
            </TableCell>
            <TableCell align="center" sx={{ width: 40 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((row, index) => {
            const tjm =
              row.amount != null &&
              row.hours != null &&
              row.hours > 0 &&
              !Number.isNaN(row.amount)
                ? round2(row.amount / row.hours)
                : null;
            return (
              <TableRow key={index} hover>
                <TableCell>
                  <DeliverableLabelCell
                    value={row.label}
                    onLabelChange={label => updateRow(index, { label })}
                    onCatalogSelect={item =>
                      updateRow(index, {
                        label: item.label,
                        ...(item.defaultAmount != null ? { amount: item.defaultAmount } : {}),
                        ...(item.defaultHours != null ? { hours: item.defaultHours } : {}),
                      })
                    }
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    value={row.amount ?? ''}
                    onChange={e =>
                      updateRow(index, {
                        amount: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    type="number"
                    size="small"
                    variant="standard"
                    inputProps={{ min: 0, step: 10 }}
                    sx={{ maxWidth: 96 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    value={row.hours ?? ''}
                    onChange={e =>
                      updateRow(index, {
                        hours: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    type="number"
                    size="small"
                    variant="standard"
                    inputProps={{ min: 0, step: 1 }}
                    sx={{ maxWidth: 64 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="caption" color="text.secondary">
                    {tjm != null ? `${tjm} €/h` : '—'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => removeRow(index)}
                    disabled={items.length <= 1}
                    aria-label="Supprimer la ligne"
                  >
                    <FontAwesomeIcon icon={faTrash} style={{ fontSize: 12 }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total livrables</TableCell>
            <TableCell align="right">{lineSumKnown > 0 ? formatEuro(lineSumKnown) : '—'}</TableCell>
            <TableCell align="right">{hoursSum > 0 ? `${hoursSum} h` : '—'}</TableCell>
            <TableCell align="right">
              {lineSumKnown > 0 && hoursSum > 0
                ? `${round2(lineSumKnown / hoursSum)} €/h`
                : '—'}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>

      <Button
        size="small"
        startIcon={<FontAwesomeIcon icon={faPlus} />}
        onClick={addRow}
        sx={{ alignSelf: 'flex-start' }}
      >
        Ajouter un livrable
      </Button>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 1.5,
          p: 2,
          borderRadius: 2,
          bgcolor: 'action.hover',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <TextField
          label="Prix total HT (devis)"
          type="number"
          value={unitPrice}
          onChange={e => {
            const val = e.target.value === '' ? '' : Number(e.target.value);
            setPriceManual(true);
            onUnitPriceChange(val);
          }}
          size="small"
          inputProps={{ min: 0, step: 10 }}
          helperText={
            priceManual
              ? 'Saisie manuelle — modifiez les lignes pour resynchroniser'
              : lineSumKnown > 0
                ? 'Synchronisé avec la somme des livrables'
                : 'Renseignez des montants par ligne ou saisissez un forfait'
          }
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {priceManual ? (
                  <Tooltip title="Resynchroniser avec les lignes">
                    <IconButton size="small" onClick={syncPriceFromLines} edge="end">
                      <FontAwesomeIcon icon={faLink} style={{ fontSize: 12 }} />
                    </IconButton>
                  </Tooltip>
                ) : lineSumKnown > 0 ? (
                  <FontAwesomeIcon icon={faLink} style={{ fontSize: 11, opacity: 0.5 }} />
                ) : null}
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Charge totale (heures)"
          type="number"
          value={estimatedHours}
          onChange={e => {
            const val = e.target.value === '' ? '' : Number(e.target.value);
            setHoursManual(true);
            onEstimatedHoursChange(val);
          }}
          size="small"
          inputProps={{ min: 0, step: 1 }}
          helperText={
            hoursManual
              ? 'Saisie manuelle'
              : hoursSum > 0
                ? 'Somme des heures par livrable'
                : 'Optionnel — référence interne'
          }
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {hoursManual ? (
                  <Tooltip title="Resynchroniser avec les lignes">
                    <IconButton size="small" onClick={syncHoursFromLines} edge="end">
                      <FontAwesomeIcon icon={faLink} style={{ fontSize: 12 }} />
                    </IconButton>
                  </Tooltip>
                ) : hoursSum > 0 ? (
                  <FontAwesomeIcon icon={faLink} style={{ fontSize: 11, opacity: 0.5 }} />
                ) : null}
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {showDistributeActions && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
            <FontAwesomeIcon icon={faPen} style={{ marginRight: 6 }} />
            Forfait saisi — répartir sur les livrables :
          </Typography>
          <Chip
            size="small"
            variant="outlined"
            icon={<FontAwesomeIcon icon={faScaleBalanced} style={{ fontSize: 11 }} />}
            label="À parts égales"
            onClick={splitEvenly}
            clickable
          />
          {hoursSum > 0 && (
            <Chip
              size="small"
              variant="outlined"
              icon={<FontAwesomeIcon icon={faClock} style={{ fontSize: 11 }} />}
              label="Selon les heures"
              onClick={splitByHours}
              clickable
            />
          )}
        </Box>
      )}

      {hasPartialAmounts && (
        <Alert severity="info" sx={{ py: 0.5 }}>
          Complétez le montant de chaque livrable pour afficher la répartition détaillée sur le
          devis PDF.
        </Alert>
      )}
      {mismatch && (
        <Alert severity="warning" sx={{ py: 0.5 }}>
          Écart forfait / lignes : {formatEuro(lineSumComplete!)} en détail vs{' '}
          {formatEuro(total!)} au total. Acceptable (marge, gestion) — les deux figures
          apparaîtront sur le devis.
        </Alert>
      )}
      {allAmountsComplete && lineSumComplete != null && total != null && !mismatch && (
        <Alert severity="success" sx={{ py: 0.5 }}>
          Prix et répartition alignés — le devis PDF justifiera {formatEuro(lineSumComplete)}.
        </Alert>
      )}
    </Box>
  );
}
