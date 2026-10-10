import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { OrderService } from './order.service';
import { Order } from '../../libs/dto/order/order';
import { OrderInput, OrdersInquiry } from '../../libs/dto/order/order.input';
import { OrderUpdate } from '../../libs/dto/order/order.update';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';

@Resolver()
export class OrderResolver {
    constructor(private readonly orderService: OrderService) { }

    @UseGuards(AuthGuard)
    @Mutation(() => Order)
    public async createOrder(
        @Args('input') input: OrderInput,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Order> {
        console.log('Mutation: createOrder');
        return await this.orderService.createOrder(memberId, input);
    }

    @UseGuards(AuthGuard)
    @Query(() => [Order])
    public async getMyOrders(
        @Args('input') input: OrdersInquiry,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Order[]> {
        console.log('Query: getMyOrders');
        return await this.orderService.getMyOrders(memberId, input);
    }

    @UseGuards(AuthGuard)
    @Mutation(() => Order)
    public async updateOrder(
        @Args('input') input: OrderUpdate,
        @AuthMember('_id') memberId: ObjectId,
    ): Promise<Order> {
        console.log('Mutation: updateOrder');
        return await this.orderService.updateOrder(memberId, input);
    }
}
