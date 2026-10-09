import { Field, Int, InputType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { IsDate, IsEnum, IsInt, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class OrderItemInput {
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Field(() => Int)
    itemQuantity: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    @Field(() => Number)
    itemPrice: number;

    @IsNotEmpty()
    @IsMongoId()
    @Field(() => String)
    orderId: ObjectId;

    @IsNotEmpty()
    @IsMongoId()
    @Field(() => String)
    productId: ObjectId;
}
