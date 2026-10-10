import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsIn, IsInt, IsMongoId, IsNotEmpty, IsOptional, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectId } from 'mongoose';
import { ParticipantStatus } from '../../enums/participant.enum';
import { Direction } from '../../enums/common.enum';

@InputType()
export class EventParticipantInput {
    @IsNotEmpty()
    @IsMongoId()
    @Field(() => String)
    eventId: ObjectId;

    memberId?: ObjectId;
}

@InputType()
export class ParticipantSearch {
    @IsOptional()
    @IsMongoId()
    @Field(() => String, { nullable: true })
    eventId?: ObjectId;

    @IsOptional()
    @IsEnum(ParticipantStatus)
    @Field(() => ParticipantStatus, { nullable: true })
    participantStatus?: ParticipantStatus;
}

@InputType()
export class EventParticipantsInquiry {
    @IsInt()
    @Min(1)
    @Field(() => Int)
    page: number;

    @IsInt()
    @Min(1)
    @Max(100)
    @Field(() => Int)
    limit: number;

    @IsOptional()
    @IsIn(['createdAt', 'updatedAt'])
    @Field(() => String, { nullable: true })
    sort?: string;

    @IsOptional()
    @IsEnum(Direction)
    @Field(() => Direction, { nullable: true })
    direction?: Direction;

    @IsOptional()
    @ValidateNested()
    @Type(() => ParticipantSearch)
    @Field(() => ParticipantSearch, { nullable: true })
    search?: ParticipantSearch;
}
