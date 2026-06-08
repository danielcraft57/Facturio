import { describe, expect, it } from 'vitest';
import { isValidProductSku, suggestProductSkuFromName } from './productSku';

describe('suggestProductSkuFromName', () => {
  it('dérive un SKU multi-mots depuis le titre', () => {
    expect(suggestProductSkuFromName('Site vitrine WordPress')).toBe('SITE-VITRINE-WORDPRESS');
    expect(isValidProductSku('SITE-VITRINE-WORDPRESS')).toBe(true);
  });

  it('préfixe un mot unique pour respecter le format', () => {
    expect(suggestProductSkuFromName('voila')).toBe('PRD-VOILA');
    expect(isValidProductSku('PRD-VOILA')).toBe(true);
  });

  it('retire les accents', () => {
    expect(suggestProductSkuFromName('Intégration API')).toBe('INTEGRATION-API');
  });
});
