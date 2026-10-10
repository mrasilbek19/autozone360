import { Field, Int, InputType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { IsBoolean, IsDate, IsEnum, IsIn, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType, EventStatus } from '../../enums/event.enum';
import { Direction } from '../../enums/common.enum';
import { availableEventSorts } from '../../config';

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

@InputType()
export class EventSearch {
    @IsOptional()
    @IsEnum(EventType)
    @Field(() => EventType, { nullable: true })
    eventType?: EventType;

    @IsOptional()
    @IsEnum(EventStatus)
    @Field(() => EventStatus, { nullable: true })
    eventStatus?: EventStatus;

    @IsOptional()
    @IsMongoId()
    @Field(() => String, { nullable: true })
    eventOrganizer?: ObjectId;
}

@InputType()
export class EventsInquiry {
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
    @IsIn(availableEventSorts)
    @Field(() => String, { nullable: true })
    sort?: string;

    @IsOptional()
    @IsEnum(Direction)
    @Field(() => Direction, { nullable: true })
    direction?: Direction;

    @IsOptional()
    @ValidateNested()
    @Type(() => EventSearch)
    @Field(() => EventSearch, { nullable: true })
    search?: EventSearch;
}

@InputType()
export class ShopEventsInquiry extends EventsInquiry {
    @IsOptional()
    @IsBoolean()
    @Field(() => Boolean, { defaultValue: false })
    includeDeleted?: boolean;
}

@InputType()
export class AllEventsInquiry extends ShopEventsInquiry { }
