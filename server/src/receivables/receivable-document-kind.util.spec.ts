import { resolveReceivableDocumentKind } from './receivable-document-kind.util';

describe('resolveReceivableDocumentKind', () => {
	it('détecte acompte et solde', () => {
		expect(resolveReceivableDocumentKind(JSON.stringify(['ACOMPTE_10']))).toBe('deposit');
		expect(resolveReceivableDocumentKind(JSON.stringify(['SOLDE_APRES_ACOMPTE']))).toBe('remainder');
		expect(resolveReceivableDocumentKind(null)).toBe('standard');
	});
});
