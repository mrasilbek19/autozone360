import { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GraphQLInputObjectType, GraphQLObjectType } from 'graphql';
import { Model, model, Types } from 'mongoose';
import OrderSchema from '../../schemas/Order.model';
import { OrderInput } from '../../libs/dto/order/order.input';
import { OrderResolver } from './order.resolver';
import { OrderService } from './order.service';
import { MemberService } from '../member/member.service';
import { OrderDeliveryType, OrderStatus } from '../../libs/enums/order.enum';
import { ProductType } from '../../libs/enums/product.enum';
import { Order } from '../../libs/dto/order/order';
import { OrderItem } from '../../libs/dto/order-item/order-item';
import { Product } from '../../libs/dto/product/product';
import { Member } from '../../libs/dto/member/member';

jest.mock('apps/gamenix-api/src/libs/enums/common.enum', () =>
    jest.requireActual('../../libs/enums/common.enum'), { virtual: true });

const OrderModel = model('OrderDeliveryTest', OrderSchema);
const orderData = () => ({
    memberId: new Types.ObjectId(),
    shopId: new Types.ObjectId(),
    orderTotal: 25,
    orderDelivery: 5,
    orderAddress: 'Seoul address',
});

describe('Order delivery price and address', () => {
    it('stores a numeric delivery price separately from the address', () => {
        const order = new OrderModel(orderData());
        expect(order.validateSync()).toBeUndefined();
        expect(order.orderDelivery).toBe(5);
        expect(order.orderAddress).toBe('Seoul address');
    });

    it('accepts free delivery and rejects a negative delivery price', () => {
        expect(new OrderModel({ ...orderData(), orderDelivery: 0 }).validateSync()).toBeUndefined();
        expect(new OrderModel({ ...orderData(), orderDelivery: -1 }).validateSync()?.errors).toHaveProperty('orderDelivery');
    });

    it('requires both the delivery price and the address in stored orders', () => {
        expect(new OrderModel({ ...orderData(), orderDelivery: undefined }).validateSync()?.errors).toHaveProperty('orderDelivery');
        expect(new OrderModel({ ...orderData(), orderAddress: undefined }).validateSync()?.errors).toHaveProperty('orderAddress');
    });

    it('permits pickup without an address and defaults existing delivery requests to DELIVERY', () => {
        const pickup = new OrderModel({ ...orderData(), orderAddress: undefined, orderDelivery: 0, orderDeliveryType: OrderDeliveryType.PICKUP });
        expect(pickup.validateSync()).toBeUndefined();
        expect(new OrderModel(orderData()).orderDeliveryType).toBe(OrderDeliveryType.DELIVERY);
    });

    it('validates the new address input and rejects blank or legacy address inputs', async () => {
        const orderItems = [{ productId: String(new Types.ObjectId()), itemQuantity: 1 }];
        expect(await validate(plainToInstance(OrderInput, { orderAddress: 'Seoul address', orderItems }))).toEqual([]);
        const blank = await validate(plainToInstance(OrderInput, { orderAddress: '  ', orderItems }));
        expect(blank.map((error) => error.property)).toContain('orderAddress');
        const legacy = await validate(plainToInstance(OrderInput, { orderDelivery: 'Seoul address', orderItems }));
        expect(legacy.map((error) => error.property)).toContain('orderAddress');
    });

    it('exposes numeric delivery and address output fields while keeping prices server-controlled', async () => {
        const module = await Test.createTestingModule({ imports: [GraphQLSchemaBuilderModule] }).compile();
        try {
            const schema = await module.get(GraphQLSchemaFactory).create([OrderResolver]);
            const output = (schema.getType('Order') as GraphQLObjectType).getFields();
            const input = (schema.getType('OrderInput') as GraphQLInputObjectType).getFields();
            expect(output.orderDelivery.type.toString()).toBe('Float!');
            expect(output.orderAddress.type.toString()).toBe('String');
            expect(output.orderDeliveryType.type.toString()).toBe('OrderDeliveryType!');
            expect(Object.keys(input)).toEqual(['orderDeliveryType', 'orderAddress', 'orderItems']);
            expect(input.orderDeliveryType.defaultValue).toBe(OrderDeliveryType.DELIVERY);
            expect(Object.keys(schema.getMutationType().getFields())).toEqual(['createOrder', 'updateOrder']);
            expect((schema.getType('OrderUpdate') as GraphQLInputObjectType).getFields()).not.toHaveProperty('orderDelivery');
        } finally {
            await module.close();
        }
    });
});

const query = <T>(value: T) => {
    return Object.assign(Promise.resolve(value), {
        exec: jest.fn(async () => value),
    });
};

describe('Order shipping calculations', () => {
    const memberId = new Types.ObjectId();
    const shopId = new Types.ObjectId();
    const productId = new Types.ObjectId();
    const orderId = new Types.ObjectId();

    const setup = (price: number, productType = ProductType.KEYBOARD) => {
        const products = [{ _id: productId, memberId: shopId, productType, productPrice: price, productLeftCount: 10 }];
        const orders = {
            create: jest.fn(async (value: Order) => ({ ...value, orderStatus: OrderStatus.PAUSE, _id: orderId })),
        };
        const items = { create: jest.fn(async (value: Partial<OrderItem>) => value) };
        const productModel = { find: jest.fn(() => query(products)) };
        const members = { exists: jest.fn(() => query({ _id: memberId })) };
        const memberService = { memberStatsEditor: jest.fn() };
        const service = new OrderService(
            orders as unknown as Model<Order>,
            items as unknown as Model<OrderItem>,
            productModel as unknown as Model<Product>,
            members as unknown as Model<Member>,
            memberService as unknown as MemberService,
        );
        const input = plainToInstance(OrderInput, {
            orderAddress: '  Seoul address  ',
            orderItems: [{ productId: String(productId), itemQuantity: 1 }],
        });
        return { service, input, orders, items, products };
    };

    it.each([
        [99.99, ProductType.KEYBOARD, 5, 104.99],
        [100, ProductType.KEYBOARD, 0, 100],
        [150, ProductType.MOUSE, 0, 150],
        [50, ProductType.CHAIR, 15, 65],
        [100, ProductType.CHAIR, 15, 115],
        [200, ProductType.DESK, 15, 215],
    ])('charges the correct fee for a %s USD %s order', async (price, type, delivery, total) => {
        const { service, input, orders, items } = setup(price, type);
        const result = await service.createOrder(memberId as unknown as Order['memberId'], input);
        expect(result).toMatchObject({
            orderDelivery: delivery, orderTotal: total, orderAddress: 'Seoul address',
            orderDeliveryType: OrderDeliveryType.DELIVERY, orderStatus: OrderStatus.PAUSE,
        });
        expect(orders.create.mock.calls[0][0]).toMatchObject({ memberId, shopId });
        expect(items.create).toHaveBeenCalledWith({ productId, orderId, itemQuantity: 1, itemPrice: price });
    });

    it('uses product quantities when checking the free-delivery threshold', async () => {
        const { service, input } = setup(50);
        input.orderItems[0].itemQuantity = 2;
        const result = await service.createOrder(memberId as unknown as Order['memberId'], input);
        expect(result).toMatchObject({ orderDelivery: 0, orderTotal: 100 });
    });

    it('charges furniture shipping once for a mixed same-shop order', async () => {
        const { service, input, products } = setup(40);
        const furnitureId = new Types.ObjectId();
        products.push({ ...products[0], _id: furnitureId, productType: ProductType.DESK, productPrice: 200 });
        input.orderItems.push({ productId: String(furnitureId) as unknown as OrderItem['productId'], itemQuantity: 2 });
        const result = await service.createOrder(memberId as unknown as Order['memberId'], input);
        expect(result).toMatchObject({ orderDelivery: 15, orderTotal: 455 });
    });

    it.each([ProductType.KEYBOARD, ProductType.CHAIR, ProductType.DESK])('offers free pickup without an address for %s', async (type) => {
        const { service, input } = setup(50, type);
        input.orderDeliveryType = OrderDeliveryType.PICKUP;
        delete input.orderAddress;
        expect(await validate(input)).toEqual([]);
        const result = await service.createOrder(memberId as unknown as Order['memberId'], input);
        expect(result).toMatchObject({ orderDelivery: 0, orderTotal: 50, orderDeliveryType: OrderDeliveryType.PICKUP });
        expect(result.orderAddress).toBeUndefined();
    });

    it('accepts repeated product lines and calculates their combined total', async () => {
        const { service, input, items } = setup(50);
        input.orderItems.push({ ...input.orderItems[0] });
        const result = await service.createOrder(memberId as unknown as Order['memberId'], input);
        expect(result).toMatchObject({ orderDelivery: 0, orderTotal: 100 });
        expect(items.create).toHaveBeenCalledTimes(2);
    });

    it('keeps delivery fees server-controlled even when an internal caller supplies a fee', async () => {
        const { service, input } = setup(50, ProductType.CHAIR);
        const result = await service.createOrder(memberId as unknown as Order['memberId'], { ...input, orderDelivery: 0 } as OrderInput);
        expect(result).toMatchObject({ orderDelivery: 15, orderTotal: 65 });
    });
});

describe('Order status changes with separate writes', () => {
    const memberId = new Types.ObjectId();
    const shopId = new Types.ObjectId();
    const orderId = new Types.ObjectId();
    const productId = new Types.ObjectId();

    const setup = (status = OrderStatus.PAUSE) => {
        const order = { _id: orderId, memberId, shopId, orderStatus: status };
        const orders = {
            findOne: jest.fn(() => query({ ...order })),
            findOneAndUpdate: jest.fn((search: { orderStatus: OrderStatus }, update: { orderStatus: OrderStatus }) => {
                if (search.orderStatus !== order.orderStatus) return query(null);
                order.orderStatus = update.orderStatus;
                return query({ ...order });
            }),
        };
        const items = { find: jest.fn(() => query([{ productId, itemQuantity: 2 }])) };
        const products = { findOneAndUpdate: jest.fn(() => query<{ productLeftCount: number } | null>({ productLeftCount: 3 })) };
        const members = { exists: jest.fn(() => query({ _id: memberId })) };
        const memberService = { memberStatsEditor: jest.fn(async () => ({ _id: memberId })) };
        const service = new OrderService(
            orders as unknown as Model<Order>, items as unknown as Model<OrderItem>,
            products as unknown as Model<Product>, members as unknown as Model<Member>,
            memberService as unknown as MemberService,
        );
        const input = { _id: orderId as unknown as Order['_id'], orderStatus: OrderStatus.PROCESS };
        return { service, input, order, orders, products, memberService };
    };

    it('uses a conditional stock deduction and reuses the member statistics editor', async () => {
        const { service, input, orders, products, memberService } = setup();
        await service.updateOrder(memberId as unknown as Order['memberId'], input);
        expect(orders.findOne).toHaveBeenCalledWith({ memberId, _id: orderId });
        expect(products.findOneAndUpdate).toHaveBeenCalledWith(expect.objectContaining({
            _id: productId, memberId: shopId, productLeftCount: { $gte: 2 }, deletedAt: null,
        }), { $inc: { productLeftCount: -2 } }, { new: true });
        expect(memberService.memberStatsEditor).toHaveBeenCalledWith({ _id: memberId, targetKey: 'memberPoints', modifier: 1 });
        expect(orders.findOneAndUpdate.mock.invocationCallOrder[0]).toBeLessThan(products.findOneAndUpdate.mock.invocationCallOrder[0]);
    });

    it('does not deduct stock or grant points again for repeated PROCESS requests', async () => {
        const { service, input, products, memberService } = setup();
        await service.updateOrder(memberId as unknown as Order['memberId'], input);
        await service.updateOrder(memberId as unknown as Order['memberId'], input);
        expect(products.findOneAndUpdate).toHaveBeenCalledTimes(1);
        expect(memberService.memberStatsEditor).toHaveBeenCalledTimes(1);
    });

    it('allows only one competing PROCESS request to apply stock and points', async () => {
        const { service, input, products, memberService } = setup();
        const results = await Promise.allSettled([
            service.updateOrder(memberId as unknown as Order['memberId'], input),
            service.updateOrder(memberId as unknown as Order['memberId'], input),
        ]);
        expect(results.some((result) => result.status === 'fulfilled')).toBe(true);
        expect(products.findOneAndUpdate).toHaveBeenCalledTimes(1);
        expect(memberService.memberStatsEditor).toHaveBeenCalledTimes(1);
    });

    it('finishes a processed order without another stock or points update', async () => {
        const { service, input, products, memberService } = setup(OrderStatus.PROCESS);
        input.orderStatus = OrderStatus.FINISHED;
        await expect(service.updateOrder(memberId as unknown as Order['memberId'], input)).resolves.toMatchObject({ orderStatus: OrderStatus.FINISHED });
        expect(products.findOneAndUpdate).not.toHaveBeenCalled();
        expect(memberService.memberStatsEditor).not.toHaveBeenCalled();
    });

    it.each([
        [OrderStatus.PAUSE, OrderStatus.FINISHED],
        [OrderStatus.PROCESS, OrderStatus.PAUSE],
        [OrderStatus.FINISHED, OrderStatus.PAUSE],
        [OrderStatus.FINISHED, OrderStatus.PROCESS],
    ])('rejects %s → %s without changing status, stock or points', async (currentStatus, requestedStatus) => {
        const { service, input, orders, products, memberService } = setup(currentStatus);
        input.orderStatus = requestedStatus;
        await expect(service.updateOrder(memberId as unknown as Order['memberId'], input)).rejects.toThrow('transition');
        expect(orders.findOneAndUpdate).not.toHaveBeenCalled();
        expect(products.findOneAndUpdate).not.toHaveBeenCalled();
        expect(memberService.memberStatsEditor).not.toHaveBeenCalled();
    });

    it('reports stock failure without points; the separate status write remains committed', async () => {
        const { service, input, order, products, memberService } = setup();
        products.findOneAndUpdate.mockReturnValue(query(null));
        await expect(service.updateOrder(memberId as unknown as Order['memberId'], input)).rejects.toThrow('stock');
        expect(memberService.memberStatsEditor).not.toHaveBeenCalled();
        expect(order.orderStatus).toBe(OrderStatus.PROCESS);
    });
});
