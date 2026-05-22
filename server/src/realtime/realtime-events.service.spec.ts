import { RealtimeEventsService } from './realtime-events.service';

describe('RealtimeEventsService', () => {
	it('émet un événement facture pour le bon flux', (done) => {
		const service = new RealtimeEventsService();
		const sub = service.stream(1).subscribe((msg) => {
			const data = JSON.parse(String(msg.data));
			if (data.resource === 'invoices' && data.action === 'created' && data.id === 42) {
				sub.unsubscribe();
				done();
			}
		});
		service.emit(1, 'invoices', 'created', 42);
	});
});
