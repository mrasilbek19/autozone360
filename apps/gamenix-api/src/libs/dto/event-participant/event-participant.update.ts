import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ParticipantStatus } from '../../enums/participant.enum';

@InputType()
export class EventParticipantUpdate {
    @IsMongoId()
    @Field(() => String)
    _id: ObjectId;

    @IsOptional()
    @IsEnum(ParticipantStatus)
    @Field(() => ParticipantStatus, { nullable: true })
    participantStatus?: ParticipantStatus;
}
