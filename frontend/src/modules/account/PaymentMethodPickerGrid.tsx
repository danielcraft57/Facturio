import { useState } from 'react'
import { Box, Typography, alpha, useTheme } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import {
  INVOICE_STRIPE_PAYMENT_METHOD_OPTIONS,
  paymentMethodIconUrl,
  type InvoiceStripePaymentMethodOption,
} from '../../constants/invoiceStripePaymentMethods'

type Props = {
  selected: string[]
  onToggle: (id: string) => void
  disabled?: boolean
}

function PaymentMethodTile({
  option,
  selected,
  onToggle,
  disabled,
}: {
  option: InvoiceStripePaymentMethodOption
  selected: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  const theme = useTheme()
  const [imgFailed, setImgFailed] = useState(false)
  const FallbackIcon = option.FallbackIcon

  return (
    <Box
      component="button"
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={`${option.label}${selected ? ', sélectionné' : ''}`}
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        p: 1.5,
        minHeight: 108,
        width: '100%',
        border: 2,
        borderRadius: 2,
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? alpha(theme.palette.primary.main, 0.08) : 'background.paper',
        boxShadow: selected ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.35)}` : 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'border-color 0.15s, background-color 0.15s, box-shadow 0.15s',
        '&:hover': disabled
          ? {}
          : {
              borderColor: selected ? 'primary.main' : 'primary.light',
              bgcolor: selected
                ? alpha(theme.palette.primary.main, 0.1)
                : alpha(theme.palette.primary.main, 0.04),
            },
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      }}
    >
      {selected && (
        <CheckCircleIcon
          color="primary"
          fontSize="small"
          sx={{ position: 'absolute', top: 6, right: 6 }}
        />
      )}
      <Box
        sx={{
          width: 72,
          height: 40,
          borderRadius: 1,
          bgcolor: option.tileBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          px: 0.5,
        }}
      >
        {option.id === 'card' && !imgFailed ? (
          <>
            {(['visa', 'mastercard'] as const).map((slug) => (
              <Box
                key={slug}
                component="img"
                src={paymentMethodIconUrl(slug)}
                alt=""
                onError={() => setImgFailed(true)}
                sx={{
                  height: 22,
                  width: 'auto',
                  maxWidth: 32,
                  objectFit: 'contain',
                  filter: 'brightness(0) saturate(100%)',
                  opacity: slug === 'visa' ? 0.85 : 0.75,
                }}
              />
            ))}
          </>
        ) : option.iconSlug && !imgFailed ? (
          <Box
            component="img"
            src={paymentMethodIconUrl(option.iconSlug)}
            alt=""
            onError={() => setImgFailed(true)}
            sx={{
              maxWidth: '100%',
              maxHeight: 28,
              objectFit: 'contain',
              filter: 'brightness(0) saturate(100%)',
              opacity: 0.88,
            }}
          />
        ) : (
          <FallbackIcon sx={{ fontSize: 32, color: option.brandColor }} />
        )}
      </Box>
      <Typography variant="body2" fontWeight={600} textAlign="center" lineHeight={1.2}>
        {option.shortLabel}
      </Typography>
    </Box>
  )
}

export function PaymentMethodPickerGrid({ selected, onToggle, disabled }: Props) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(3, 1fr)',
        },
        gap: 1.5,
      }}
    >
      {INVOICE_STRIPE_PAYMENT_METHOD_OPTIONS.map((opt) => (
        <PaymentMethodTile
          key={opt.id}
          option={opt}
          selected={selected.includes(opt.id)}
          onToggle={() => onToggle(opt.id)}
          disabled={disabled}
        />
      ))}
    </Box>
  )
}
