import { Field, Int, InputType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { IsInt, IsMongoId, IsNotEmpty, Min } from 'class-validator';

@InputType()
export class OrderItemInput {
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Field(() => Int)
    itemQuantity: number;

    @IsNotEmpty()
    @IsMongoId()
    @Field(() => String)
    productId: ObjectId;
}
