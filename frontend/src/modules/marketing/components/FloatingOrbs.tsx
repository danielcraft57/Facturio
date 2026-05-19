import { Box } from '@mui/material'
import { keyframes } from '@mui/system'

const drift = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(12px, -18px) scale(1.05); }
  66% { transform: translate(-8px, 10px) scale(0.95); }
`

/** Orbes décoratifs en arrière-plan du hero. */
export function FloatingOrbs() {
  return (
    <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {[
        { size: 280, top: '10%', left: '-5%', delay: '0s', opacity: 0.35 },
        { size: 200, top: '55%', right: '-3%', delay: '1.2s', opacity: 0.25 },
        { size: 120, bottom: '15%', left: '40%', delay: '0.6s', opacity: 0.2 },
      ].map((orb, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: orb.size,
            height: orb.size,
            borderRadius: '50%',
            top: orb.top,
            left: orb.left,
            right: orb.right,
            bottom: orb.bottom,
            bgcolor: 'rgba(255,255,255,0.12)',
            filter: 'blur(2px)',
            animation: `${drift} ${8 + i * 2}s ease-in-out infinite`,
            animationDelay: orb.delay,
            opacity: orb.opacity,
          }}
        />
      ))}
    </Box>
  )
}
