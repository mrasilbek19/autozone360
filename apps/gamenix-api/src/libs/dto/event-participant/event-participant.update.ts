import { Field, InputType } from '@nestjs/graphql';
import { IsIn, IsMongoId } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ParticipantStatus } from '../../enums/participant.enum';

@InputType()
export class EventParticipantUpdate {
    @IsMongoId()
    @Field(() => String)
    _id: ObjectId;

    @IsIn([ParticipantStatus.REGISTERED, ParticipantStatus.REJECTED])
    @Field(() => ParticipantStatus)
    participantStatus: ParticipantStatus;
}
