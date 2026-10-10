import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { ParticipantStatus } from '../../enums/participant.enum';
import { Member, TotalCounter } from '../member/member';
import { Event } from '../event/event';

@ObjectType()
export class EventParticipant {
    @Field(() => String)
    _id: ObjectId;

    @Field(() => String)
    eventId: ObjectId;

    @Field(() => String)
    memberId: ObjectId;

    @Field(() => ParticipantStatus)
    participantStatus: ParticipantStatus;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;

    @Field(() => Event, { nullable: true })
    eventData?: Event;

    @Field(() => Member, { nullable: true })
    memberData?: Member;
}

@ObjectType()
export class EventParticipants {
    @Field(() => [EventParticipant])
    list: EventParticipant[];

    @Field(() => [TotalCounter], { nullable: true })
    metaCounter: TotalCounter[];
}
