import { Field, InputType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { IsEnum, IsMongoId } from 'class-validator';
import { OrderStatus } from '../../enums/order.enum';

@InputType()
export class OrderUpdate {
    @IsMongoId()
    @Field(() => String)
    _id: ObjectId;

    @IsEnum(OrderStatus)
    @Field(() => OrderStatus)
    orderStatus: OrderStatus;
}
