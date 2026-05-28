/** Texte légal / affichage pour factures issues d’un contrat d’engagement (acompte 10 %). */

export type InvoiceDocumentKind = 'standard' | 'deposit' | 'remainder';

export type EngagementBreakdown = {
	contractTotal: number;
	depositAmount: number;
	remainderAmount: number;
};

export function buildDepositCommitmentParagraph(dueDateFr?: string | null): string {
	if (dueDateFr) {
		return (
			`Facture d'acompte correspondant à 10 % (TTC) du devis accepté, ` +
			`à régler au plus tard le ${dueDateFr}. ` +
			`Le solde sera facturé séparément après réalisation / livraison, conformément au devis.`
		);
	}
	return (
		`Facture d'acompte correspondant à 10 % (TTC) du devis accepté. ` +
		`Le solde sera facturé séparément après réalisation / livraison, conformément au devis.`
	);
}

export function buildRemainderCommitmentParagraph(dueDateFr?: string | null): string {
	if (dueDateFr) {
		return (
			`Facture de solde — montant restant dû après règlement de l'acompte (10 % TTC), ` +
			`à régler au plus tard le ${dueDateFr}.`
		);
	}
	return `Facture de solde — montant restant dû après règlement de l'acompte (10 % TTC).`;
}

export function buildDepositPaymentNote(dueDateFr?: string | null): string {
	return dueDateFr
		? `Paiement acompte 10 % — à régler avant le ${dueDateFr} (carte bancaire en ligne).`
		: `Paiement acompte 10 % — carte bancaire en ligne.`;
}

export function resolveInvoiceDocumentPresentation(
	tags: string[],
	legalMention?: string | null,
	dueDate?: Date | string | null,
): {
	kind: InvoiceDocumentKind;
	titleLabel: string;
	commitmentParagraph: string | null;
} {
	const isDeposit = tags.includes('ACOMPTE_10');
	const isRemainder = tags.includes('SOLDE_APRES_ACOMPTE');
	const dueFr = dueDate ? new Date(dueDate).toLocaleDateString('fr-FR') : null;

	const kind: InvoiceDocumentKind = isDeposit ? 'deposit' : isRemainder ? 'remainder' : 'standard';

	const titleLabel = isDeposit
		? "Facture d'acompte (10 %)"
		: isRemainder
			? 'Facture de solde'
			: 'Facture';

	let commitmentParagraph: string | null = null;
	if (isDeposit) {
		commitmentParagraph = buildDepositCommitmentParagraph(dueFr);
	} else if (isRemainder) {
		commitmentParagraph = buildRemainderCommitmentParagraph(dueFr);
	}

	return { kind, titleLabel, commitmentParagraph };
}

export function mergeLegalMentions(commitment: string, vatMention?: string | null): string {
	const vat = vatMention?.trim();
	if (!vat) return commitment;
	if (commitment.includes(vat)) return commitment;
	return `${commitment}\n\n${vat}`;
}

/** Extrait l'ID devis depuis les tags split (ACOMPTE_10_OF / SOLDE_APRES_ACOMPTE_OF). */
export function parseQuoteIdFromSplitTags(tags: string[]): string | null {
	for (const tag of tags) {
		if (tag.startsWith('ACOMPTE_10_OF:')) return tag.slice('ACOMPTE_10_OF:'.length);
		if (tag.startsWith('SOLDE_APRES_ACOMPTE_OF:')) return tag.slice('SOLDE_APRES_ACOMPTE_OF:'.length);
	}
	return null;
}
