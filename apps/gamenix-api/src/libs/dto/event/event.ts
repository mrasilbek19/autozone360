import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { EventType, EventStatus } from '../../enums/event.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Event {
    @Field(() => String)
    _id: ObjectId;

    @Field(() => EventType)
    eventType: EventType;

    @Field(() => EventStatus)
    eventStatus: EventStatus;

    @Field(() => String)
    eventTitle: string;

    @Field(() => String)
    eventDesc: string;

    @Field(() => String)
    eventGame: string;

    @Field(() => String)
    eventImage: string;

    @Field(() => Date)
    eventDate: Date;

    @Field(() => Int)
    eventMaxParticipants: number;

    @Field(() => String)
    eventOrganizer: ObjectId;

    @Field(() => Date)
    eventStart: Date;

    @Field(() => Date)
    eventEnd: Date;

    @Field(() => String)
    eventPrize: string;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;

    @Field(() => Date, { nullable: true })
    deletedAt?: Date;
}

@ObjectType()
export class Events {
    @Field(() => [Event])
    list: Event[];

    @Field(() => [TotalCounter], { nullable: true })
    metaCounter: TotalCounter[];
}
