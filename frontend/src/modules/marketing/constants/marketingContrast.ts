/** Bandes de contraste landing (hero = vert, preuve = sombre, tarifs = clair accentué). */
export const MARKETING_CONTRAST_BAND = {
  proof: {
    background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
    color: '#f8fafc',
    subtitleColor: 'rgba(248, 250, 252, 0.78)',
  },
  pricing: {
    background: 'linear-gradient(180deg, #ecfdf5 0%, #f8fafc 55%, #ffffff 100%)',
    borderTop: '4px solid #0d9488',
    titleColor: '#134e4a',
  },
} as const
