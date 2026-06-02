import * as fs from 'fs';
import * as path from 'path';
import type { EmailHeaderVariant } from './email-brand';
import { resolvePublicAppBaseUrl } from './public-app-url';

const HEADER_FILES: Record<EmailHeaderVariant, string> = {
	default: 'header-default.webp',
	success: 'header-success.webp',
	warning: 'header-warning.webp',
	danger: 'header-danger.webp',
	quote: 'header-quote.webp',
};

export const EMAIL_CID = {
	header: (variant: EmailHeaderVariant) => `facturio-header-${variant}@facturio`,
	icon48: 'facturio-icon-48@facturio',
	icon96: 'facturio-icon-96@facturio',
} as const;

export type EmailInlineAttachment = {
	filename: string;
	content: Buffer;
	contentType: string;
	cid: string;
};

/** true en dev (localhost) ou si EMAIL_IMAGES_INLINE=true */
export function shouldInlineEmailImages(): boolean {
	const mode = process.env.EMAIL_IMAGES_INLINE?.trim().toLowerCase();
	if (mode === 'true' || mode === '1' || mode === 'yes') return true;
	if (mode === 'false' || mode === '0' || mode === 'no') return false;
	const base = resolvePublicAppBaseUrl();
	return /localhost|127\.0\.0\.1/i.test(base);
}

let assetsDirWarned = false;

function warnMissingAssetsDir(): void {
	if (assetsDirWarned) return;
	assetsDirWarned = true;
	console.warn(
		'[email-inline-assets] WebP introuvables (facturio-icon-48.webp). ' +
			'Générez-les : python scripts/email/generate_email_assets.py puis npm run build --prefix server',
	);
}

export function resolveEmailAssetsDir(): string | null {
	const candidates = [
		process.env.EMAIL_ASSETS_DIR?.trim(),
		path.join(__dirname, '..', 'email-assets'),
		path.join(process.cwd(), 'dist', 'common', 'email-assets'),
		path.join(process.cwd(), 'frontend', 'public', 'images', 'email'),
		path.join(process.cwd(), '..', 'frontend', 'public', 'images', 'email'),
		path.join(__dirname, '..', '..', '..', 'frontend', 'public', 'images', 'email'),
	].filter(Boolean) as string[];

	for (const dir of candidates) {
		const icon = path.join(dir, 'facturio-icon-48.webp');
		if (fs.existsSync(icon)) return dir;
	}
	return null;
}

function readAsset(filename: string): Buffer | null {
	const dir = resolveEmailAssetsDir();
	if (!dir) return null;
	const file = path.join(dir, filename);
	if (!fs.existsSync(file)) return null;
	return fs.readFileSync(file);
}

function loadInline(filename: string, cid: string): EmailInlineAttachment | null {
	const content = readAsset(filename);
	if (!content) return null;
	return {
		filename,
		content,
		contentType: 'image/webp',
		cid,
	};
}

/** Remplace les URLs /images/email/*.webp par des cid: et retourne les pièces jointes inline. */
export function prepareBrandedEmailForDelivery(html: string): {
	html: string;
	attachments: EmailInlineAttachment[];
} {
	if (!shouldInlineEmailImages()) {
		return { html, attachments: [] };
	}

	let out = html;
	const attachments: EmailInlineAttachment[] = [];
	const seen = new Set<string>();

	const attach = (filename: string, cid: string): boolean => {
		if (seen.has(cid)) return true;
		const inline = loadInline(filename, cid);
		if (!inline) {
			warnMissingAssetsDir();
			return false;
		}
		seen.add(cid);
		attachments.push(inline);
		return true;
	};

	const replaceAssetUrl = (filename: string, cid: string): void => {
		if (!out.includes(filename)) return;
		if (!attach(filename, cid)) return;
		const escaped = filename.replace(/\./g, '\\.');
		out = out.replace(
			new RegExp(`https?:\\/\\/[^"'\\s>]+\\/images\\/email\\/${escaped}`, 'gi'),
			`cid:${cid}`,
		);
	};

	for (const [variant, filename] of Object.entries(HEADER_FILES) as [EmailHeaderVariant, string][]) {
		replaceAssetUrl(filename, EMAIL_CID.header(variant));
	}
	replaceAssetUrl('facturio-icon-48.webp', EMAIL_CID.icon48);
	replaceAssetUrl('facturio-icon-96.webp', EMAIL_CID.icon96);

	if (attachments.some((a) => a.cid === EMAIL_CID.icon48)) {
		const cid48 = EMAIL_CID.icon48;
		const cid96 = attachments.some((a) => a.cid === EMAIL_CID.icon96)
			? EMAIL_CID.icon96
			: cid48;
		out = out.replace(/srcset="[^"]*"/gi, `srcset="cid:${cid48} 1x, cid:${cid96} 2x"`);
	}

	return { html: out, attachments };
}

/** Préviews locales (fichier file://) : images en base64. */
export function embedEmailImagesAsBase64(html: string): string {
	const dir = resolveEmailAssetsDir();
	if (!dir) return html;

	const toDataUrl = (filename: string): string | null => {
		const file = path.join(dir, filename);
		if (!fs.existsSync(file)) return null;
		return `data:image/webp;base64,${fs.readFileSync(file).toString('base64')}`;
	};

	let out = html;
	for (const filename of Object.values(HEADER_FILES)) {
		const data = toDataUrl(filename);
		if (!data) continue;
		out = out.replace(
			new RegExp(`https?:\\/\\/[^"'\\s>]+\\/images\\/email\\/${filename.replace(/\./g, '\\.')}`, 'gi'),
			data,
		);
	}

	const icon48 = toDataUrl('facturio-icon-48.webp');
	const icon96 = toDataUrl('facturio-icon-96.webp') ?? icon48;
	if (icon48) {
		out = out.replace(/https?:\/\/[^"'\\s>]+\/images\/email\/facturio-icon-48\.webp/gi, icon48);
		if (icon96) {
			out = out.replace(/https?:\/\/[^"'\\s>]+\/images\/email\/facturio-icon-96\.webp/gi, icon96);
		}
		out = out.replace(/srcset="[^"]*"/gi, `srcset="${icon48} 1x, ${icon96} 2x"`);
	}

	return out;
}
