import { BadRequestException } from '@nestjs/common';
import { FilingCalculatorRegistry } from './filing-calculator.registry';
import { VatFilingCalculator } from './vat-filing.calculator';
import { IsFilingCalculator } from './is-filing.calculator';
import { CfeFilingCalculator } from './cfe-filing.calculator';

/**
 * Tests du registre de calculateurs fiscaux.
 */
describe('FilingCalculatorRegistry', () => {
	const vat = { supportedTypes: ['VAT_CA3', 'VAT_CA12'], calculate: jest.fn() };
	const isCalc = { supportedTypes: ['IS'], calculate: jest.fn() };
	const cfe = { supportedTypes: ['CFE'], calculate: jest.fn() };

	let registry: FilingCalculatorRegistry;

	beforeEach(() => {
		registry = new FilingCalculatorRegistry(
			vat as unknown as VatFilingCalculator,
			isCalc as unknown as IsFilingCalculator,
			cfe as unknown as CfeFilingCalculator,
		);
	});

	it('résout TVA, IS et CFE', () => {
		expect(registry.get('VAT_CA3')).toBe(vat);
		expect(registry.get('VAT_CA12')).toBe(vat);
		expect(registry.get('IS')).toBe(isCalc);
		expect(registry.get('CFE')).toBe(cfe);
	});

	it('refuse un type non supporté (URSSAF)', () => {
		expect(() => registry.get('URSSAF_MONTHLY')).toThrow(BadRequestException);
	});

	it('liste les types supportés', () => {
		expect(registry.supportedTypes().sort()).toEqual(
			['CFE', 'IS', 'VAT_CA3', 'VAT_CA12'].sort(),
		);
	});
});
