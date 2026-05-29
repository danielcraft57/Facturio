export type LibraryVisual = {
  id: string;
  label: string;
  gradient: [string, string];
  emoji: string;
};

export const PRODUCT_VISUAL_LIBRARY: LibraryVisual[] = [
  { id: 'library:saas', label: 'SaaS', gradient: ['#4f46e5', '#7c3aed'], emoji: '☁️' },
  { id: 'library:web', label: 'Site web', gradient: ['#0ea5e9', '#06b6d4'], emoji: '🌐' },
  { id: 'library:ecommerce', label: 'E-commerce', gradient: ['#059669', '#10b981'], emoji: '🛒' },
  { id: 'library:mobile', label: 'Mobile', gradient: ['#db2777', '#f43f5e'], emoji: '📱' },
  { id: 'library:api', label: 'API', gradient: ['#d97706', '#f59e0b'], emoji: '🔌' },
  { id: 'library:design', label: 'Design', gradient: ['#7c3aed', '#ec4899'], emoji: '🎨' },
  { id: 'library:hosting', label: 'Hébergement', gradient: ['#1e3a8a', '#3b82f6'], emoji: '🖥️' },
  { id: 'library:seo', label: 'SEO', gradient: ['#047857', '#34d399'], emoji: '📈' },
  { id: 'library:payment', label: 'Paiement', gradient: ['#4338ca', '#6366f1'], emoji: '💳' },
  { id: 'library:support', label: 'Support', gradient: ['#b45309', '#fbbf24'], emoji: '🎧' },
  { id: 'library:security', label: 'Sécurité', gradient: ['#991b1b', '#ef4444'], emoji: '🔒' },
  { id: 'library:analytics', label: 'Analytics', gradient: ['#0f766e', '#2dd4bf'], emoji: '📊' },
  { id: 'library:ai-assistant', label: 'Assistant IA', gradient: ['#4c1d95', '#8b5cf6'], emoji: '🤖' },
  { id: 'library:automation', label: 'Automatisation', gradient: ['#1f2937', '#334155'], emoji: '⚙️' },
  { id: 'library:crm', label: 'CRM', gradient: ['#0f766e', '#14b8a6'], emoji: '🧩' },
  { id: 'library:newsletter', label: 'Newsletter', gradient: ['#1d4ed8', '#38bdf8'], emoji: '✉️' },
  { id: 'library:booking', label: 'Réservation', gradient: ['#be123c', '#fb7185'], emoji: '📅' },
  { id: 'library:monitoring', label: 'Monitoring', gradient: ['#7f1d1d', '#ef4444'], emoji: '📡' },
  { id: 'library:migration', label: 'Migration', gradient: ['#0f172a', '#1d4ed8'], emoji: '🔁' },
  { id: 'library:dashboard', label: 'Dashboard', gradient: ['#0369a1', '#22d3ee'], emoji: '📉' },
  { id: 'library:forms', label: 'Formulaires', gradient: ['#166534', '#4ade80'], emoji: '📝' },
  { id: 'library:marketplace', label: 'Marketplace', gradient: ['#854d0e', '#facc15'], emoji: '🏬' },
];

function buildLibrarySvg(item: LibraryVisual): string {
  const [c1, c2] = item.gradient;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
    </linearGradient></defs>
    <rect width="256" height="256" rx="24" fill="url(#g)"/>
    <text x="128" y="148" text-anchor="middle" font-size="72">${item.emoji}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const libraryDataUrlCache = new Map<string, string>();

export function getLibraryImageData(id: string): string | undefined {
  const item = PRODUCT_VISUAL_LIBRARY.find(v => v.id === id);
  if (!item) return undefined;
  if (!libraryDataUrlCache.has(id)) {
    libraryDataUrlCache.set(id, buildLibrarySvg(item));
  }
  return libraryDataUrlCache.get(id);
}

export function getLibraryItem(id: string): LibraryVisual | undefined {
  return PRODUCT_VISUAL_LIBRARY.find(v => v.id === id);
}
