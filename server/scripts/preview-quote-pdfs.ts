/**
 * Génère des PDF de devis d’exemple (local).
 *
 * Usage (depuis server/) :
 *   npm run preview:quote-pdfs
 *   start tmp/quote-pdf-previews/index.html
 */
import * as fs from 'fs';
import * as path from 'path';
const PDFDocument = require('pdfkit');
import { PdfDocumentBuilder, resolveCompanyInfo } from '../src/common/pdf/pdf-document.builder';
import { buildProductQuoteLineDisplay } from '../src/products/product-quote-description.util';

const OUT = path.join(__dirname, '../tmp/quote-pdf-previews');

const sampleOrg = {
	name: 'DanielCraft',
	legalName: 'Loïc Daniel',
	address: '12 rue Example',
	zipCode: '57000',
	city: 'Metz',
	country: 'France',
	countryCode: 'FR',
	phone: '06 12 34 56 78',
	email: 'contact@danielcraft.fr',
	website: 'https://danielcraft.fr',
	siret: '12345678901234',
	companyStatus: 'AUTO_ENTREPRENEUR',
	signature: null as string | null,
};

const sampleClient = {
	name: 'Société Dupont',
	email: 'facturation@dupont.fr',
	address: '10 avenue de la Gare\n57000 Metz',
};

type PreviewItem = { id: string; label: string; file: string };

async function renderPdf(
	id: string,
	label: string,
	lines: Array<Record<string, unknown>>,
	opts?: {
		signature?: string | null;
		kind?: 'devis' | 'facture';
		number?: string;
		document?: Record<string, unknown>;
	},
): Promise<PreviewItem> {
	const kind = opts?.kind ?? 'devis';
	const builder = new PdfDocumentBuilder();
	const company = resolveCompanyInfo(sampleOrg);

	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({
			size: 'A4',
			margins: { top: 0, bottom: 50, left: 0, right: 0 },
		});
		const chunks: Buffer[] = [];
		doc.on('data', (c: Buffer) => chunks.push(c));
		doc.on('end', () => {
			const file = `${id}.pdf`;
			fs.writeFileSync(path.join(OUT, file), Buffer.concat(chunks));
			resolve({ id, label, file });
		});
		doc.on('error', reject);

		builder.build(doc, {
			kind,
			number:
				opts?.number ??
				(kind === 'facture'
					? 'FAC-2026-0001'
					: `DEV-2026-${id === 'devis-stack' ? '0008' : '0007'}`),
			date: new Date('2026-06-08'),
			expiryDate: kind === 'devis' ? new Date('2026-07-08') : undefined,
			company,
			client: sampleClient,
			lines,
			totals: { subtotal: 2500, tax: 500, total: 3000 },
			organization: sampleOrg,
			document: opts?.document ?? {},
			signature: opts?.signature ?? sampleOrg.signature,
		});
		doc.end();
	});
}

async function main(): Promise<void> {
	fs.mkdirSync(OUT, { recursive: true });

	const stackDisplay = buildProductQuoteLineDisplay({
		name: 'MVP SaaS React + NestJS',
		description:
			'Application métier sur mesure : devis, factures et tableau de bord pour votre activité.',
		details: [
			{ label: 'Authentification sécurisée', amount: 600, hours: 8 },
			{ label: 'API REST documentée', amount: 900, hours: 12 },
			{ label: 'Dashboard administrateur', amount: 700, hours: 10 },
			{ label: 'Tests de base inclus', amount: 300, hours: 4 },
		],
		techStack: {
			languages: ['TypeScript'],
			frontend: ['React'],
			backend: ['NestJS', 'Node.js'],
			databases: ['PostgreSQL'],
			devops: ['Docker'],
		},
	});

	const items = await Promise.all([
		renderPdf('devis-simple', 'Devis — ligne simple (sans techno)', [
			{
				description: 'Prestation ponctuelle',
				unitPrice: 2500,
				quantity: 1,
				taxRate: 0.2,
			},
		]),
		renderPdf('devis-stack', 'Devis — produit avec stack expliquée', [
			{
				description: 'MVP SaaS React + NestJS',
				unitPrice: 2500,
				quantity: 1,
				taxRate: 0.2,
				quoteLineDisplay: stackDisplay,
			},
		]),
		renderPdf(
			'devis-sans-signature',
			'Devis — sans cadre signature',
			[
				{
					description: 'Site vitrine professionnel',
					unitPrice: 2500,
					quantity: 1,
					taxRate: 0.2,
					quoteLineDisplay: buildProductQuoteLineDisplay({
						name: 'Site vitrine professionnel',
						description: 'Site web WordPress',
						details: [
							{ label: 'Conception & maquettes', amount: 800, hours: 12 },
							{ label: 'Intégration WordPress', amount: 1200, hours: 18 },
							{ label: 'Mise en ligne & formation', amount: 500, hours: 6 },
						],
						techStack: {
							languages: ['HTML / CSS'],
							cms: ['WordPress'],
							databases: ['MySQL / MariaDB'],
						},
					}),
				},
			],
			{ signature: null },
		),
		renderPdf(
			'facture-simple',
			'Facture — même mise en page parties',
			[
				{
					description: 'Site vitrine professionnel',
					unitPrice: 2500,
					quantity: 1,
					taxRate: 0.2,
				},
			],
			{
				kind: 'facture',
				number: 'FAC-2026-0042',
				document: { dueDate: new Date('2026-07-08') },
			},
		),
	]);

	const links = items
		.map(
			(item) =>
				`<li><a href="./${item.file}">${item.label}</a> — <code>${item.file}</code></li>`,
		)
		.join('\n');

	const index = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Exemples devis PDF</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;line-height:1.5}
code{background:#f1f5f9;padding:2px 6px;border-radius:4px}</style></head>
<body>
<h1>Exemples devis PDF (local)</h1>
<p>Palette Facturio (#0f172a), stack expliquée en langage simple, signature masquée si absente.</p>
<ul>${links}</ul>
</body></html>`;

	fs.writeFileSync(path.join(OUT, 'index.html'), index, 'utf8');
	console.log(`PDF générés dans ${OUT}`);
	for (const item of items) {
		console.log(`  - ${item.file}`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
