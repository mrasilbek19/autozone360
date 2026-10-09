import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { OrderStatus } from '../../enums/order.enum';

@ObjectType()
export class Order {
    @Field(() => String)
    _id: ObjectId;

    @Field(() => Number)
    orderTotal: number;

    @Field(() => String)
    orderDelivery: string;

    @Field(() => OrderStatus)
    orderStatus: OrderStatus;

    @Field(() => String)
    memberId: ObjectId;

    @Field(() => String)
    shopId: ObjectId;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;
}
