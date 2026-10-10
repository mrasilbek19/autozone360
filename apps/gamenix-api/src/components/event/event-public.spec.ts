import { Model, ObjectId, Types } from 'mongoose';
import { EventService } from './event.service';
import { Event } from '../../libs/dto/event/event';
import { EventParticipant } from '../../libs/dto/event-participant/event-participant';
import { Member } from '../../libs/dto/member/member';
import { EventStatus, EventType } from '../../libs/enums/event.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';

jest.mock('apps/gamenix-api/src/libs/enums/common.enum', () =>
    jest.requireActual('../../libs/enums/common.enum'), { virtual: true });

describe('Public event visibility', () => {
    const shopId = new Types.ObjectId();
    const adminId = new Types.ObjectId();
    const fixtures = [
        ...Object.values(EventStatus).map((eventStatus) => ({
            _id: new Types.ObjectId(), eventStatus, deletedAt: null,
            eventType: EventType.TOURNAMENT, eventOrganizer: shopId,
            eventStart: new Date(0),
            eventEnd: new Date(Date.now() + 172800000), eventDate: new Date(),
            eventTitle: 'Tournament', eventDesc: 'Shop tournament', eventGame: 'Valorant',
            eventImage: 'uploads/event/test.png', eventPrize: 'Keyboard', eventMaxParticipants: 10,
        })),
        { _id: new Types.ObjectId(), eventStatus: EventStatus.PROCESS, deletedAt: new Date(),
            eventType: EventType.TOURNAMENT, eventOrganizer: shopId },
    ];
    const active = fixtures.find((event) => event.eventStatus === EventStatus.PROCESS && !event.deletedAt);
    const matches = (event: Record<string, unknown>, match: Record<string, any>): boolean =>
        Object.entries(match).every(([key, value]) => key === '$and'
            ? value.every((condition: Record<string, any>) => matches(event, condition))
            : String(event[key]) === String(value));
    const query = (result: unknown) => ({ session: jest.fn().mockReturnThis(), exec: jest.fn(async () => result) });
    let service: EventService;

    beforeEach(() => {
        const events = {
            db: { startSession: jest.fn(async () => ({
                withTransaction: async (work: () => Promise<unknown>) => await work(),
                endSession: jest.fn(),
            })) },
            findOne: jest.fn((match) => query(fixtures.find((event) => matches(event, match)))),
            findOneAndUpdate: jest.fn((match, update) => {
                const event = fixtures.find((event) => matches(event, match));
                const value = event ? { ...event, ...update.$set } : null;
                return query(value ? { ...value, toObject: () => value } : null);
            }),
            aggregate: jest.fn((pipeline) => {
                const found = fixtures.filter((event) => matches(event, pipeline[0].$match));
                const pagination = pipeline[2].$facet.list;
                const skip = pagination[0].$skip;
                return query([{ list: found.slice(skip, skip + pagination[1].$limit),
                    metaCounter: found.length ? [{ total: found.length }] : [] }]);
            }),
        };
        const members = {
            findOne: jest.fn((match) => {
                const memberType = String(match._id) === String(adminId) ? MemberType.ADMIN : MemberType.SHOP;
                return query(match.memberType.$in.includes(memberType)
                    ? { _id: match._id, memberStatus: MemberStatus.ACTIVE, memberType } : null);
            }),
        };
        service = new EventService(events as unknown as Model<Event>, {} as Model<EventParticipant>, members as unknown as Model<Member>);
    });

    it('lists only active, nondeleted events without adding date restrictions', async () => {
        const result = await service.getEvents({ page: 1, limit: 10 });
        expect(result.list).toEqual([active]);
        expect(result.metaCounter).toEqual([{ total: 1 }]);
    });

    it.each(Object.values(EventStatus))('enforces active visibility with a %s client filter', async (eventStatus) => {
        const result = await service.getEvents({ page: 1, limit: 10, search: { eventStatus } });
        expect(result.list).toEqual(eventStatus === EventStatus.PROCESS ? [active] : []);
        expect(result.metaCounter).toEqual(eventStatus === EventStatus.PROCESS ? [{ total: 1 }] : []);
    });

    it('keeps event type filters and pagination working', async () => {
        expect((await service.getEvents({ page: 1, limit: 10, search: { eventType: EventType.GIVEAWAY } })).list).toEqual([]);
        expect((await service.getEvents({ page: 2, limit: 1 })).list).toEqual([]);
    });

    it.each(fixtures)('restricts public detail for $eventStatus / deletedAt=$deletedAt', async (event) => {
        const result = service.getEvent(event._id as unknown as ObjectId);
        if (event === active) await expect(result).resolves.toEqual(active);
        else await expect(result).rejects.toThrow('Event not found');
    });

    it.each([EventStatus.PENDING, EventStatus.PAUSED, EventStatus.FINISHED])('preserves shop/admin access to %s events', async (eventStatus) => {
        const input = { page: 1, limit: 10, search: { eventStatus } };
        const expected = fixtures.filter((event) => event.eventStatus === eventStatus);
        expect((await service.getMyEvents(shopId as unknown as ObjectId, input)).list).toEqual(expected);
        expect((await service.getAllEventsByAdmin(adminId as unknown as ObjectId, input)).list).toEqual(expected);
    });

    it('allows the owning shop to edit pending events but prevents self-approval', async () => {
        const pending = fixtures.find((event) => event.eventStatus === EventStatus.PENDING);
        const input = { _id: pending._id as unknown as ObjectId };
        expect((await service.updateEvent(shopId as unknown as ObjectId, { ...input, eventTitle: 'Edited' })).eventTitle).toBe('Edited');
        await expect(service.updateEvent(shopId as unknown as ObjectId, { ...input, eventStatus: EventStatus.PROCESS })).rejects.toThrow('Only an admin');
        await expect(service.updateEventByAdmin(shopId as unknown as ObjectId, { ...input, eventStatus: EventStatus.PROCESS })).rejects.toThrow('active member');
        await expect(service.updateEvent(new Types.ObjectId() as unknown as ObjectId, { ...input, eventTitle: 'Other shop' })).rejects.toThrow('owning shop');
    });

    it('allows an admin to approve a pending event through the existing admin operation', async () => {
        const pending = fixtures.find((event) => event.eventStatus === EventStatus.PENDING);
        const result = await service.updateEventByAdmin(adminId as unknown as ObjectId, {
            _id: pending._id as unknown as ObjectId, eventStatus: EventStatus.PROCESS,
            eventStart: new Date(Date.now() + 86400000),
        });
        expect(result.eventStatus).toBe(EventStatus.PROCESS);
    });
});
