import { Field, Int, InputType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { IsDate, IsEnum, IsInt, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class OrderItemUpdate {
    @IsMongoId()
    @Field(() => String)
    _id: ObjectId;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Field(() => Int, { nullable: true })
    itemQuantity?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Field(() => Number, { nullable: true })
    itemPrice?: number;
}
