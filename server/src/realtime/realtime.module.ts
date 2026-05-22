import { Global, Module } from '@nestjs/common';
import { RealtimeEventsService } from './realtime-events.service';
import { RealtimeController } from './realtime.controller';

@Global()
@Module({
	controllers: [RealtimeController],
	providers: [RealtimeEventsService],
	exports: [RealtimeEventsService],
})
export class RealtimeModule {}
