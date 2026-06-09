import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepButton,
  Slide,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faCheck,
  faTag,
  faLayerGroup,
  faEuroSign,
  faCode,
  faImage,
} from '@fortawesome/free-solid-svg-icons';
import type {
  Product,
  ProductKind,
  ProductPurpose,
  ProductCategory,
  ProductVisualType,
  UpdateProductData,
  CreateProductData,
} from '../../../types/product';
import {
  FORM_STEPS,
  KIND_LABELS,
  PURPOSE_LABELS,
  CATEGORY_LABELS,
} from '../constants/productLabels';
import { ProductClassificationField } from './ProductClassificationField';
import { ProductVisualPicker } from './ProductVisualPicker';
import { ProductAvatar } from './ProductAvatar';
import { ProductTechStackAssemblyField } from './ProductTechStackAssemblyField';
import { ProductDeliverablesField } from './ProductDeliverablesField';
import {
  parseProductDeliverables,
  serializeProductDeliverables,
  sumKnownDeliverableAmounts,
  type ProductDeliverable,
} from '../utils/productDeliverables';
import {
  isValidProductSku,
  normalizeProductSku,
  normalizeProductSkuInput,
  PRODUCT_SKU_FORMAT_HINT,
  suggestProductSkuFromName,
} from '../utils/productSku';
import type { TechStackAssembly } from '../../../types/techStack';
import { flattenTechStack } from '../../../types/techStack';
import { PRODUCT_VISUAL_LIBRARY } from '../constants/productVisualLibrary';
import { PRODUCT_ICON_OPTIONS } from '../constants/productIconOptions';
import { applySuggestedTechStackIfEmpty } from '../utils/suggestTechStack';
import { catalogService } from '../../../services/catalogService';

const STEP_ICONS = [faTag, faLayerGroup, faEuroSign, faCode, faImage, faCheck];

type Props = {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (data: UpdateProductData | CreateProductData) => Promise<void> | void;
  isSaving?: boolean;
};

export function EditProductDialog({ open, product, onClose, onSave, isSaving }: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [slideIn, setSlideIn] = useState(true);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [kind, setKind] = useState<ProductKind>('SERVICE');
  const [purpose, setPurpose] = useState<ProductPurpose | ''>('');
  const [category, setCategory] = useState<ProductCategory | ''>('');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [estimatedHours, setEstimatedHours] = useState<number | ''>('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [techStack, setTechStack] = useState<TechStackAssembly>({});
  const [description, setDescription] = useState('');
  const [deliverables, setDeliverables] = useState<ProductDeliverable[]>([{ label: '' }]);
  const [visualType, setVisualType] = useState<ProductVisualType>('icon');
  const [iconName, setIconName] = useState('box');
  const [imageData, setImageData] = useState<string | undefined>();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [skuTouched, setSkuTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setSlideIn(true);
    setSkuTouched(false);
    if (product) {
      setName(product.name || '');
      setSku(normalizeProductSku(product.sku || ''));
      setSkuTouched(true);
      setKind(product.kind || 'SERVICE');
      setPurpose(product.purpose || '');
      setCategory(product.category || '');
      setUnitPrice(product.unitPrice ?? '');
      setEstimatedHours(product.estimatedHours ?? '');
      setLanguages(product.languages || []);
      const stack = product.techStack ?? {};
      setTechStack(
        Object.keys(stack).length > 0
          ? stack
          : product.languages?.length
            ? { languages: product.languages }
            : {},
      );
      setDescription(product.description || '');
      const parsed = parseProductDeliverables(product.details);
      setDeliverables(parsed.length ? parsed : [{ label: '' }]);
      setVisualType(product.visualType || 'icon');
      setIconName(product.iconName || 'box');
      setImageData(product.imageData);
    } else {
      const randomVisual = PRODUCT_VISUAL_LIBRARY[Math.floor(Math.random() * PRODUCT_VISUAL_LIBRARY.length)];
      const randomIcon = PRODUCT_ICON_OPTIONS[Math.floor(Math.random() * PRODUCT_ICON_OPTIONS.length)];
      setName('');
      setSku('');
      setKind('SERVICE');
      setPurpose('');
      setCategory('');
      setUnitPrice('');
      setEstimatedHours('');
      setLanguages([]);
      setTechStack({});
      setDescription('');
      setDeliverables([{ label: '' }]);
      setVisualType('library');
      setIconName(randomIcon?.name || 'box');
      setImageData(randomVisual?.id || PRODUCT_VISUAL_LIBRARY[0]?.id);
    }
    setErrors({});
  }, [open, product]);

  useEffect(() => {
    if (!open) return;
    void catalogService.prefetchTechChoices();
  }, [open]);

  useEffect(() => {
    if (!open || product) return;
    setTechStack((current) =>
      applySuggestedTechStackIfEmpty(current, { kind, purpose, category }),
    );
  }, [open, product, kind, purpose, category]);

  const validateStep = useCallback((step: number): boolean => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!name.trim()) e.name = 'Nom requis';
      const skuNorm = normalizeProductSku(sku);
      if (!skuNorm) e.sku = 'Référence SKU requise';
      else if (!isValidProductSku(skuNorm)) e.sku = PRODUCT_SKU_FORMAT_HINT;
    }
    if (step === 1 && !kind) e.kind = 'Type requis';
    if (step === 2) {
      const effectivePrice =
        unitPrice !== '' ? Number(unitPrice) : sumKnownDeliverableAmounts(deliverables);
      if (!Number.isFinite(effectivePrice) || effectivePrice <= 0) {
        e.unitPrice = 'Indiquez un montant sur au moins un livrable ou un forfait HT';
      }
      if (estimatedHours !== '' && Number(estimatedHours) < 0) e.estimatedHours = 'Heures invalides';
      const filled = deliverables.filter(d => d.label.trim());
      if (!filled.length) e.deliverables = 'Ajoutez au moins un livrable';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [name, sku, kind, unitPrice, estimatedHours, deliverables]);

  const isFormValid = useMemo(() => {
    if (!name.trim()) return false;
    if (!isValidProductSku(normalizeProductSku(sku))) return false;
    if (!kind) return false;
    const effectivePrice =
      unitPrice !== '' ? Number(unitPrice) : sumKnownDeliverableAmounts(deliverables);
    if (!Number.isFinite(effectivePrice) || effectivePrice <= 0) return false;
    if (estimatedHours !== '' && Number(estimatedHours) < 0) return false;
    if (!deliverables.some(d => d.label.trim())) return false;
    return true;
  }, [name, sku, kind, unitPrice, estimatedHours, deliverables]);

  const goNext = () => {
    if (!validateStep(activeStep)) return;
    setSlideIn(false);
    setTimeout(() => {
      setActiveStep(s => Math.min(s + 1, FORM_STEPS.length - 1));
      setSlideIn(true);
    }, 120);
  };

  const goBack = () => {
    setSlideIn(false);
    setTimeout(() => {
      setActiveStep(s => Math.max(s - 1, 0));
      setSlideIn(true);
    }, 120);
  };

  const goToStep = (targetStep: number) => {
    if (isSaving || targetStep === activeStep) return;
    if (targetStep < 0 || targetStep >= FORM_STEPS.length) return;

    if (targetStep > activeStep) {
      for (let s = activeStep; s < targetStep; s++) {
        if (!validateStep(s)) return;
      }
    }

    setSlideIn(false);
    setTimeout(() => {
      setActiveStep(targetStep);
      setSlideIn(true);
    }, 120);
  };

  const renderStepIcon = (index: number) => (
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: index <= activeStep ? 'primary.main' : 'action.disabledBackground',
        color: index <= activeStep ? 'primary.contrastText' : 'text.disabled',
        fontSize: 14,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <FontAwesomeIcon icon={STEP_ICONS[index]} />
    </Box>
  );

  const buildPayload = (): CreateProductData | UpdateProductData => ({
    name: name.trim(),
    sku: normalizeProductSku(sku),
    kind,
    purpose: purpose || undefined,
    category: category || undefined,
    unitPrice:
      unitPrice === ''
        ? sumKnownDeliverableAmounts(deliverables) || undefined
        : Number(unitPrice),
    estimatedHours: estimatedHours === '' ? undefined : Number(estimatedHours),
    languages: flattenTechStack(techStack).length > 0 ? flattenTechStack(techStack) : languages,
    techStack: Object.keys(techStack).length > 0 ? techStack : undefined,
    description: description.trim() || undefined,
    details: serializeProductDeliverables(deliverables),
    visualType,
    iconName: visualType === 'icon' ? iconName : undefined,
    imageData: visualType !== 'icon' ? imageData : undefined,
  });

  const handleSave = async () => {
    if (!isFormValid) return;
    await onSave(product ? buildPayload() : (buildPayload() as CreateProductData));
  };

  const detailsList = deliverables.filter(d => d.label.trim());
  const isLastStep = activeStep === FORM_STEPS.length - 1;

  const renderStepContent = () => {
    switch (FORM_STEPS[activeStep].id) {
      case 'identity':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Commencez par le nom affiché dans votre catalogue et devis.
            </Typography>
            <TextField
              label="Nom du produit"
              value={name}
              onChange={e => {
                const next = e.target.value;
                setName(next);
                if (!skuTouched) {
                  setSku(suggestProductSkuFromName(next));
                }
              }}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              autoFocus
            />
            <TextField
              label="Référence SKU"
              value={sku}
              onChange={e => {
                setSkuTouched(true);
                setSku(normalizeProductSkuInput(e.target.value));
              }}
              fullWidth
              required
              error={!!errors.sku}
              helperText={
                errors.sku ||
                (skuTouched ? PRODUCT_SKU_FORMAT_HINT : 'Généré depuis le nom — modifiable')
              }
              placeholder="STACK-WP-VITRINE"
              inputProps={{
                style: { textTransform: 'uppercase', fontFamily: 'monospace' },
                spellCheck: false,
              }}
            />
          </Box>
        );

      case 'classification':
        return (
          <ProductClassificationField
            kind={kind}
            purpose={purpose}
            category={category}
            onKindChange={setKind}
            onPurposeChange={setPurpose}
            onCategoryChange={setCategory}
            kindError={errors.kind}
          />
        );

      case 'offer':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <ProductDeliverablesField
              items={deliverables}
              unitPrice={unitPrice}
              estimatedHours={estimatedHours}
              onChange={setDeliverables}
              onUnitPriceChange={setUnitPrice}
              onEstimatedHoursChange={setEstimatedHours}
            />
            {(errors.deliverables || errors.unitPrice || errors.estimatedHours) && (
              <Typography variant="caption" color="error" component="div">
                {errors.deliverables || errors.unitPrice || errors.estimatedHours}
              </Typography>
            )}
          </Box>
        );

      case 'skills':
        return (
          <ProductTechStackAssemblyField
            value={techStack}
            onChange={(next) => {
              setTechStack(next);
              setLanguages(flattenTechStack(next));
            }}
          />
        );

      case 'visual':
        return (
          <ProductVisualPicker
            name={name}
            kind={kind}
            visualType={visualType}
            iconName={iconName}
            imageData={imageData}
            onChange={patch => {
              if (patch.visualType !== undefined) setVisualType(patch.visualType);
              if (patch.iconName !== undefined) setIconName(patch.iconName);
              if ('imageData' in patch) setImageData(patch.imageData);
            }}
          />
        );

      case 'summary':
        return (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <ProductAvatar
                product={{ name, visualType, iconName, imageData }}
                size={72}
              />
              <Box>
                <Typography variant="h6">{name || '—'}</Typography>
                {sku && <Typography variant="caption" color="text.secondary">SKU : {sku}</Typography>}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  <Chip size="small" label={KIND_LABELS[kind]} />
                  {purpose && <Chip size="small" color="primary" label={PURPOSE_LABELS[purpose]} />}
                  {category && <Chip size="small" variant="outlined" label={CATEGORY_LABELS[category]} />}
                </Box>
              </Box>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <List dense disablePadding>
              <ListItem disableGutters>
                <ListItemText primary="Prix" secondary={`${unitPrice === '' ? '—' : Number(unitPrice).toFixed(2)} €`} />
              </ListItem>
              {estimatedHours !== '' && (
                <ListItem disableGutters>
                  <ListItemText primary="Charge" secondary={`${estimatedHours} h`} />
                </ListItem>
              )}
              {languages.length > 0 && (
                <ListItem disableGutters>
                  <ListItemText primary="Technos" secondary={languages.join(', ')} />
                </ListItem>
              )}
            </List>
            {description && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Description</Typography>
                <Typography variant="body2" color="text.secondary">{description}</Typography>
              </>
            )}
            {detailsList.length > 0 && (
              <List dense sx={{ mt: 1 }}>
                {detailsList.map((d, i) => (
                  <ListItem key={i} disableGutters>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <FontAwesomeIcon icon={faCheck} style={{ fontSize: 12, color: '#10b981' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={d.label}
                      secondary={
                        d.amount != null
                          ? `${Number(d.amount).toLocaleString('fr-FR')} € HT${d.hours ? ` · ${d.hours} h` : ''}`
                          : d.hours
                            ? `${d.hours} h`
                            : undefined
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ pb: 1 }}>
        {product ? 'Modifier le produit' : 'Nouveau produit'}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Étape {activeStep + 1} sur {FORM_STEPS.length} — {FORM_STEPS[activeStep].label}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ minHeight: 380 }}>
        <Stepper
          activeStep={activeStep}
          nonLinear
          alternativeLabel
          sx={{
            mt: 2,
            mb: 3,
            display: { xs: 'none', sm: 'flex' },
            '& .MuiStepLabel-root': { mt: 1.25 },
            '& .MuiStepLabel-label': { mt: 0.75 },
          }}
        >
          {FORM_STEPS.map((step, i) => (
            <Step key={step.id} completed={i < activeStep}>
              <StepButton
                onClick={() => goToStep(i)}
                disabled={isSaving}
                icon={renderStepIcon(i)}
                sx={{
                  py: 0.5,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'action.hover',
                    '& .MuiStepIcon-root, & > span > div': {
                      transform: 'scale(1.06)',
                    },
                  },
                  '&.Mui-disabled': { opacity: 0.55 },
                }}
              >
                {step.label}
              </StepButton>
            </Step>
          ))}
        </Stepper>

        <Box
          sx={{
            display: { xs: 'flex', sm: 'none' },
            justifyContent: 'center',
            gap: 0.75,
            mb: 2,
          }}
        >
          {FORM_STEPS.map((_, i) => (
            <Box
              key={i}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: i === activeStep ? 'primary.main' : 'action.disabledBackground',
              }}
            />
          ))}
        </Box>

        <Slide direction="left" in={slideIn} mountOnEnter unmountOnExit>
          <Box>{renderStepContent()}</Box>
        </Slide>
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          px: 2,
          py: 1.5,
        }}
      >
        <Button
          onClick={goBack}
          disabled={activeStep === 0 || isSaving}
          startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
        >
          Précédent
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ mx: 1 }}>
          {activeStep + 1} / {FORM_STEPS.length}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={onClose} disabled={isSaving}>
            Annuler
          </Button>
          {!isLastStep ? (
            <Button
              variant="contained"
              onClick={goNext}
              disabled={isSaving}
              endIcon={<FontAwesomeIcon icon={faArrowRight} />}
            >
              Continuer
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isSaving || !isFormValid}
              startIcon={
                isSaving ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <FontAwesomeIcon icon={faCheck} />
                )
              }
            >
              {isSaving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
