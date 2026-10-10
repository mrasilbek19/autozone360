import { Connection, createConnection, Model, ObjectId, Types } from 'mongoose';
import { EventService } from './event.service';
import { Event } from '../../libs/dto/event/event';
import { EventInput } from '../../libs/dto/event/event.input';
import { EventParticipant } from '../../libs/dto/event-participant/event-participant';
import { Member } from '../../libs/dto/member/member';
import { EventStatus, EventType } from '../../libs/enums/event.enum';
import { ParticipantStatus } from '../../libs/enums/participant.enum';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import EventSchema from '../../schemas/Event.model';
import EventParticipantSchema from '../../schemas/EventParticipant.model';
import MemberSchema from '../../schemas/Member.model';

// Explicit opt-in only. Never use the application's configured database.
// Creates and drops only a fresh gamenix_event_test_* database on this test server.
const testUri = process.env.EVENT_TEST_MONGO_URI;
const databaseTests = testUri ? describe : describe.skip;

databaseTests('Event transactions against an isolated MongoDB replica set', () => {
    let connection: Connection;
    let service: EventService;
    let events: Model<Event>;
    let participants: Model<EventParticipant>;
    let members: Model<Member>;
    let shopId: ObjectId;
    let userIds: ObjectId[];
    const databaseName = `gamenix_event_test_${new Types.ObjectId()}`;
    const input = (): EventInput => ({
        eventType: EventType.TOURNAMENT,
        eventStatus: EventStatus.PROCESS,
        eventTitle: 'Capacity test', eventDesc: 'Isolated test fixture', eventGame: 'Game',
        eventImage: 'uploads/event/test.png', eventPrize: 'Prize',
        eventDate: new Date(Date.now() + 86400000),
        eventStart: new Date(Date.now() + 86400000),
        eventEnd: new Date(Date.now() + 90000000),
        eventMaxParticipants: 1,
    });

    beforeAll(async () => {
        connection = await createConnection(testUri, { dbName: databaseName, serverSelectionTimeoutMS: 5000 }).asPromise();
        const topology = await connection.db.admin().command({ hello: 1 });
        if (!topology.setName && topology.msg !== 'isdbgrid') throw new Error('Event tests require a replica set or sharded test server');
        events = connection.model<Event>('Event', EventSchema);
        participants = connection.model<EventParticipant>('EventParticipant', EventParticipantSchema);
        members = connection.model<Member>('Member', MemberSchema);
        await Promise.all([events.init(), participants.init(), members.init()]);
        service = new EventService(events, participants, members);
    }, 20000);

    beforeEach(async () => {
        await Promise.all([events.deleteMany({}), participants.deleteMany({}), members.deleteMany({})]);
        const fixtures = await members.create([MemberType.SHOP, MemberType.USER, MemberType.USER].map((memberType, index) => ({
            memberType, memberStatus: MemberStatus.ACTIVE,
            memberNick: `fixture-${index}`, memberPhone: `fixture-${index}`, memberPassword: 'unused-test-fixture',
        })));
        shopId = fixtures[0]._id;
        userIds = fixtures.slice(1).map((member) => member._id);
    });

    afterAll(async () => {
        if (connection?.readyState === 1) await connection.dropDatabase();
        if (connection) await connection.close();
    });

    it('prevents duplicate concurrent applications and enforces the unique pair index', async () => {
        const event = await service.createEvent(shopId, input());
        const results = await Promise.allSettled([
            service.registerEvent(userIds[0], { eventId: event._id }),
            service.registerEvent(userIds[0], { eventId: event._id }),
        ]);
        expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
        expect(await participants.countDocuments({ eventId: event._id, memberId: userIds[0] })).toBe(1);
        await expect(participants.create({ eventId: event._id, memberId: userIds[0] })).rejects.toMatchObject({ code: 11000 });
    }, 20000);

    it('allows only one concurrent approval for the last place and reuses cancelled registrations', async () => {
        const event = await service.createEvent(shopId, input());
        const applications = await Promise.all(userIds.map((memberId) => service.registerEvent(memberId, { eventId: event._id })));
        const results = await Promise.allSettled(applications.map((application) => service.updateEventParticipant(shopId, {
            _id: application._id, participantStatus: ParticipantStatus.REGISTERED,
        })));
        expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
        expect(await participants.countDocuments({ eventId: event._id, participantStatus: ParticipantStatus.REGISTERED })).toBe(1);
        const approved = await participants.findOne({ eventId: event._id, participantStatus: ParticipantStatus.REGISTERED });
        await service.cancelEventRegistration(approved.memberId, event._id);
        const pending = await participants.findOne({ eventId: event._id, participantStatus: ParticipantStatus.PENDING });
        await service.updateEventParticipant(shopId, { _id: pending._id, participantStatus: ParticipantStatus.REGISTERED });
        const reapplied = await service.registerEvent(approved.memberId, { eventId: event._id });
        expect(String(reapplied._id)).toBe(String(approved._id));
        expect(reapplied.participantStatus).toBe(ParticipantStatus.PENDING);
        expect(await participants.countDocuments({ eventId: event._id })).toBe(2);
    }, 20000);

    it('coordinates a capacity decrease with a competing approval', async () => {
        const event = await service.createEvent(shopId, { ...input(), eventMaxParticipants: 2 });
        const applications = await Promise.all(userIds.map((memberId) => service.registerEvent(memberId, { eventId: event._id })));
        await service.updateEventParticipant(shopId, { _id: applications[0]._id, participantStatus: ParticipantStatus.REGISTERED });
        const results = await Promise.allSettled([
            service.updateEvent(shopId, { _id: event._id, eventMaxParticipants: 1 }),
            service.updateEventParticipant(shopId, { _id: applications[1]._id, participantStatus: ParticipantStatus.REGISTERED }),
        ]);
        expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
        const storedEvent = await events.findById(event._id);
        const total = await participants.countDocuments({ eventId: event._id, participantStatus: ParticipantStatus.REGISTERED });
        expect(total).toBeLessThanOrEqual(storedEvent.eventMaxParticipants);
    }, 20000);

    it('rolls back the event version write when approval fails', async () => {
        const event = await service.createEvent(shopId, input());
        const applications = await Promise.all(userIds.map((memberId) => service.registerEvent(memberId, { eventId: event._id })));
        await service.updateEventParticipant(shopId, { _id: applications[0]._id, participantStatus: ParticipantStatus.REGISTERED });
        const before = await events.collection.findOne({ _id: new Types.ObjectId(String(event._id)) });
        await expect(service.updateEventParticipant(shopId, {
            _id: applications[1]._id, participantStatus: ParticipantStatus.REGISTERED,
        })).rejects.toThrow('full');
        const after = await events.collection.findOne({ _id: new Types.ObjectId(String(event._id)) });
        expect(after.__v).toBe(before.__v);
        expect((await participants.findById(applications[1]._id)).participantStatus).toBe(ParticipantStatus.PENDING);
    }, 20000);

    it('returns paginated history and preserves it when the event is removed', async () => {
        const first = await service.createEvent(shopId, input());
        const second = await service.createEvent(shopId, { ...input(), eventTitle: 'Giveaway', eventType: EventType.GIVEAWAY });
        await service.registerEvent(userIds[0], { eventId: first._id });
        const filtered = await service.getEvents({ page: 1, limit: 1, search: { eventType: EventType.GIVEAWAY, eventOrganizer: shopId } });
        expect(filtered.list.map((event) => String(event._id))).toEqual([String(second._id)]);
        expect(filtered.metaCounter).toEqual([{ total: 1 }]);
        const page = await service.getEvents({ page: 2, limit: 1 });
        expect(page.list).toHaveLength(1);
        expect(page.metaCounter).toEqual([{ total: 2 }]);
        await service.removeEvent(shopId, first._id);
        expect((await service.getEvents({ page: 1, limit: 10 })).metaCounter).toEqual([{ total: 1 }]);
        const history = await service.getMyRegistrations(userIds[0], { page: 1, limit: 10 });
        expect(history.list[0].eventData.deletedAt).toBeInstanceOf(Date);
        expect(String(history.list[0].memberData._id)).toBe(String(userIds[0]));
    }, 20000);
});
