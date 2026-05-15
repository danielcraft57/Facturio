const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'common', 'pdf', 'assets');
const dest = path.join(__dirname, '..', 'dist', 'common', 'pdf', 'assets');

if (!fs.existsSync(src)) {
	console.warn('[copy-pdf-assets] Aucun asset PDF source trouvé.');
	process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });
for (const file of fs.readdirSync(src)) {
	fs.copyFileSync(path.join(src, file), path.join(dest, file));
}
console.log('[copy-pdf-assets] Assets copiés vers dist/common/pdf/assets');
