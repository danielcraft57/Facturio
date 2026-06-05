import {
	EMAIL_BRAND,
	EMAIL_GRADIENT_CSS,
	getEmailHeaderUrl,
	getEmailIconUrl,
	getPublicAppBaseUrl,
	type EmailHeaderVariant,
} from './email-brand';

export type EmailButtonVariant = 'primary' | 'success' | 'secondary' | 'danger' | 'ghost';

const BUTTON_STYLES: Record<EmailButtonVariant, string> = {
	primary: `background:${EMAIL_BRAND.teal600};color:#ffffff;box-shadow:0 8px 22px rgba(13,148,136,0.35);`,
	success: `background:${EMAIL_BRAND.secondary};color:#ffffff;box-shadow:0 8px 22px rgba(4,120,87,0.35);`,
	secondary: `background:${EMAIL_BRAND.primary};color:#ffffff;box-shadow:0 8px 22px rgba(30,64,175,0.3);`,
	danger: `background:${EMAIL_BRAND.danger};color:#ffffff;box-shadow:0 8px 22px rgba(185,28,28,0.3);`,
	ghost: `background:#ffffff;color:${EMAIL_BRAND.text};border:1px solid ${EMAIL_BRAND.border};box-shadow:none;`,
};

export function emailButton(href: string, label: string, variant: EmailButtonVariant = 'primary'): string {
	return `
<table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0 8px;">
	<tr>
		<td style="border-radius:10px;${BUTTON_STYLES[variant]}">
			<a href="${href}" style="display:inline-block;padding:14px 28px;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;text-decoration:none;color:inherit;border-radius:10px;">
				${label}
			</a>
		</td>
	</tr>
</table>`;
}

export function emailButtonRow(
	buttons: { href: string; label: string; variant?: EmailButtonVariant }[],
): string {
	const cells = buttons
		.map((b, i) => {
			const pad = i < buttons.length - 1 ? 'padding-right:12px;' : '';
			return `<td style="${pad}">
			<a href="${b.href}" style="display:inline-block;padding:12px 22px;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;${BUTTON_STYLES[b.variant ?? (i === 0 ? 'primary' : 'ghost')]}}">
				${b.label}
			</a>
		</td>`;
		})
		.join('');
	return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0 8px;"><tr>${cells}</tr></table>`;
}

type BannerTone = 'info' | 'warning' | 'success' | 'neutral';

const BANNER_STYLES: Record<BannerTone, { bg: string; color: string; border: string }> = {
	info: { bg: EMAIL_BRAND.infoBg, color: EMAIL_BRAND.info, border: '#bfdbfe' },
	warning: { bg: EMAIL_BRAND.warningBg, color: EMAIL_BRAND.warning, border: '#fde68a' },
	success: { bg: EMAIL_BRAND.successBg, color: EMAIL_BRAND.success, border: '#a7f3d0' },
	neutral: { bg: EMAIL_BRAND.bgMuted, color: EMAIL_BRAND.textMuted, border: EMAIL_BRAND.border },
};

export function emailBanner(html: string, tone: BannerTone = 'info'): string {
	const s = BANNER_STYLES[tone];
	return `<p style="margin:16px 0;padding:12px 14px;background:${s.bg};border:1px solid ${s.border};border-radius:10px;color:${s.color};font-size:14px;line-height:1.5;">${html}</p>`;
}

export type EmailLayoutOptions = {
	title: string;
	/** Titre affiché sous le logo dans l’en-tête */
	headline?: string;
	headerVariant?: EmailHeaderVariant;
	contentHtml: string;
	footerHtml: string;
	trackPixel?: string;
	preheader?: string;
};

/**
 * Enveloppe HTML commune : bandeau WebP, logo, carte blanche, pied de page.
 */
export function renderFacturioEmailLayout(options: EmailLayoutOptions): string {
	const headline = options.headline ?? options.title;
	const headerUrl = getEmailHeaderUrl(options.headerVariant ?? 'default');
	const iconUrl = getEmailIconUrl(48);
	const iconUrl2x = getEmailIconUrl(96);
	const preheader = options.preheader
		? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${options.preheader}</div>`
		: '';
	const pixel = options.trackPixel
		? `<img src="${options.trackPixel}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;max-width:1px;min-width:1px;" />`
		: '';

	return `<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="color-scheme" content="light">
	<meta name="supported-color-schemes" content="light">
	<title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.bgPage};font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:${EMAIL_BRAND.text};-webkit-font-smoothing:antialiased;">
	${preheader}
	${pixel}
	<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${EMAIL_BRAND.bgPage};">
		<tr>
			<td align="center" style="padding:28px 16px;">
				<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:${EMAIL_BRAND.bgCard};border-radius:18px;overflow:hidden;box-shadow:0 20px 50px rgba(15,23,42,0.12);border:1px solid ${EMAIL_BRAND.borderSoft};">
					<tr>
						<td style="padding:0;line-height:0;font-size:0;">
							<img src="${headerUrl}" width="600" height="140" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
						</td>
					</tr>
					<tr>
						<td style="padding:20px 28px 8px;">
							<table role="presentation" cellpadding="0" cellspacing="0">
								<tr>
									<td style="vertical-align:middle;padding-right:14px;">
										<img src="${iconUrl}" srcset="${iconUrl} 1x, ${iconUrl2x} 2x" width="48" height="48" alt="Facturio" style="display:block;width:48px;height:48px;border-radius:12px;" />
									</td>
									<td style="vertical-align:middle;">
										<p style="margin:0;font-size:13px;font-weight:600;color:${EMAIL_BRAND.teal600};letter-spacing:0.04em;text-transform:uppercase;">Facturio</p>
										<h1 style="margin:4px 0 0;font-size:22px;font-weight:700;color:${EMAIL_BRAND.text};letter-spacing:-0.02em;line-height:1.25;">${escapeHtml(headline)}</h1>
									</td>
								</tr>
							</table>
						</td>
					</tr>
					<tr>
						<td style="padding:8px 28px 28px;font-size:15px;color:${EMAIL_BRAND.text};">
							${options.contentHtml}
						</td>
					</tr>
					<tr>
						<td style="padding:18px 28px 24px;border-top:1px solid ${EMAIL_BRAND.border};font-size:11px;color:${EMAIL_BRAND.textSoft};line-height:1.55;">
							${options.footerHtml}
							<p style="margin:12px 0 0;">Cet email a été envoyé automatiquement par <strong style="color:${EMAIL_BRAND.teal700};">Facturio</strong>.</p>
						</td>
					</tr>
				</table>
				<p style="margin:20px 0 0;font-size:11px;color:${EMAIL_BRAND.textSoft};text-align:center;">
					<a href="${getPublicAppBaseUrl()}" style="color:${EMAIL_BRAND.teal600};text-decoration:none;">facturio.danielcraft.fr</a>
				</p>
			</td>
		</tr>
	</table>
</body>
</html>`;
}

/** Montant mis en valeur */
export function emailAmountHighlight(amount: string, accent: 'teal' | 'success' | 'danger' = 'teal'): string {
	const color =
		accent === 'success' ? EMAIL_BRAND.success : accent === 'danger' ? EMAIL_BRAND.danger : EMAIL_BRAND.teal700;
	return `<p style="margin:12px 0;font-size:18px;font-weight:700;color:${color};">${amount}</p>`;
}

export function emailParagraph(text: string): string {
	return `<p style="margin:0 0 14px;color:${EMAIL_BRAND.text};font-size:15px;">${text}</p>`;
}

/** Encadré mentions juridiques (liste à puces, lisible dans les clients mail). */
export function emailLegalSection(title: string, items: string[]): string {
	const lis = items
		.map(
			(item) =>
				`<li style="margin:0 0 8px;color:${EMAIL_BRAND.textMuted};font-size:12px;line-height:1.55;">${item}</li>`,
		)
		.join('');
	return `<div style="margin:20px 0 0;padding:16px 18px;background:${EMAIL_BRAND.bgMuted};border:1px solid ${EMAIL_BRAND.border};border-radius:12px;">
<p style="margin:0 0 10px;font-size:12px;font-weight:700;color:${EMAIL_BRAND.text};letter-spacing:0.04em;text-transform:uppercase;">${title}</p>
<ul style="margin:0;padding-left:18px;">${lis}</ul>
</div>`;
}

export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/** Styles inline pour emails simples (remboursement, crédit) sans bandeau complet */
export function renderSimpleFacturioEmail(options: {
	title: string;
	headline: string;
	headerVariant?: EmailHeaderVariant;
	bodyHtml: string;
	footerHtml?: string;
	trackPixel?: string;
}): string {
	return renderFacturioEmailLayout({
		title: options.title,
		headline: options.headline,
		headerVariant: options.headerVariant ?? 'default',
		contentHtml: options.bodyHtml,
		footerHtml: options.footerHtml ?? '',
		trackPixel: options.trackPixel,
	});
}

export { EMAIL_BRAND, EMAIL_GRADIENT_CSS };
