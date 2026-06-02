import { prepareBrandedEmailForDelivery, shouldInlineEmailImages } from './email-inline-assets';
import { getEmailHeaderUrl, getEmailIconUrl } from './email-brand';

describe('email-inline-assets', () => {
	const prev = { ...process.env };

	afterEach(() => {
		process.env = { ...prev };
	});

	it('active l’inline sur localhost', () => {
		process.env.FRONTEND_URL = 'http://localhost:5173';
		process.env.EMAIL_IMAGES_INLINE = '';
		expect(shouldInlineEmailImages()).toBe(true);
	});

	it('remplace les URLs par cid quand les WebP existent', () => {
		process.env.FRONTEND_URL = 'http://localhost:5173';
		process.env.EMAIL_IMAGES_INLINE = 'true';
		const html = `<img src="${getEmailHeaderUrl('quote')}" /><img src="${getEmailIconUrl(48)}" />`;
		const { html: out, attachments } = prepareBrandedEmailForDelivery(html);
		expect(attachments.length).toBeGreaterThan(0);
		expect(out).toContain('cid:facturio-header-quote@facturio');
		expect(out).toMatch(/cid:facturio-icon-48@facturio|data:image\/webp/);
		expect(attachments.some((a) => a.filename === 'header-quote.webp')).toBe(true);
	});
});
