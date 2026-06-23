import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';

type InvoiceForXml = {
	number: string;
	date: Date;
	dueDate: Date | null;
	currency: string;
	subtotal: unknown;
	tax: unknown;
	total: unknown;
	legalMention: string | null;
	lines: { description: string; quantity: unknown; unitPrice: unknown; total: unknown; taxRate: unknown }[];
	client: {
		name: string;
		companyName: string | null;
		siren: string | null;
		vatNumber: string | null;
		address: string | null;
		email: string;
		isCompany: boolean;
	};
	organization: {
		name: string | null;
		legalName: string | null;
		siret: string | null;
		siren: string | null;
		vatNumber: string | null;
		address: string | null;
		zipCode: string | null;
		city: string | null;
		countryCode: string | null;
		email: string | null;
	};
};

/**
 * Génère un XML structuré (profil simplifié EN 16931 / pré-Factur-X).
 * Phase 2 : intégration PDF/A-3 + validation schéma officiel + envoi PA.
 */
@Injectable()
export class FacturXGeneratorService {
	generate(invoice: InvoiceForXml): { xml: string; hash: string } {
		const issuerName = this.escape(invoice.organization.legalName || invoice.organization.name || '');
		const buyerName = this.escape(
			invoice.client.isCompany ? invoice.client.companyName || invoice.client.name : invoice.client.name,
		);
		const lines = invoice.lines
			.map(
				(line, i) => `
    <Line>
      <LineID>${i + 1}</LineID>
      <Description>${this.escape(line.description)}</Description>
      <Quantity>${Number(line.quantity)}</Quantity>
      <UnitPrice>${Number(line.unitPrice).toFixed(2)}</UnitPrice>
      <LineTotal>${Number(line.total).toFixed(2)}</LineTotal>
      <TaxRate>${Number(line.taxRate)}</TaxRate>
    </Line>`,
			)
			.join('');

		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<FacturioCrossIndustryInvoice xmlns="urn:facturio:einvoice:1.0" profile="EN16931-simplified">
  <ExchangedDocumentContext>
    <Guideline>PrestaFacture — brouillon format structuré EN 16931 (non certifié)</Guideline>
  </ExchangedDocumentContext>
  <ExchangedDocument>
    <ID>${this.escape(invoice.number)}</ID>
    <IssueDateTime>${invoice.date.toISOString().slice(0, 10)}</IssueDateTime>
    ${invoice.dueDate ? `<DueDate>${invoice.dueDate.toISOString().slice(0, 10)}</DueDate>` : ''}
    <Currency>${this.escape(invoice.currency || 'EUR')}</Currency>
  </ExchangedDocument>
  <Seller>
    <Name>${issuerName}</Name>
    <SIREN>${this.escape(invoice.organization.siren || '')}</SIREN>
    <SIRET>${this.escape(invoice.organization.siret || '')}</SIRET>
    <VAT>${this.escape(invoice.organization.vatNumber || '')}</VAT>
    <Address>${this.escape(invoice.organization.address || '')}</Address>
    <City>${this.escape(invoice.organization.city || '')}</City>
    <PostalCode>${this.escape(invoice.organization.zipCode || '')}</PostalCode>
    <Country>${this.escape(invoice.organization.countryCode || 'FR')}</Country>
  </Seller>
  <Buyer>
    <Name>${buyerName}</Name>
    <SIREN>${this.escape(invoice.client.siren || '')}</SIREN>
    <VAT>${this.escape(invoice.client.vatNumber || '')}</VAT>
    <Email>${this.escape(invoice.client.email)}</Email>
    <Address>${this.escape(invoice.client.address || '')}</Address>
  </Buyer>
  <Totals>
    <TaxExclusiveAmount>${Number(invoice.subtotal).toFixed(2)}</TaxExclusiveAmount>
    <TaxAmount>${Number(invoice.tax).toFixed(2)}</TaxAmount>
    <TaxInclusiveAmount>${Number(invoice.total).toFixed(2)}</TaxInclusiveAmount>
  </Totals>
  <Lines>${lines}
  </Lines>
  ${invoice.legalMention ? `<LegalMention>${this.escape(invoice.legalMention)}</LegalMention>` : ''}
</FacturioCrossIndustryInvoice>`;

		const hash = createHash('sha256').update(xml).digest('hex');
		return { xml, hash };
	}

	private escape(value: string): string {
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}
}
