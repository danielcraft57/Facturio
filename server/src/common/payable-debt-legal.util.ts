import { emailBanner, emailLegalSection } from './email-layout';

type OrgProfile = Record<string, unknown> | null | undefined;

/** Mentions juridiques informatives (reconnaissance de dette — droit civil français). */
export const PAYABLE_DEBT_LEGAL_BULLETS = [
	'<strong>Reconnaissance :</strong> le débiteur reconnaît devoir au créancier le montant et le motif indiqués. Une reconnaissance de dette par le débiteur interrompt la prescription (art.&nbsp;2240&nbsp;C.&nbsp;civ.).',
	'<strong>Prescription :</strong> sauf interruption ou suspension, la créance se prescrit en principe au bout de <strong>cinq ans</strong> à compter d’un fait permettant de la faire valoir (art.&nbsp;2224&nbsp;C.&nbsp;civ.).',
	'<strong>Échéance :</strong> la date convenue, le cas échéant, est une échéance contractuelle entre les parties ; elle ne remplace pas les règles légales de prescription.',
	'<strong>Intérêts :</strong> aucun intérêt ni indemnité forfaitaire n’est dû par défaut, sauf accord écrit contraire ou texte applicable (ex. créances commerciales B2B, art.&nbsp;L.&nbsp;441-10&nbsp;C.&nbsp;com.).',
	'<strong>Remboursement :</strong> les modalités (virement, espèces, etc.) sont convenues directement entre les parties. Ce message ne constitue pas un titre exécutoire.',
	'<strong>Valeur probante :</strong> ce courriel et le document en ligne constituent une trace écrite ; pour un litige important, un acte complémentaire peut être utile.',
] as const;

export const PAYABLE_DEBT_LEGAL_BULLETS_PLAIN = [
	'Reconnaissance : le débiteur reconnaît devoir au créancier le montant et le motif indiqués. Reconnaissance = interruption de prescription (art. 2240 C. civ.).',
	'Prescription : créance prescrite en principe au bout de cinq ans (art. 2224 C. civ.), sauf interruption ou suspension.',
	'Échéance : date convenue entre les parties, sans effet sur la prescription légale.',
	'Intérêts : aucun intérêt par défaut, sauf accord écrit ou texte applicable.',
	'Remboursement : modalités convenues entre les parties ; pas de titre exécutoire.',
	'Valeur probante : trace écrite ; acte complémentaire possible en cas de litige.',
] as const;

export function buildPayableDebtRgpdLine(organization?: OrgProfile): string {
	const controller =
		(organization?.legalName as string | undefined)?.trim() ||
		(organization?.name as string | undefined)?.trim() ||
		"l'émetteur";
	const email =
		(organization?.dataControllerEmail as string | undefined)?.trim() ||
		(organization?.email as string | undefined)?.trim();
	const privacy = (organization?.privacyPolicyUrl as string | undefined)?.trim();
	let line = `<strong>Données personnelles (RGPD) :</strong> vos coordonnées et les montants sont traités par ${controller} pour la reconnaissance et le suivi de cette dette.`;
	if (privacy) {
		line += ` <a href="${privacy}" style="color:inherit;">Politique de confidentialité</a>.`;
	} else if (email) {
		line += ` Pour exercer vos droits : ${email}.`;
	} else {
		line += ` Pour exercer vos droits, contactez l'émetteur (coordonnées ci-dessous).`;
	}
	return line;
}

export function buildPayableDebtRgpdLinePlain(organization?: OrgProfile): string {
	const controller =
		(organization?.legalName as string | undefined)?.trim() ||
		(organization?.name as string | undefined)?.trim() ||
		"l'émetteur";
	const email =
		(organization?.dataControllerEmail as string | undefined)?.trim() ||
		(organization?.email as string | undefined)?.trim();
	let line = `Données personnelles : traitement par ${controller} pour le suivi de la dette.`;
	if (email) line += ` Contact RGPD : ${email}.`;
	return line;
}

/** Bloc HTML « Informations juridiques » pour l’email de reconnaissance. */
export function buildPayableDebtEmailLegalHtml(organization?: OrgProfile): string {
	return (
		emailBanner(
			'Document informatif de reconnaissance de dette — sans conseil juridique. En cas de montant élevé ou de litige, consultez un professionnel.',
			'warning',
		) +
		emailLegalSection('Informations juridiques', [...PAYABLE_DEBT_LEGAL_BULLETS, buildPayableDebtRgpdLine(organization)])
	);
}

export function buildPayableDebtEmailLegalPlain(organization?: OrgProfile): string {
	return (
		'--- Informations juridiques ---\n' +
		PAYABLE_DEBT_LEGAL_BULLETS_PLAIN.map((b) => `• ${b}`).join('\n') +
		'\n' +
		buildPayableDebtRgpdLinePlain(organization) +
		'\n'
	);
}
