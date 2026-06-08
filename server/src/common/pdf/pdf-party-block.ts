import type { PdfCompanyInfo, PdfDocumentKind } from './pdf-theme';
import { PDF_THEME } from './pdf-theme';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfDoc = any;

export interface PdfPartyContent {
	roleLabel: string;
	title: string;
	subtitle?: string;
	bodyLines: string[];
	idLines: string[];
	logo?: string | null;
}

export function normalizeContactText(value: unknown): string {
	if (value == null) return '';
	if (Array.isArray(value)) {
		return value.map(normalizeContactText).filter(Boolean).join('\n');
	}
	return String(value).trim();
}

export function splitAddressLines(address: unknown): string[] {
	const raw = normalizeContactText(address);
	if (!raw) return [];
	return raw
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter(Boolean);
}

/** Bloc émetteur — nom commercial prioritaire, identité légale en sous-titre (art. 242 nonies CGI). */
export function buildEmitterParty(
	company: PdfCompanyInfo,
	_kind: PdfDocumentKind,
): PdfPartyContent {
	const subtitleParts: string[] = [];
	if (company.legalName?.trim() && company.legalName.trim() !== company.name.trim()) {
		subtitleParts.push(company.legalName.trim());
	}
	if (company.legalForm?.trim()) subtitleParts.push(company.legalForm.trim());
	if (company.capital) subtitleParts.push(`au capital de ${company.capital}`);

	const bodyLines = splitAddressLines(company.address);
	if (company.phone?.trim()) {
		bodyLines.push(`Tél. : ${normalizeContactText(company.phone)}`);
	}
	if (company.email?.trim()) bodyLines.push(normalizeContactText(company.email));
	if (company.website?.trim()) bodyLines.push(normalizeContactText(company.website));

	const idLines: string[] = [];
	if (company.siret?.trim()) idLines.push(`SIRET : ${company.siret.trim()}`);
	if (company.rcs?.trim()) idLines.push(company.rcs.trim());
	if (company.vat?.trim()) {
		idLines.push(`N° TVA intracommunautaire : ${company.vat.trim()}`);
	}
	if (company.apeCode?.trim()) idLines.push(`APE : ${company.apeCode.trim()}`);

	return {
		roleLabel: 'Émetteur',
		title: company.name.trim() || '—',
		subtitle: subtitleParts.length ? subtitleParts.join(' · ') : undefined,
		bodyLines,
		idLines,
		logo: company.logo,
	};
}

/** Bloc destinataire — client / facturé à (SIRET & TVA si professionnel). */
export function buildRecipientParty(
	client: Record<string, unknown> | null | undefined,
	kind: PdfDocumentKind,
): PdfPartyContent | null {
	if (!client) return null;

	const title = String(
		client.companyName || client.name || '—',
	).trim();

	const bodyLines = splitAddressLines(client.address);
	if (client.email) bodyLines.push(normalizeContactText(client.email));
	if (client.phone) bodyLines.push(`Tél. : ${normalizeContactText(client.phone)}`);

	const idLines: string[] = [];
	if (client.isCompany && client.siret) {
		idLines.push(`SIRET : ${normalizeContactText(client.siret)}`);
	}
	if (client.isCompany && client.vatNumber) {
		idLines.push(
			`N° TVA intracommunautaire : ${normalizeContactText(client.vatNumber)}`,
		);
	}

	return {
		roleLabel: kind === 'facture' ? 'Facturé à' : 'Client',
		title,
		bodyLines,
		idLines,
	};
}

export function measurePartyBlockHeight(
	doc: PdfDoc,
	party: PdfPartyContent,
	width: number,
	logoReserved = 0,
): number {
	let h = logoReserved;
	doc.font('Helvetica-Bold').fontSize(8);
	h += doc.heightOfString(party.roleLabel.toUpperCase(), { width }) + 4;
	doc.fontSize(11);
	h += doc.heightOfString(party.title, { width, lineGap: 1 }) + 2;
	if (party.subtitle) {
		doc.fontSize(8);
		h += doc.heightOfString(party.subtitle, { width, lineGap: 1 }) + 4;
	}
	doc.fontSize(9);
	for (const line of party.bodyLines) {
		h += doc.heightOfString(line, { width, lineGap: 2 }) + 2;
	}
	doc.fontSize(8);
	for (const line of party.idLines) {
		h += doc.heightOfString(line, { width, lineGap: 1 }) + 2;
	}
	return h + 4;
}

export function drawPartyBlock(
	doc: PdfDoc,
	party: PdfPartyContent,
	x: number,
	y: number,
	width: number,
	embedLogo?: (logo: string, lx: number, ly: number, size: number) => boolean,
): number {
	let cy = y;
	const lineGapBody = 2;
	const lineGapId = 1;

	if (party.logo && embedLogo?.(party.logo, x + width - 52, y, 48)) {
		cy = Math.max(cy, y + 52);
	}

	doc.font('Helvetica-Bold')
		.fontSize(8)
		.fillColor(PDF_THEME.textMuted)
		.text(party.roleLabel.toUpperCase(), x, cy, { width });
	cy = doc.y + 4;

	doc.font('Helvetica-Bold')
		.fontSize(11)
		.fillColor(PDF_THEME.navy)
		.text(party.title, x, cy, { width, lineGap: 1 });
	cy = doc.y + 2;

	if (party.subtitle) {
		doc.font('Helvetica')
			.fontSize(8)
			.fillColor(PDF_THEME.textMuted)
			.text(party.subtitle, x, cy, { width, lineGap: 1 });
		cy = doc.y + 4;
	}

	doc.font('Helvetica').fontSize(9).fillColor(PDF_THEME.textDark);
	for (const line of party.bodyLines) {
		doc.text(line, x, cy, { width, lineGap: lineGapBody });
		cy = doc.y + lineGapBody;
	}

	if (party.idLines.length) {
		doc.fontSize(8).fillColor(PDF_THEME.textMuted);
		for (const line of party.idLines) {
			doc.text(line, x, cy, { width, lineGap: lineGapId });
			cy = doc.y + lineGapId;
		}
	}

	return cy - y + 4;
}
