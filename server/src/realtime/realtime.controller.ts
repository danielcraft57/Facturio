import { Controller, Req, Sse, UnauthorizedException } from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RealtimeEventsService } from './realtime-events.service';

@Controller('realtime')
export class RealtimeController {
	constructor(private readonly realtime: RealtimeEventsService) {}

	/**
	 * SSE — mises à jour factures / devis pour l’organisation de l’utilisateur connecté.
	 * Auth : cookie access_token, Bearer ou ?access_token= (EventSource navigateur).
	 */
	@Sse('stream')
	stream(@Req() req: { user?: { organizationId?: number } }): Observable<MessageEvent> {
		const organizationId = req.user?.organizationId;
		if (!organizationId) {
			throw new UnauthorizedException('Organisation introuvable pour le flux temps réel');
		}
		return this.realtime.stream(organizationId);
	}
}
