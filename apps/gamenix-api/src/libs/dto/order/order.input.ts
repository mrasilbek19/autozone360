import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min, ValidateNested, Matches, ValidateIf } from 'class-validator';
import { OrderDeliveryType, OrderStatus } from '../../enums/order.enum';
import { OrderItemInput } from '../order-item/order-item.input';

@InputType()
export class OrderInput {
    @IsOptional()
    @IsEnum(OrderDeliveryType)
    @Field(() => OrderDeliveryType, { nullable: true, defaultValue: OrderDeliveryType.DELIVERY })
    orderDeliveryType?: OrderDeliveryType;

    @ValidateIf((input: OrderInput) =>
        (input.orderDeliveryType ?? OrderDeliveryType.DELIVERY) === OrderDeliveryType.DELIVERY || input.orderAddress != null
    )
    @IsString()
    @Matches(/\S/, { message: 'Delivery address must not be empty' })
    @Field(() => String, { nullable: true })
    orderAddress?: string;

    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(100)
    @ValidateNested({ each: true })
    @Type(() => OrderItemInput)
    @Field(() => [OrderItemInput])
    orderItems: OrderItemInput[];
}

@InputType()
export class OrdersInquiry {
    @IsInt()
    @Min(1)
    @Field(() => Int)
    page: number;

    @IsInt()
    @Min(1)
    @Max(100)
    @Field(() => Int)
    limit: number;

    @IsOptional()
    @IsEnum(OrderStatus)
    @Field(() => OrderStatus, { nullable: true })
    orderStatus?: OrderStatus;
}
