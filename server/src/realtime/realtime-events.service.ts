import { Injectable } from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import { Observable, Subject, filter, interval, map, merge, of } from 'rxjs';
import type {
	RealtimeAction,
	RealtimeEventMeta,
	RealtimeEventPayload,
	RealtimeResource,
} from './realtime.types';

@Injectable()
export class RealtimeEventsService {
	private readonly bus = new Subject<{ organizationId: number; event: RealtimeEventPayload }>();

	/**
	 * Publie un événement métier pour toutes les connexions SSE de l’organisation.
	 */
	emit(
		organizationId: number,
		resource: RealtimeResource,
		action: RealtimeAction,
		id?: string,
		meta?: RealtimeEventMeta,
	): void {
		if (!organizationId) return;
		this.bus.next({
			organizationId,
			event: {
				resource,
				action,
				id,
				number: meta?.number,
				status: meta?.status,
				at: new Date().toISOString(),
			},
		});
	}

	/** Flux SSE filtré par organisation (heartbeat + événements métier). */
	stream(organizationId: number): Observable<MessageEvent> {
		const connected: MessageEvent = {
			data: JSON.stringify({ type: 'connected', organizationId }),
		};
		const heartbeat = interval(25_000).pipe(
			map(
				() =>
					({
						data: JSON.stringify({ type: 'heartbeat', at: new Date().toISOString() }),
					}) as MessageEvent,
			),
		);
		const events = this.bus.pipe(
			filter((m) => m.organizationId === organizationId),
			map((m) => ({ data: JSON.stringify(m.event) }) as MessageEvent),
		);
		return merge(of(connected), events, heartbeat);
	}
}
