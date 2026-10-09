import { Field, InputType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { IsDate, IsEnum, IsInt, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { OrderStatus } from '../../enums/order.enum';

@InputType()
export class OrderInput {
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    @Field(() => Number)
    orderTotal: number;

    @IsNotEmpty()
    @IsString()
    @Field(() => String)
    orderDelivery: string;

    @IsOptional()
    @IsEnum(OrderStatus)
    @Field(() => OrderStatus, { nullable: true })
    orderStatus?: OrderStatus;

    memberId?: ObjectId;

    @IsNotEmpty()
    @IsMongoId()
    @Field(() => String)
    shopId: ObjectId;
}
