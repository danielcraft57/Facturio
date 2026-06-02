import { summarizeEmailEvents } from './email-engagement.util';

describe('email-engagement.util', () => {
	it('ne marque pas emailSent sans événement SMTP sent', () => {
		const summary = summarizeEmailEvents([]);
		expect(summary.emailSent).toBe(false);
		expect(summary.sentAt).toBeNull();
	});

	it('agrège ouverture et clic', () => {
		const sentAt = new Date('2026-06-01T10:00:00Z');
		const summary = summarizeEmailEvents([
			{ type: 'sent', meta: null, createdAt: sentAt },
			{ type: 'opened', meta: null, createdAt: new Date('2026-06-01T11:00:00Z') },
			{
				type: 'clicked',
				meta: { action: 'accept' },
				createdAt: new Date('2026-06-01T11:05:00Z'),
			},
		]);
		expect(summary.emailSent).toBe(true);
		expect(summary.sentAt).toBe(sentAt.toISOString());
		expect(summary.opened).toBe(true);
		expect(summary.clicked).toBe(true);
		expect(summary.clickAction).toBe('accept');
		expect(summary.clickLabel).toBe('Accepter le devis');
	});
});
