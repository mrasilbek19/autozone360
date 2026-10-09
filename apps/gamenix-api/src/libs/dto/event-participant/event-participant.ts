import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { ParticipantStatus } from '../../enums/participant.enum';

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
}
