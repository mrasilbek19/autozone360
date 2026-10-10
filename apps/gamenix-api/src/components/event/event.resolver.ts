import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { EventService } from './event.service';
import { Event, Events } from '../../libs/dto/event/event';
import { AllEventsInquiry, EventInput, EventsInquiry, ShopEventsInquiry } from '../../libs/dto/event/event.input';
import { EventUpdate } from '../../libs/dto/event/event.update';
import { EventParticipant, EventParticipants } from '../../libs/dto/event-participant/event-participant';
import { EventParticipantInput, EventParticipantsInquiry } from '../../libs/dto/event-participant/event-participant.input';
import { EventParticipantUpdate } from '../../libs/dto/event-participant/event-participant.update';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';

@Resolver()
export class EventResolver {
    constructor(private readonly eventService: EventService) { }

    @Roles(MemberType.SHOP)
    @UseGuards(RolesGuard)
    @Mutation(() => Event)
    public async createEvent(
        @Args('input') input: EventInput,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Event> {
        console.log('Mutation: createEvent');
        return await this.eventService.createEvent(memberId, input);
    }

    @Query(() => Events)
    public async getEvents(@Args('input') input: EventsInquiry): Promise<Events> {
        console.log('Query: getEvents');
        return await this.eventService.getEvents(input);
    }

    @Query(() => Event)
    public async getEvent(@Args('eventId') eventId: string): Promise<Event> {
        console.log('Query: getEvent');
        return await this.eventService.getEvent(shapeIntoMongoObjectId(eventId));
    }

    @Roles(MemberType.SHOP)
    @UseGuards(RolesGuard)
    @Query(() => Events)
    public async getMyEvents(
        @Args('input') input: ShopEventsInquiry,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Events> {
        console.log('Query: getMyEvents');
        return await this.eventService.getMyEvents(memberId, input);
    }

    @Roles(MemberType.SHOP)
    @UseGuards(RolesGuard)
    @Mutation(() => Event)
    public async updateEvent(
        @Args('input') input: EventUpdate,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Event> {
        console.log('Mutation: updateEvent');
        return await this.eventService.updateEvent(memberId, input);
    }

    @Roles(MemberType.SHOP)
    @UseGuards(RolesGuard)
    @Mutation(() => Event)
    public async finishEvent(
        @Args('eventId') eventId: string,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Event> {
        console.log('Mutation: finishEvent');
        return await this.eventService.finishEvent(memberId, shapeIntoMongoObjectId(eventId));
    }

    @Roles(MemberType.SHOP)
    @UseGuards(RolesGuard)
    @Mutation(() => Event)
    public async removeEvent(
        @Args('eventId') eventId: string,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Event> {
        console.log('Mutation: removeEvent');
        return await this.eventService.removeEvent(memberId, shapeIntoMongoObjectId(eventId));
    }

    @Roles(MemberType.USER)
    @UseGuards(RolesGuard)
    @Mutation(() => EventParticipant)
    public async registerEvent(
        @Args('input') input: EventParticipantInput,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<EventParticipant> {
        console.log('Mutation: registerEvent');
        return await this.eventService.registerEvent(memberId, input);
    }

    @Roles(MemberType.USER)
    @UseGuards(RolesGuard)
    @Mutation(() => EventParticipant)
    public async cancelEventRegistration(
        @Args('eventId') eventId: string,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<EventParticipant> {
        console.log('Mutation: cancelEventRegistration');
        return await this.eventService.cancelEventRegistration(memberId, shapeIntoMongoObjectId(eventId));
    }

    @Roles(MemberType.USER)
    @UseGuards(RolesGuard)
    @Query(() => EventParticipants)
    public async getMyRegistrations(
        @Args('input') input: EventParticipantsInquiry,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<EventParticipants> {
        console.log('Query: getMyRegistrations');
        return await this.eventService.getMyRegistrations(memberId, input);
    }

    @Roles(MemberType.SHOP, MemberType.ADMIN)
    @UseGuards(RolesGuard)
    @Query(() => EventParticipants)
    public async getEventParticipants(
        @Args('eventId') eventId: string,
        @Args('input') input: EventParticipantsInquiry,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<EventParticipants> {
        console.log('Query: getEventParticipants');
        return await this.eventService.getEventParticipants(memberId, shapeIntoMongoObjectId(eventId), input);
    }

    @Roles(MemberType.SHOP, MemberType.ADMIN)
    @UseGuards(RolesGuard)
    @Mutation(() => EventParticipant)
    public async updateEventParticipant(
        @Args('input') input: EventParticipantUpdate,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<EventParticipant> {
        console.log('Mutation: updateEventParticipant');
        return await this.eventService.updateEventParticipant(memberId, input);
    }

    /** ADMIN **/

    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard)
    @Query(() => Events)
    public async getAllEventsByAdmin(
        @Args('input') input: AllEventsInquiry,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Events> {
        console.log('Query: getAllEventsByAdmin');
        return await this.eventService.getAllEventsByAdmin(memberId, input);
    }

    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard)
    @Mutation(() => Event)
    public async updateEventByAdmin(
        @Args('input') input: EventUpdate,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Event> {
        console.log('Mutation: updateEventByAdmin');
        return await this.eventService.updateEventByAdmin(memberId, input);
    }

    @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard)
    @Mutation(() => Event)
    public async removeEventByAdmin(
        @Args('eventId') eventId: string,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Event> {
        console.log('Mutation: removeEventByAdmin');
        return await this.eventService.removeEventByAdmin(memberId, shapeIntoMongoObjectId(eventId));
    }
}
