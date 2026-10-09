import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventResolver } from './event.resolver';
import { EventService } from './event.service';
import EventSchema from '../../schemas/Event.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Event',
        schema: EventSchema,
      },
    ]),
  ],
  providers: [EventResolver, EventService],
  exports: [EventService],
})
export class EventModule { }
