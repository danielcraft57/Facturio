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
  MobileStepper,
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
  faAlignLeft,
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
  KIND_ICONS,
  PURPOSE_LABELS,
  PURPOSE_ICONS,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
} from '../constants/productLabels';
import { SelectionCard } from './SelectionCard';
import { ProductVisualPicker } from './ProductVisualPicker';
import { ProductAvatar } from './ProductAvatar';
import { ProductTechAutocomplete } from './ProductTechAutocomplete';
import { PRODUCT_VISUAL_LIBRARY } from '../constants/productVisualLibrary';
import { PRODUCT_ICON_OPTIONS } from '../constants/productIconOptions';

const STEP_ICONS = [faTag, faLayerGroup, faEuroSign, faCode, faImage, faAlignLeft, faCheck];

type Props = {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (data: UpdateProductData | CreateProductData) => Promise<void> | void;
  isSaving?: boolean;
};

const KINDS: ProductKind[] = ['SAAS', 'APP', 'SERVICE', 'GOOD'];
const PURPOSES: ProductPurpose[] = ['WEBSITE', 'SAAS', 'ECOMMERCE', 'SHOWCASE'];
const CATEGORIES: ProductCategory[] = [
  'SETUP', 'THEME', 'DEV', 'ECOMMERCE', 'PAYMENT', 'CONTENT', 'SEO',
  'HOSTING', 'CI_CD', 'MAINTENANCE', 'MOBILE', 'API',
];

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
  const [description, setDescription] = useState('');
  const [detailsText, setDetailsText] = useState('');
  const [visualType, setVisualType] = useState<ProductVisualType>('icon');
  const [iconName, setIconName] = useState('box');
  const [imageData, setImageData] = useState<string | undefined>();

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setSlideIn(true);
    if (product) {
      setName(product.name || '');
      setSku(product.sku || '');
      setKind(product.kind || 'SERVICE');
      setPurpose(product.purpose || '');
      setCategory(product.category || '');
      setUnitPrice(product.unitPrice ?? '');
      setEstimatedHours(product.estimatedHours ?? '');
      setLanguages(product.languages || []);
      setDescription(product.description || '');
      setDetailsText((product.details || []).join('\n'));
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
      setDescription('');
      setDetailsText('');
      setVisualType('library');
      setIconName(randomIcon?.name || 'box');
      setImageData(randomVisual?.id || PRODUCT_VISUAL_LIBRARY[0]?.id);
    }
    setErrors({});
  }, [open, product]);

  const validateStep = useCallback((step: number): boolean => {
    const e: Record<string, string> = {};
    if (step === 0 && !name.trim()) e.name = 'Nom requis';
    if (step === 1 && !kind) e.kind = 'Type requis';
    if (step === 2) {
      if (unitPrice === '' || Number(unitPrice) < 0) e.unitPrice = 'Prix invalide';
      if (estimatedHours !== '' && Number(estimatedHours) < 0) e.estimatedHours = 'Heures invalides';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [name, kind, unitPrice, estimatedHours]);

  const isFormValid = useMemo(() => {
    if (!name.trim()) return false;
    if (!kind) return false;
    if (unitPrice === '' || Number(unitPrice) < 0) return false;
    if (estimatedHours !== '' && Number(estimatedHours) < 0) return false;
    return true;
  }, [name, kind, unitPrice, estimatedHours]);

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
    sku: sku.trim() || undefined,
    kind,
    purpose: purpose || undefined,
    category: category || undefined,
    unitPrice: unitPrice === '' ? undefined : Number(unitPrice),
    estimatedHours: estimatedHours === '' ? undefined : Number(estimatedHours),
    languages,
    description: description.trim() || undefined,
    details: detailsText.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean),
    visualType,
    iconName: visualType === 'icon' ? iconName : undefined,
    imageData: visualType !== 'icon' ? imageData : undefined,
  });

  const handleSave = async () => {
    if (!isFormValid) return;
    await onSave(product ? buildPayload() : (buildPayload() as CreateProductData));
  };

  const detailsList = detailsText.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);
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
              onChange={e => setName(e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              autoFocus
            />
            <TextField
              label="Référence SKU (optionnel)"
              value={sku}
              onChange={e => setSku(e.target.value)}
              fullWidth
              placeholder="ex: DEV-REACT-001"
            />
          </Box>
        );

      case 'classification':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Type de produit</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                {KINDS.map(k => (
                  <SelectionCard
                    key={k}
                    label={KIND_LABELS[k]}
                    icon={KIND_ICONS[k]}
                    selected={kind === k}
                    onClick={() => setKind(k)}
                  />
                ))}
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>But / usage</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                <SelectionCard label="Non défini" selected={!purpose} onClick={() => setPurpose('')} />
                {PURPOSES.map(p => (
                  <SelectionCard
                    key={p}
                    label={PURPOSE_LABELS[p]}
                    icon={PURPOSE_ICONS[p]}
                    selected={purpose === p}
                    onClick={() => setPurpose(p)}
                  />
                ))}
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Catégorie</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, maxHeight: 160, overflowY: 'auto' }}>
                <SelectionCard label="—" selected={!category} onClick={() => setCategory('')} />
                {CATEGORIES.map(c => (
                  <SelectionCard
                    key={c}
                    label={CATEGORY_LABELS[c]}
                    icon={CATEGORY_ICONS[c]}
                    selected={category === c}
                    onClick={() => setCategory(c)}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        );

      case 'pricing':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Prix unitaire (€)"
              type="number"
              value={unitPrice}
              onChange={e => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
              error={!!errors.unitPrice}
              helperText={errors.unitPrice || 'Montant HT affiché sur les devis'}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label="Heures estimées (optionnel)"
              type="number"
              value={estimatedHours}
              onChange={e => setEstimatedHours(e.target.value === '' ? '' : Number(e.target.value))}
              error={!!errors.estimatedHours}
              helperText={errors.estimatedHours || 'Pour estimer la charge projet'}
              fullWidth
              inputProps={{ min: 0, step: 1 }}
            />
          </Box>
        );

      case 'skills':
        return (
          <ProductTechAutocomplete value={languages} onChange={setLanguages} />
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

      case 'content':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Description"
              multiline
              minRows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              fullWidth
              placeholder="Résumé commercial du produit ou service"
            />
            <TextField
              label="Points clés"
              multiline
              minRows={4}
              value={detailsText}
              onChange={e => setDetailsText(e.target.value)}
              fullWidth
              placeholder="Un point par ligne"
              helperText="Chaque ligne = une puce dans le catalogue"
            />
          </Box>
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
                    <ListItemText primary={d} />
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
        <Stepper activeStep={activeStep} nonLinear alternativeLabel sx={{ mb: 3, display: { xs: 'none', sm: 'flex' } }}>
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

        <MobileStepper
          variant="dots"
          steps={FORM_STEPS.length}
          position="static"
          activeStep={activeStep}
          sx={{ mb: 2, display: { xs: 'flex', sm: 'none' }, bgcolor: 'transparent' }}
          nextButton={<span />}
          backButton={<span />}
        />

        <Slide direction="left" in={slideIn} mountOnEnter unmountOnExit>
          <Box>{renderStepContent()}</Box>
        </Slide>
      </DialogContent>

      <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 1, px: 2, py: 1.5 }}>
        <MobileStepper
          variant="text"
          steps={FORM_STEPS.length}
          position="static"
          activeStep={activeStep}
          sx={{ flex: 1, bgcolor: 'transparent', px: 0 }}
          nextButton={
            <Button size="small" onClick={goNext} disabled={activeStep >= FORM_STEPS.length - 1}>
              Suivant
              <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 8 }} />
            </Button>
          }
          backButton={
            <Button size="small" onClick={goBack} disabled={activeStep === 0}>
              <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: 8 }} />
              Précédent
            </Button>
          }
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose}>Annuler</Button>
          {!isLastStep ? (
            <Button variant="contained" onClick={goNext}>
              Continuer
            </Button>
          ) : (
            <Button variant="contained" onClick={handleSave} disabled={isSaving || !isFormValid} startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <FontAwesomeIcon icon={faCheck} />}>
              {isSaving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
