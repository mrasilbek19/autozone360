import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { Args, GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { GraphQLEnumType, GraphQLInputObjectType, GraphQLObjectType, GraphQLSchema } from 'graphql';
import { createConnection, Types } from 'mongoose';
import MemberSchema from '../../schemas/Member.model';
import ProductSchema from '../../schemas/Product.model';
import OrderSchema from '../../schemas/Order.model';
import OrderItemSchema from '../../schemas/OrderItem.model';
import EventSchema from '../../schemas/Event.model';
import EventParticipantSchema from '../../schemas/EventParticipant.model';
import { EventParticipant } from './event-participant/event-participant';
import { EventParticipantInput } from './event-participant/event-participant.input';
import { EventParticipantUpdate } from './event-participant/event-participant.update';
import { ParticipantStatus } from '../enums/participant.enum';
import { Product } from './product/product';
import { ProductInput, ProductsInquiry } from './product/product.input';
import { ProductUpdate } from './product/product.update';
import { Order } from './order/order';
import { OrderInput } from './order/order.input';
import { OrderUpdate } from './order/order.update';
import { OrderItem } from './order-item/order-item';
import { OrderItemInput } from './order-item/order-item.input';
import { OrderItemUpdate } from './order-item/order-item.update';
import { Event } from './event/event';
import { EventInput } from './event/event.input';
import { EventUpdate } from './event/event.update';
import { ProductStatus, ProductType } from '../enums/product.enum';
import { OrderStatus } from '../enums/order.enum';
import { EventStatus, EventType } from '../enums/event.enum';

// Test-only resolver exposes the data definitions without adding application endpoints.
@Resolver()
class ERContractResolver {
    @Query(() => Product)
    product(): Product { return null; }

    @Query(() => Order)
    order(): Order { return null; }

    @Query(() => OrderItem)
    orderItem(): OrderItem { return null; }

    @Query(() => Event)
    event(): Event { return null; }

    @Query(() => EventParticipant)
    eventParticipant(): EventParticipant { return null; }

    @Mutation(() => Boolean)
    definitions(
        @Args('product') product: ProductInput,
        @Args('productUpdate') productUpdate: ProductUpdate,
        @Args('products') products: ProductsInquiry,
        @Args('order') order: OrderInput,
        @Args('orderUpdate') orderUpdate: OrderUpdate,
        @Args('item') item: OrderItemInput,
        @Args('itemUpdate') itemUpdate: OrderItemUpdate,
        @Args('event') event: EventInput,
        @Args('eventUpdate') eventUpdate: EventUpdate,
        @Args('participant') participant: EventParticipantInput,
        @Args('participantUpdate') participantUpdate: EventParticipantUpdate,
    ): boolean { return true; }
}

describe('ER model GraphQL and Mongoose definitions', () => {
    let schema: GraphQLSchema;
    let module: any;
    const connection = createConnection();
    const ProductModel = connection.model('ERProduct', ProductSchema);
    const OrderModel = connection.model('EROrder', OrderSchema);
    const ItemModel = connection.model('EROrderItem', OrderItemSchema);
    const EventModel = connection.model('EREvent', EventSchema);
    const ParticipantModel = connection.model('EREventParticipant', EventParticipantSchema);
    const MemberModel = connection.model('ERMember', MemberSchema);
    const id = new Types.ObjectId();
    const pipe = new ValidationPipe({ transform: true });
    const product = { productType: ProductType.KEYBOARD, productName: 'Gaming keyboard', productPrice: 50000, productLeftCount: 3, productImages: ['keyboard.png'] };

    beforeAll(async () => {
        module = await Test.createTestingModule({ imports: [GraphQLSchemaBuilderModule] }).compile();
        schema = await module.get(GraphQLSchemaFactory).create([ERContractResolver]);
    });
    afterAll(async () => { await module.close(); await connection.close(); });

    it('builds object and input definitions without defining checkout or registration operations', () => {
        for (const type of ['Product', 'Order', 'OrderItem', 'Event', 'ProductInput', 'ProductUpdate', 'OrderInput', 'OrderUpdate', 'OrderItemInput', 'OrderItemUpdate', 'EventInput', 'EventUpdate']) {
            expect(schema.getType(type)).toBeDefined();
        }
        expect(schema.getMutationType().getFields().createOrder).toBeUndefined();
        expect(schema.getMutationType().getFields().registerForEvent).toBeUndefined();
    });

    it('exposes exactly the approved lifecycle and category enums', () => {
        for (const [name, values] of Object.entries({
            ProductType: Object.values(ProductType),
            ProductStatus: ['PAUSE', 'PROCESS', 'FINISHED'],
            OrderStatus: ['PAUSE', 'PROCESS', 'FINISHED'],
            EventType: ['TOURNAMENT', 'GIVEAWAY'],
            EventStatus: ['PAUSED', 'PROCESS', 'FINISHED'],
            MemberType: ['USER', 'ADMIN', 'SHOP'],
            ParticipantStatus: ['REGISTERED', 'CANCELLED'],
        })) expect((schema.getType(name) as GraphQLEnumType).getValues().map((entry) => entry.name)).toEqual(values);
    });

    it('replaces memberProperties with memberProducts and keeps password private', () => {
        const fields = (schema.getType('Member') as GraphQLObjectType).getFields();
        expect(fields.memberProducts.type.toString()).toBe('Int!');
        expect(fields.memberProperties).toBeUndefined();
        expect(fields.memberPassword).toBeUndefined();
        const member = new MemberModel({ memberNick: 'gamer', memberPhone: '123', memberPassword: 'hash' });
        expect(member.get('memberProducts')).toBe(0);
        expect(MemberSchema.path('memberProperties')).toBeUndefined();
    });

    it('uses only the approved persisted product fields and standard Mongoose metadata', () => {
        expect(Object.keys(ProductSchema.paths).sort()).toEqual([
            '_id', '__v', 'productType', 'productName', 'productStatus', 'productPrice', 'productViews', 'productLeftCount',
            'productLikes', 'productComments', 'productRank', 'productImages', 'productDesc', 'memberId', 'soldAt', 'deletedAt', 'createdAt', 'updatedAt',
        ].sort());
        const fields = (schema.getType('ProductInput') as GraphQLInputObjectType).getFields();
        expect(fields.productName).toBeDefined();
        expect(fields.productLeftCount.type.toString()).toBe('Int!');
        expect(fields.memberId).toBeUndefined();
        for (const name of ['propertyTitle', 'productTitle', 'productRooms', 'productBeds', 'productSquare', 'productAddress', 'productRent']) expect(fields[name]).toBeUndefined();
    });

    it('removes housing filters while retaining category, owner, price, date and text search', () => {
        const fields = (schema.getType('PISearch') as GraphQLInputObjectType).getFields();
        expect(Object.keys(fields).sort()).toEqual(['memberId', 'typeList', 'pricesRange', 'periodsRange', 'text'].sort());
    });

    it.each([-1, 1.5])('rejects invalid stock %s in both DTO and persisted schema', async (stock) => {
        await expect(pipe.transform({ ...product, productLeftCount: stock }, { type: 'body', metatype: ProductInput })).rejects.toThrow();
        await expect(new ProductModel({ ...product, memberId: id, productLeftCount: stock }).validate()).rejects.toThrow();
    });

    it('accepts zero stock without performing inventory logic', async () => {
        await expect(new ProductModel({ ...product, memberId: id, productLeftCount: 0 }).validate()).resolves.toBeUndefined();
        expect(new ProductModel({ ...product, memberId: id }).get('productStatus')).toBe(ProductStatus.PROCESS);
    });

    it('rejects an obsolete property category and negative price', async () => {
        await expect(new ProductModel({ ...product, productType: 'HOUSE', memberId: id }).validate()).rejects.toThrow();
        await expect(new ProductModel({ ...product, productPrice: -1, memberId: id }).validate()).rejects.toThrow();
    });

    it('allows similar catalog entries from independent shops without the old housing unique index', () => {
        expect(ProductSchema.indexes().some(([, options]) => options.unique)).toBe(false);
    });

    it('defines order, item and organizer references using the ER model names', () => {
        for (const [model, path, reference] of [
            [ProductSchema, 'memberId', 'Member'], [OrderSchema, 'memberId', 'Member'], [OrderSchema, 'shopId', 'Member'],
            [OrderItemSchema, 'orderId', 'Order'], [OrderItemSchema, 'productId', 'Product'], [EventSchema, 'eventOrganizer', 'Member'],
        ] as const) expect(model.path(path).options.ref).toBe(reference);
        expect(OrderSchema.options.collection).toBe('order');
        expect(OrderItemSchema.options.collection).toBe('orderItems');
        expect(EventSchema.options.collection).toBe('events');
    });

    it('validates order data shape without calculating totals', async () => {
        await expect(new OrderModel({ orderTotal: 50000, orderDelivery: 'pickup', memberId: id, shopId: new Types.ObjectId() }).validate()).resolves.toBeUndefined();
        await expect(new OrderModel({ orderTotal: -1, orderDelivery: 'pickup', memberId: id, shopId: id }).validate()).rejects.toThrow();
        expect(new OrderModel().get('orderStatus')).toBe(OrderStatus.PAUSE);
    });

    it.each([0, -1, 1.5])('rejects invalid order item quantity %s', async (quantity) => {
        await expect(new ItemModel({ itemQuantity: quantity, itemPrice: 100, orderId: id, productId: id }).validate()).rejects.toThrow();
        await expect(pipe.transform({ itemQuantity: quantity, itemPrice: 100, orderId: String(id), productId: String(id) }, { type: 'body', metatype: OrderItemInput })).rejects.toThrow();
    });

    it('requires event fields and rejects unsupported statuses and fractional capacity', async () => {
        const event = { eventType: EventType.TOURNAMENT, eventTitle: 'Keyboard tournament', eventDesc: 'Description', eventGame: 'Game', eventImage: 'event.png', eventDate: new Date(), eventMaxParticipants: 10, eventOrganizer: id, eventStart: new Date(), eventEnd: new Date(), eventPrize: 'Keyboard' };
        await expect(new EventModel(event).validate()).resolves.toBeUndefined();
        await expect(new EventModel({ ...event, eventMaxParticipants: 1.5 }).validate()).rejects.toThrow();
        await expect(new EventModel({ ...event, eventStatus: 'PUBLISHED' }).validate()).rejects.toThrow();
        expect(EventSchema.path('eventend')).toBeUndefined();
        expect(EventSchema.path('eventEnd')).toBeDefined();
        expect((schema.getType('EventInput') as GraphQLInputObjectType).getFields().eventOrganizer).toBeUndefined();
    });

    it('defines participant GraphQL fields with internal member assignment and fixed references on update', () => {
        const fields = (schema.getType('EventParticipant') as GraphQLObjectType).getFields();
        expect(Object.keys(fields).sort()).toEqual(['_id', 'eventId', 'memberId', 'participantStatus', 'createdAt', 'updatedAt'].sort());
        expect(fields.participantStatus.type.toString()).toBe('ParticipantStatus!');
        const input = (schema.getType('EventParticipantInput') as GraphQLInputObjectType).getFields();
        expect(Object.keys(input).sort()).toEqual(['eventId', 'participantStatus']);
        expect(input.eventId.type.toString()).toBe('String!');
        const update = (schema.getType('EventParticipantUpdate') as GraphQLInputObjectType).getFields();
        expect(Object.keys(update).sort()).toEqual(['_id', 'participantStatus']);
    });

    it('defines participant references, timestamps and an unconditional unique event/member index', () => {
        expect(EventParticipantSchema.path('eventId').options.ref).toBe('Event');
        expect(EventParticipantSchema.path('memberId').options.ref).toBe('Member');
        expect(EventParticipantSchema.options.collection).toBe('eventParticipants');
        expect(EventParticipantSchema.options.timestamps).toBe(true);
        expect(EventParticipantSchema.indexes()).toEqual([[{ eventId: 1, memberId: 1 }, expect.objectContaining({ unique: true })]]);
    });

    it('defaults participants to REGISTERED and accepts only the two approved states', async () => {
        const participant = { eventId: id, memberId: new Types.ObjectId() };
        expect(new ParticipantModel(participant).get('participantStatus')).toBe(ParticipantStatus.REGISTERED);
        for (const participantStatus of Object.values(ParticipantStatus)) {
            await expect(new ParticipantModel({ ...participant, participantStatus }).validate()).resolves.toBeUndefined();
            await expect(pipe.transform({ eventId: String(id), participantStatus }, { type: 'body', metatype: EventParticipantInput })).resolves.toBeInstanceOf(EventParticipantInput);
            await expect(pipe.transform({ _id: String(id), participantStatus }, { type: 'body', metatype: EventParticipantUpdate })).resolves.toBeInstanceOf(EventParticipantUpdate);
        }
        await expect(new ParticipantModel({ ...participant, participantStatus: 'PENDING' }).validate()).rejects.toThrow();
        await expect(pipe.transform({ eventId: String(id), participantStatus: 'PENDING' }, { type: 'body', metatype: EventParticipantInput })).rejects.toThrow();
        await expect(pipe.transform({ _id: String(id), participantStatus: 'PENDING' }, { type: 'body', metatype: EventParticipantUpdate })).rejects.toThrow();
    });

    it('rejects missing or malformed participant references and update IDs', async () => {
        await expect(new ParticipantModel({ eventId: id }).validate()).rejects.toThrow();
        await expect(new ParticipantModel({ memberId: id }).validate()).rejects.toThrow();
        await expect(new ParticipantModel({ eventId: 'invalid', memberId: id }).validate()).rejects.toThrow();
        await expect(pipe.transform({ eventId: 'invalid' }, { type: 'body', metatype: EventParticipantInput })).rejects.toThrow();
        await expect(pipe.transform({ participantStatus: ParticipantStatus.CANCELLED }, { type: 'body', metatype: EventParticipantUpdate })).rejects.toThrow();
    });
});
