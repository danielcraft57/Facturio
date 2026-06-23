const fs = require('fs');
const path = require('path');

const roots = [
	path.join(__dirname, '..', '..', 'frontend', 'public', 'images', 'email'),
	path.join(__dirname, '..', 'frontend', 'public', 'images', 'email'),
];

const src = roots.find((d) => fs.existsSync(path.join(d, 'prestafacture-icon-48.webp')));
const dest = path.join(__dirname, '..', 'dist', 'common', 'email-assets');

if (!src) {
	console.warn('[copy-email-assets] WebP introuvables — exécutez: python scripts/email/generate_email_assets.py');
	process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });
for (const file of fs.readdirSync(src)) {
	if (!file.endsWith('.webp')) continue;
	fs.copyFileSync(path.join(src, file), path.join(dest, file));
}
console.log(`[copy-email-assets] ${fs.readdirSync(dest).length} fichier(s) → dist/common/email-assets`);
