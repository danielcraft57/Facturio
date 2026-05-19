import type { ProductKind } from '../../../types/product';

const KIND_GRADIENTS: Record<ProductKind, [string, string]> = {
  SAAS: ['#4f46e5', '#818cf8'],
  APP: ['#db2777', '#f472b6'],
  SERVICE: ['#0d9488', '#2dd4bf'],
  GOOD: ['#b45309', '#fbbf24'],
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function generateProductImage(name: string, kind: ProductKind = 'SERVICE'): string {
  const [c1, c2] = KIND_GRADIENTS[kind] ?? KIND_GRADIENTS.SERVICE;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, 256, 256, 24);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.arc(200, 56, 80, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials(name), 128, 138);

  return canvas.toDataURL('image/png');
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
