import { Field, Int, InputType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { IsDate, IsEnum, IsInt, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { EventType, EventStatus } from '../../enums/event.enum';

@InputType()
export class EventInput {
    @IsNotEmpty()
    @IsEnum(EventType)
    @Field(() => EventType)
    eventType: EventType;

    @IsOptional()
    @IsEnum(EventStatus)
    @Field(() => EventStatus, { nullable: true })
    eventStatus?: EventStatus;

    @IsNotEmpty()
    @IsString()
    @Field(() => String)
    eventTitle: string;

    @IsNotEmpty()
    @IsString()
    @Field(() => String)
    eventDesc: string;

    @IsNotEmpty()
    @IsString()
    @Field(() => String)
    eventGame: string;

    @IsNotEmpty()
    @IsString()
    @Field(() => String)
    eventImage: string;

    @IsNotEmpty()
    @IsDate()
    @Field(() => Date)
    eventDate: Date;

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Field(() => Int)
    eventMaxParticipants: number;

    eventOrganizer?: ObjectId;

    @IsNotEmpty()
    @IsDate()
    @Field(() => Date)
    eventStart: Date;

    @IsNotEmpty()
    @IsDate()
    @Field(() => Date)
    eventEnd: Date;

    @IsNotEmpty()
    @IsString()
    @Field(() => String)
    eventPrize: string;
}
