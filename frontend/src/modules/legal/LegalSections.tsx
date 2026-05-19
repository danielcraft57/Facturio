import { Typography, Box } from '@mui/material'
import type { LegalSection } from './content'

export function LegalSections({ sections }: { sections: readonly LegalSection[] }) {
  return (
    <Box sx={{ '& > section + section': { mt: 4 } }}>
      {sections.map((section) => (
        <Box component="section" key={section.title}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            {section.title}
          </Typography>
          {section.paragraphs.map((p) => (
            <Typography key={p.slice(0, 48)} variant="body2" color="text.secondary" paragraph>
              {p}
            </Typography>
          ))}
          {section.bullets && section.bullets.length > 0 && (
            <Box component="ul" sx={{ m: 0, pl: 2.5, mb: 2 }}>
              {section.bullets.map((b) => (
                <Typography key={b} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {b}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  )
}
