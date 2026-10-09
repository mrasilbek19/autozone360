import { Field, Int, InputType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { IsDate, IsEnum, IsInt, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { EventType, EventStatus } from '../../enums/event.enum';

@InputType()
export class EventUpdate {
    @IsMongoId()
    @Field(() => String)
    _id: ObjectId;

    @IsOptional()
    @IsEnum(EventType)
    @Field(() => EventType, { nullable: true })
    eventType?: EventType;

    @IsOptional()
    @IsEnum(EventStatus)
    @Field(() => EventStatus, { nullable: true })
    eventStatus?: EventStatus;

    @IsOptional()
    @IsString()
    @Field(() => String, { nullable: true })
    eventTitle?: string;

    @IsOptional()
    @IsString()
    @Field(() => String, { nullable: true })
    eventDesc?: string;

    @IsOptional()
    @IsString()
    @Field(() => String, { nullable: true })
    eventGame?: string;

    @IsOptional()
    @IsString()
    @Field(() => String, { nullable: true })
    eventImage?: string;

    @IsOptional()
    @IsDate()
    @Field(() => Date, { nullable: true })
    eventDate?: Date;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Field(() => Int, { nullable: true })
    eventMaxParticipants?: number;

    @IsOptional()
    @IsDate()
    @Field(() => Date, { nullable: true })
    eventStart?: Date;

    @IsOptional()
    @IsDate()
    @Field(() => Date, { nullable: true })
    eventEnd?: Date;

    @IsOptional()
    @IsString()
    @Field(() => String, { nullable: true })
    eventPrize?: string;
}
