import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { ObjectId } from 'mongoose';
import { ParticipantStatus } from '../../enums/participant.enum';

@InputType()
export class EventParticipantInput {
    @IsNotEmpty()
    @IsMongoId()
    @Field(() => String)
    eventId: ObjectId;

    memberId?: ObjectId;

    @IsOptional()
    @IsEnum(ParticipantStatus)
    @Field(() => ParticipantStatus, { nullable: true })
    participantStatus?: ParticipantStatus;
}
