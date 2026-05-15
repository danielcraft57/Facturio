import * as fs from 'fs';
import * as path from 'path';

const HEADER_FILENAME = 'pdf-header-wave.png';

/** Résout le chemin d'un asset PDF (dist ou src en dev). */
export function resolvePdfAsset(filename: string): string | null {
	const candidates = [
		path.join(__dirname, 'assets', filename),
		path.join(__dirname, '..', '..', 'common', 'pdf', 'assets', filename),
		path.join(process.cwd(), 'src', 'common', 'pdf', 'assets', filename),
		path.join(process.cwd(), 'dist', 'common', 'pdf', 'assets', filename)
	];
	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) return candidate;
	}
	return null;
}

export function getHeaderWaveImagePath(): string | null {
	return resolvePdfAsset(HEADER_FILENAME);
}
