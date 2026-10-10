import { Global, Module } from '@nestjs/common';
import { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } from '@nestjs/graphql';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GraphQLInputObjectType, GraphQLObjectType } from 'graphql';
import { ClientSession, createConnection, Model, model, ObjectId, Types } from 'mongoose';
import { EventService } from './event.service';
import { EventResolver } from './event.resolver';
import { EventModule } from './event.module';
import { Event } from '../../libs/dto/event/event';
import { EventInput, EventsInquiry } from '../../libs/dto/event/event.input';
import { EventParticipant } from '../../libs/dto/event-participant/event-participant';
import { EventParticipantsInquiry } from '../../libs/dto/event-participant/event-participant.input';
import { EventParticipantUpdate } from '../../libs/dto/event-participant/event-participant.update';
import { Member } from '../../libs/dto/member/member';
import { EventStatus, EventType } from '../../libs/enums/event.enum';
import { ParticipantStatus } from '../../libs/enums/participant.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { Direction } from '../../libs/enums/common.enum';
import EventSchema from '../../schemas/Event.model';
import EventParticipantSchema from '../../schemas/EventParticipant.model';

jest.mock('apps/gamenix-api/src/libs/enums/common.enum', () =>
    jest.requireActual('../../libs/enums/common.enum'), { virtual: true });

const id = () => new Types.ObjectId() as unknown as ObjectId;
const shopId = id();
const userId = id();
const otherShopId = id();
const adminId = id();
const eventId = id();
const eventInput = (): EventInput => ({
    eventType: EventType.TOURNAMENT,
    eventStatus: EventStatus.PROCESS,
    eventTitle: 'Gaming tournament',
    eventDesc: 'Shop gaming tournament',
    eventGame: 'Valorant',
    eventImage: 'uploads/event/image.png',
    eventDate: new Date(Date.now() + 86400000),
    eventStart: new Date(Date.now() + 86400000),
    eventEnd: new Date(Date.now() + 90000000),
    eventMaxParticipants: 1,
    eventPrize: 'Gaming keyboard',
});
const document = <T>(value: T) => value ? { ...value, toObject: () => ({ ...value }) } : null;
const query = <T>(read: () => T | Promise<T>) => ({
    session: jest.fn().mockReturnThis(),
    exec: jest.fn(async () => await read()),
});
type TestStage = {
    $match?: Record<string, unknown>;
    $facet?: { list: Record<string, unknown>[]; metaCounter: Record<string, unknown>[] };
};

// These mocks exercise decisions and session wiring, not MongoDB isolation or retries.
const setup = () => {
    const state = {
        event: { ...eventInput(), _id: eventId, eventOrganizer: shopId, deletedAt: null, createdAt: new Date(), updatedAt: new Date() } as Event,
        participants: [] as EventParticipant[],
        members: [
            { _id: shopId, memberType: MemberType.SHOP, memberStatus: MemberStatus.ACTIVE },
            { _id: otherShopId, memberType: MemberType.SHOP, memberStatus: MemberStatus.ACTIVE },
            { _id: userId, memberType: MemberType.USER, memberStatus: MemberStatus.ACTIVE },
            { _id: adminId, memberType: MemberType.ADMIN, memberStatus: MemberStatus.ACTIVE },
        ] as unknown as Member[],
    };
    const session = {
        withTransaction: jest.fn(async (work: () => Promise<unknown>) => {
            const event = { ...state.event };
            const participants = state.participants.map((entry) => ({ ...entry }));
            try { return await work(); } catch (err) {
                state.event = event;
                state.participants = participants;
                throw err;
            }
        }),
        endSession: jest.fn(async () => undefined),
    };
    const events = {
        db: { startSession: jest.fn(async () => session) },
        create: jest.fn(async (input: Event) => document(input)),
        findOne: jest.fn((search: { _id: ObjectId }) => query(() =>
            String(search._id) === String(eventId) && !state.event.deletedAt ? document(state.event) : null)),
        findById: jest.fn((targetId: ObjectId) => query(() =>
            String(targetId) === String(eventId) ? document(state.event) : null)),
        findOneAndUpdate: jest.fn((search: { _id: ObjectId }, update: { $set?: Partial<Event> }, options: { session: ClientSession }) => query(() => {
            if (String(search._id) !== String(eventId) || state.event.deletedAt) return null;
            Object.assign(state.event, update.$set ?? {});
            return document(state.event);
        })),
        aggregate: jest.fn((pipeline: TestStage[]) => query(() => [{ list: [state.event], metaCounter: [{ total: 1 }] }])),
    };
    const matches = (entry: EventParticipant, search: Record<string, unknown>) => Object.entries(search).every(([key, value]) => {
        if (key === 'participantStatus' && typeof value === 'object') {
            return (value as { $in: ParticipantStatus[] }).$in.includes(entry.participantStatus);
        }
        return String(entry[key]) === String(value);
    });
    const participants = {
        findOne: jest.fn((search: Record<string, unknown>) => query(() => document(state.participants.find((entry) => matches(entry, search))))),
        findById: jest.fn((targetId: ObjectId) => query(() => document(state.participants.find((entry) => String(entry._id) === String(targetId))))),
        create: jest.fn(async (inputs: EventParticipant[], options: { session: ClientSession }) => inputs.map((input) => {
            const entry = { ...input, _id: id() };
            state.participants.push(entry);
            return document(entry);
        })),
        findOneAndUpdate: jest.fn((search: Record<string, unknown>, update: { $set: Partial<EventParticipant> }) => query(() => {
            const entry = state.participants.find((target) => matches(target, search));
            if (!entry) return null;
            Object.assign(entry, update.$set);
            return document(entry);
        })),
        countDocuments: jest.fn((search: Record<string, unknown>) => query(() => state.participants.filter((entry) => matches(entry, search)).length)),
        aggregate: jest.fn((pipeline: TestStage[]) => query(() => [{ list: state.participants, metaCounter: [{ total: state.participants.length }] }])),
    };
    const members = {
        findOne: jest.fn((search: { _id: ObjectId; memberType: { $in: MemberType[] }; memberStatus: MemberStatus }) => query(() =>
            state.members.find((entry) => String(entry._id) === String(search._id) &&
                search.memberType.$in.includes(entry.memberType) && entry.memberStatus === search.memberStatus))),
    };
    const service = new EventService(
        events as unknown as Model<Event>,
        participants as unknown as Model<EventParticipant>,
        members as unknown as Model<Member>,
    );
    const application = (status = ParticipantStatus.PENDING, memberId = userId) => {
        const entry = { _id: id(), eventId, memberId, participantStatus: status } as EventParticipant;
        state.participants.push(entry);
        return entry;
    };
    return { service, state, events, participants, members, session, application };
};

describe('Event management', () => {
    it('creates an event for an ACTIVE SHOP using authenticated ownership', async () => {
        const { service, events } = setup();
        const result = await service.createEvent(shopId, { ...eventInput(), eventOrganizer: otherShopId });
        expect(result.eventOrganizer).toEqual(shopId);
        expect(events.create).toHaveBeenCalledTimes(1);
    });

    it('defaults new events to PAUSED and preserves GIVEAWAY', async () => {
        const { service } = setup();
        const result = await service.createEvent(shopId, { ...eventInput(), eventType: EventType.GIVEAWAY, eventStatus: undefined });
        expect(result.eventStatus).toBe(EventStatus.PAUSED);
        expect(result.eventType).toBe(EventType.GIVEAWAY);
    });

    it.each([MemberStatus.PENDING, MemberStatus.BLOCK, MemberStatus.DELETE])('rejects a %s SHOP', async (status) => {
        const { service, state, events } = setup();
        state.members[0].memberStatus = status;
        await expect(service.createEvent(shopId, eventInput())).rejects.toThrow('active member');
        expect(events.create).not.toHaveBeenCalled();
    });

    it.each([userId, adminId])('rejects creation by a non-SHOP', async (memberId) => {
        await expect(setup().service.createEvent(memberId, eventInput())).rejects.toThrow('active member');
    });

    it.each([
        { eventStatus: EventStatus.FINISHED },
        { eventTitle: '   ' },
        { eventMaxParticipants: 0 },
        { eventMaxParticipants: 1.5 },
        { eventDate: new Date('invalid') },
        { eventStart: new Date(0) },
        { eventEnd: new Date(0) },
    ])('rejects invalid event data %j', async (changes) => {
        await expect(setup().service.createEvent(shopId, { ...eventInput(), ...changes })).rejects.toThrow();
    });

    it('rejects modifying another shop event and ends the session', async () => {
        const { service, session, state } = setup();
        await expect(service.updateEvent(otherShopId, { _id: eventId, eventTitle: 'Changed' })).rejects.toThrow('owning shop');
        expect(state.event.eventTitle).toBe('Gaming tournament');
        expect(session.endSession).toHaveBeenCalled();
    });

    it('allows the owner to edit, pause, activate and finish', async () => {
        const { service } = setup();
        expect((await service.updateEvent(shopId, { _id: eventId, eventTitle: 'Updated' })).eventTitle).toBe('Updated');
        expect((await service.updateEvent(shopId, { _id: eventId, eventStatus: EventStatus.PAUSED })).eventStatus).toBe(EventStatus.PAUSED);
        expect((await service.updateEvent(shopId, { _id: eventId, eventStatus: EventStatus.PROCESS })).eventStatus).toBe(EventStatus.PROCESS);
        expect((await service.finishEvent(shopId, eventId)).eventStatus).toBe(EventStatus.FINISHED);
        await expect(service.updateEvent(shopId, { _id: eventId, eventStatus: EventStatus.PROCESS })).rejects.toThrow('Finished');
    });

    it('uses finishEvent for owner completion and rejects activation after start', async () => {
        const { service, state } = setup();
        await expect(service.updateEvent(shopId, { _id: eventId, eventStatus: EventStatus.FINISHED })).rejects.toThrow('finishEvent');
        state.event.eventStatus = EventStatus.PAUSED;
        state.event.eventStart = new Date(0);
        await expect(service.updateEvent(shopId, { _id: eventId, eventStatus: EventStatus.PROCESS })).rejects.toThrow('future');
    });

    it('does not reduce capacity below approved participants', async () => {
        const { service, application } = setup();
        application(ParticipantStatus.REGISTERED);
        application(ParticipantStatus.REGISTERED, id());
        await expect(service.updateEvent(shopId, { _id: eventId, eventMaxParticipants: 1 })).rejects.toThrow('below approved');
        expect((await service.updateEvent(shopId, { _id: eventId, eventMaxParticipants: 2 })).eventMaxParticipants).toBe(2);
    });

    it('soft deletes without removing participant history, including finished events', async () => {
        const { service, state, application } = setup();
        application();
        await service.finishEvent(shopId, eventId);
        expect((await service.removeEvent(shopId, eventId)).deletedAt).toBeInstanceOf(Date);
        expect(state.participants).toHaveLength(1);
        await expect(service.getEvent(eventId)).rejects.toThrow('not found');
        expect((await service.getEventParticipants(shopId, eventId, { page: 1, limit: 10 })).list).toHaveLength(1);
    });

    it('allows admin moderation but rejects a shop on admin operations', async () => {
        const { service } = setup();
        await expect(service.updateEventByAdmin(shopId, { _id: eventId, eventTitle: 'Admin edit' })).rejects.toThrow('active member');
        expect((await service.updateEventByAdmin(adminId, { _id: eventId, eventTitle: 'Admin edit' })).eventTitle).toBe('Admin edit');
        expect((await service.updateEventByAdmin(adminId, { _id: eventId, eventStatus: EventStatus.FINISHED })).eventStatus).toBe(EventStatus.FINISHED);
        expect((await service.removeEventByAdmin(adminId, eventId)).deletedAt).toBeInstanceOf(Date);
    });
});

describe('Event applications and approval', () => {
    it('registers an ACTIVE USER as PENDING using authenticated identity', async () => {
        const { service, participants, session } = setup();
        const result = await service.registerEvent(userId, { eventId, memberId: adminId });
        expect(result.memberId).toEqual(userId);
        expect(result.participantStatus).toBe(ParticipantStatus.PENDING);
        expect(participants.create.mock.calls[0][1]).toEqual({ session });
    });

    it.each([shopId, adminId])('rejects non-USER applications', async (memberId) => {
        await expect(setup().service.registerEvent(memberId, { eventId })).rejects.toThrow('active member');
    });

    it('rejects a blocked USER even if their token formerly had ACTIVE status', async () => {
        const { service, state } = setup();
        state.members[2].memberStatus = MemberStatus.BLOCK;
        await expect(service.registerEvent(userId, { eventId })).rejects.toThrow('active member');
    });

    it.each([EventStatus.PAUSED, EventStatus.FINISHED])('rejects applications to %s events', async (status) => {
        const { service, state } = setup();
        state.event.eventStatus = status;
        await expect(service.registerEvent(userId, { eventId })).rejects.toThrow('closed');
    });

    it('closes applications and approvals at eventStart and rejects deleted events', async () => {
        const { service, state, application } = setup();
        const entry = application();
        state.event.eventStart = new Date();
        await expect(service.registerEvent(userId, { eventId })).rejects.toThrow('closed');
        await expect(service.updateEventParticipant(shopId, { _id: entry._id, participantStatus: ParticipantStatus.REGISTERED })).rejects.toThrow('closed');
        state.event.deletedAt = new Date();
        await expect(service.registerEvent(userId, { eventId })).rejects.toThrow('not found');
    });

    it.each([ParticipantStatus.PENDING, ParticipantStatus.REGISTERED, ParticipantStatus.REJECTED])('prevents a second application in %s state', async (status) => {
        const { service, application, participants } = setup();
        application(status);
        await expect(service.registerEvent(userId, { eventId })).rejects.toThrow('Already applied');
        expect(participants.create).not.toHaveBeenCalled();
    });

    it('converts a unique-index violation to a registration conflict', async () => {
        const { service, participants } = setup();
        participants.create.mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: 11000 }));
        await expect(service.registerEvent(userId, { eventId })).rejects.toThrow('Already applied');
    });

    it('allows pending applications when confirmed capacity is full', async () => {
        const { service, application } = setup();
        application(ParticipantStatus.REGISTERED, id());
        expect((await service.registerEvent(userId, { eventId })).participantStatus).toBe(ParticipantStatus.PENDING);
    });

    it.each([EventStatus.PAUSED, EventStatus.FINISHED])('rejects reviews for %s events', async (status) => {
        const { service, state, application } = setup();
        const entry = application();
        state.event.eventStatus = status;
        await expect(service.updateEventParticipant(shopId, { _id: entry._id, participantStatus: ParticipantStatus.REJECTED })).rejects.toThrow('closed');
    });

    it.each([ParticipantStatus.REGISTERED, ParticipantStatus.REJECTED])('lets the owner review a pending application as %s', async (status) => {
        const { service, application } = setup();
        const entry = application();
        expect((await service.updateEventParticipant(shopId, { _id: entry._id, participantStatus: status })).participantStatus).toBe(status);
    });

    it.each([otherShopId, userId])('rejects unauthorized reviews', async (memberId) => {
        const { service, application } = setup();
        const entry = application();
        await expect(service.updateEventParticipant(memberId, { _id: entry._id, participantStatus: ParticipantStatus.REGISTERED })).rejects.toThrow();
    });

    it('allows admin participant moderation', async () => {
        const { service, application } = setup();
        const entry = application();
        expect((await service.updateEventParticipant(adminId, { _id: entry._id, participantStatus: ParticipantStatus.REJECTED })).participantStatus).toBe(ParticipantStatus.REJECTED);
    });

    it('rejects repeated review and a non-review status', async () => {
        const { service, application } = setup();
        const entry = application(ParticipantStatus.REGISTERED);
        await expect(service.updateEventParticipant(shopId, { _id: entry._id, participantStatus: ParticipantStatus.REGISTERED })).rejects.toThrow('Only pending');
        await expect(service.updateEventParticipant(shopId, { _id: entry._id, participantStatus: ParticipantStatus.PENDING })).rejects.toThrow('only be approved or rejected');
    });

    it('rejects approval of a currently blocked applicant', async () => {
        const { service, state, application } = setup();
        const entry = application();
        state.members[2].memberStatus = MemberStatus.BLOCK;
        await expect(service.updateEventParticipant(shopId, { _id: entry._id, participantStatus: ParticipantStatus.REGISTERED })).rejects.toThrow('active member');
    });

    it('rejects full-event approval, counts only REGISTERED, and coordinates the count with an event write', async () => {
        const { service, events, participants, session, application } = setup();
        application(ParticipantStatus.REGISTERED, id());
        const entry = application();
        await expect(service.updateEventParticipant(shopId, { _id: entry._id, participantStatus: ParticipantStatus.REGISTERED })).rejects.toThrow('full');
        expect(participants.countDocuments).toHaveBeenCalledWith({ eventId, participantStatus: ParticipantStatus.REGISTERED });
        expect(events.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: eventId, deletedAt: null }, { $inc: { __v: 1 } }, { new: true, session, timestamps: false },
        );
        expect(events.findOneAndUpdate.mock.invocationCallOrder[0]).toBeLessThan(participants.countDocuments.mock.invocationCallOrder[0]);
    });

    it('cancels an approved registration, frees capacity and reuses its document on reapplication', async () => {
        const { service, state, application } = setup();
        const entry = application(ParticipantStatus.REGISTERED);
        expect((await service.cancelEventRegistration(userId, eventId)).participantStatus).toBe(ParticipantStatus.CANCELLED);
        const result = await service.registerEvent(userId, { eventId });
        expect(result._id).toEqual(entry._id);
        expect(result.participantStatus).toBe(ParticipantStatus.PENDING);
        expect(state.participants).toHaveLength(1);
        expect((await service.updateEventParticipant(shopId, { _id: result._id, participantStatus: ParticipantStatus.REGISTERED })).participantStatus).toBe(ParticipantStatus.REGISTERED);
    });

    it('allows pending cancellation while paused but preserves history after start/finish', async () => {
        const { service, state, application } = setup();
        application();
        state.event.eventStatus = EventStatus.PAUSED;
        await service.cancelEventRegistration(userId, eventId);
        state.participants[0].participantStatus = ParticipantStatus.REGISTERED;
        state.event.eventStatus = EventStatus.FINISHED;
        await expect(service.cancelEventRegistration(userId, eventId)).rejects.toThrow('closed');
        state.event.eventStatus = EventStatus.PROCESS;
        state.event.eventStart = new Date(0);
        await expect(service.cancelEventRegistration(userId, eventId)).rejects.toThrow('closed');
    });

    it('cannot cancel another user application or a rejected application', async () => {
        const { service, application } = setup();
        application(ParticipantStatus.PENDING, id());
        await expect(service.cancelEventRegistration(userId, eventId)).rejects.toThrow('No pending');
        application(ParticipantStatus.REJECTED);
        await expect(service.cancelEventRegistration(userId, eventId)).rejects.toThrow('No pending');
    });
});

describe('Event queries', () => {
    it('applies public filters, pagination, sorting and deletion exclusion', async () => {
        const { service, events } = setup();
        await service.getEvents({ page: 2, limit: 5, sort: 'eventStart', direction: Direction.ASC,
            search: { eventType: EventType.GIVEAWAY, eventStatus: EventStatus.PROCESS, eventOrganizer: otherShopId } });
        expect(events.aggregate).toHaveBeenCalledWith([
            { $match: { deletedAt: null, eventType: EventType.GIVEAWAY, eventStatus: EventStatus.PROCESS, eventOrganizer: otherShopId } },
            { $sort: { eventStart: 1, _id: -1 } },
            { $facet: { list: [{ $skip: 5 }, { $limit: 5 }], metaCounter: [{ $count: 'total' }] } },
        ]);
    });

    it('keeps shop lists scoped to the caller and supports deleted history explicitly', async () => {
        const { service, events } = setup();
        await service.getMyEvents(shopId, { page: 1, limit: 10, search: { eventOrganizer: otherShopId } });
        expect(events.aggregate.mock.calls[0][0][0]).toEqual({ $match: { eventOrganizer: shopId, deletedAt: null } });
        await service.getMyEvents(shopId, { page: 1, limit: 10, includeDeleted: true });
        expect(events.aggregate.mock.calls[1][0][0]).toEqual({ $match: { eventOrganizer: shopId } });
    });

    it('allows admin deleted-event inspection and rejects ordinary users', async () => {
        const { service, events } = setup();
        await service.getAllEventsByAdmin(adminId, { page: 1, limit: 10, includeDeleted: true });
        expect(events.aggregate.mock.calls[0][0][0]).toEqual({ $match: {} });
        await expect(service.getAllEventsByAdmin(userId, { page: 1, limit: 10 })).rejects.toThrow('active member');
    });

    it('returns own registration history with event data and no deletion exclusion', async () => {
        const { service, participants } = setup();
        await service.getMyRegistrations(userId, { page: 2, limit: 5, search: { eventId, participantStatus: ParticipantStatus.PENDING } });
        const pipeline = participants.aggregate.mock.calls[0][0];
        expect(pipeline[0]).toEqual({ $match: { memberId: userId, eventId, participantStatus: ParticipantStatus.PENDING } });
        expect(pipeline[2].$facet.list[0]).toEqual({ $skip: 5 });
        expect(pipeline[2].$facet.list).toContainEqual({ $lookup: { from: 'events', localField: 'eventId', foreignField: '_id', as: 'eventData' } });
    });

    it('restricts participant lists to the owning SHOP or ADMIN and fixes event scope', async () => {
        const { service, participants } = setup();
        await expect(service.getEventParticipants(otherShopId, eventId, { page: 1, limit: 10 })).rejects.toThrow('owning shop');
        await expect(service.getEventParticipants(userId, eventId, { page: 1, limit: 10 })).rejects.toThrow('active member');
        await service.getEventParticipants(adminId, eventId, { page: 1, limit: 10, search: { eventId: id() } });
        expect(participants.aggregate.mock.calls[0][0][0]).toEqual({ $match: { eventId } });
    });
});

describe('Event contracts and Nest wiring', () => {
    it('validates nested query filters, sort allowlists and pagination limits', async () => {
        expect(await validate(plainToInstance(EventsInquiry, { page: 1, limit: 10, search: { eventStatus: EventStatus.PROCESS } }))).toEqual([]);
        const errors = await validate(plainToInstance(EventsInquiry, { page: 0, limit: 101, sort: 'unknown', search: { eventOrganizer: 'bad', eventStatus: 'bad' } }));
        expect(errors.map((entry) => entry.property)).toEqual(expect.arrayContaining(['page', 'limit', 'sort', 'search']));
        expect(await validate(plainToInstance(EventParticipantsInquiry, { page: 1, limit: 10, search: { participantStatus: 'invalid' } }))).not.toEqual([]);
    });

    it('requires a review status restricted to REGISTERED and REJECTED', async () => {
        expect(await validate(plainToInstance(EventParticipantUpdate, { _id: String(id()), participantStatus: ParticipantStatus.REJECTED }))).toEqual([]);
        expect(await validate(plainToInstance(EventParticipantUpdate, { _id: String(id()), participantStatus: ParticipantStatus.CANCELLED }))).not.toEqual([]);
        expect(await validate(plainToInstance(EventParticipantUpdate, { _id: String(id()) }))).not.toEqual([]);
    });

    it('keeps existing references and unique index, defaults applications to PENDING, and adds only soft deletion to events', () => {
        const ParticipantModel = model('EventParticipantContractTest', EventParticipantSchema);
        const EventModel = model('EventContractTest', EventSchema);
        expect(new ParticipantModel({ eventId, memberId: userId }).participantStatus).toBe(ParticipantStatus.PENDING);
        expect(EventParticipantSchema.path('eventId').options.ref).toBe('Event');
        expect(EventParticipantSchema.path('memberId').options.ref).toBe('Member');
        expect(EventParticipantSchema.indexes()).toContainEqual([{ eventId: 1, memberId: 1 }, { unique: true, background: true }]);
        expect(new EventModel({ ...eventInput(), eventOrganizer: shopId }).deletedAt).toBeNull();
        expect(EventSchema.path('eventOrganizer').options.ref).toBe('Member');
        expect(EventSchema.path('participantCount')).toBeUndefined();
    });

    it('generates the GraphQL operations and keeps identity/status server controlled on registration', async () => {
        const module = await Test.createTestingModule({ imports: [GraphQLSchemaBuilderModule] }).compile();
        try {
            const schema = await module.get(GraphQLSchemaFactory).create([EventResolver]);
            expect(Object.keys(schema.getQueryType().getFields())).toEqual([
                'getEvents', 'getEvent', 'getMyEvents', 'getMyRegistrations', 'getEventParticipants', 'getAllEventsByAdmin',
            ]);
            expect(Object.keys(schema.getMutationType().getFields())).toEqual([
                'createEvent', 'updateEvent', 'finishEvent', 'removeEvent', 'registerEvent', 'cancelEventRegistration',
                'updateEventParticipant', 'updateEventByAdmin', 'removeEventByAdmin',
            ]);
            expect(Object.keys((schema.getType('EventParticipantInput') as GraphQLInputObjectType).getFields())).toEqual(['eventId']);
            expect((schema.getType('EventInput') as GraphQLInputObjectType).getFields()).not.toHaveProperty('eventOrganizer');
            expect((schema.getType('EventParticipantUpdate') as GraphQLInputObjectType).getFields().participantStatus.type.toString()).toBe('ParticipantStatus!');
            expect((schema.getType('Event') as GraphQLObjectType).getFields().deletedAt.type.toString()).toBe('DateTime');
        } finally { await module.close(); }
    });

    it('resolves the real EventModule providers without connecting to a database', async () => {
        const connection = createConnection();
        @Global()
        @Module({ providers: [{ provide: getConnectionToken(), useValue: connection }], exports: [getConnectionToken()] })
        class OfflineDatabase { }
        const module = await Test.createTestingModule({ imports: [OfflineDatabase, EventModule] }).compile();
        try {
            expect(module.get(EventService)).toBeInstanceOf(EventService);
            expect(module.get(EventResolver)).toBeInstanceOf(EventResolver);
        } finally {
            await module.close();
            await connection.destroy();
        }
    });
});
