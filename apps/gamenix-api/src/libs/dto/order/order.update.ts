import { Field, InputType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { IsDate, IsEnum, IsInt, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { OrderStatus } from '../../enums/order.enum';

@InputType()
export class OrderUpdate {
    @IsMongoId()
    @Field(() => String)
    _id: ObjectId;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Field(() => Number, { nullable: true })
    orderTotal?: number;

    @IsOptional()
    @IsString()
    @Field(() => String, { nullable: true })
    orderDelivery?: string;

    @IsOptional()
    @IsEnum(OrderStatus)
    @Field(() => OrderStatus, { nullable: true })
    orderStatus?: OrderStatus;
}
