export type RealtimeResource = 'invoices' | 'quotes';

export type RealtimeAction = 'created' | 'updated' | 'deleted' | 'sent' | 'paid';

export interface RealtimeEventMeta {
	number?: string;
	status?: string;
}

export interface RealtimeEventPayload {
	type?: 'connected' | 'heartbeat';
	resource?: RealtimeResource;
	action?: RealtimeAction;
	id?: string;
	number?: string;
	status?: string;
	at?: string;
}
