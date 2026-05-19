import { Box, type SxProps, type Theme } from '@mui/material'
import { keyframes } from '@mui/system'

const floatSoft = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`

type MarketingImageProps = {
  src: string
  alt: string
  float?: boolean
  maxWidth?: number | { xs?: number; md?: number }
  sx?: SxProps<Theme>
}

export function MarketingImage({ src, alt, float = true, maxWidth = { xs: 300, md: 440 }, sx }: MarketingImageProps) {
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      loading="lazy"
      sx={{
        display: 'block',
        width: '100%',
        maxWidth,
        height: 'auto',
        mx: 'auto',
        borderRadius: 3,
        filter: 'drop-shadow(0 20px 40px rgba(15, 118, 110, 0.18))',
        animation: float ? `${floatSoft} 5s ease-in-out infinite` : undefined,
        ...sx,
      }}
    />
  )
}
