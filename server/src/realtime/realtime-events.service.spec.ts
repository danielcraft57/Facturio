import { firstValueFrom } from 'rxjs';
import { filter, map, timeout } from 'rxjs/operators';
import { RealtimeEventsService } from './realtime-events.service';

describe('RealtimeEventsService', () => {
	it('émet un événement facture pour le bon flux', async () => {
		const service = new RealtimeEventsService();
		const eventId = 'clh9test00000000000000001';
		const streamPromise = firstValueFrom(
			service.stream(1).pipe(
				map((msg) => JSON.parse(String(msg.data)) as Record<string, unknown>),
				filter(
					(data) =>
						data.resource === 'invoices' &&
						data.action === 'created' &&
						data.id === eventId,
				),
				timeout(2000),
			),
		);
		service.emit(1, 'invoices', 'created', eventId);
		const data = await streamPromise;
		expect(data.resource).toBe('invoices');
		expect(data.action).toBe('created');
		expect(data.id).toBe(eventId);
	});
});
