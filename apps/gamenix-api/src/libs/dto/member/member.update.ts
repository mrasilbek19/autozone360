import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { MemberStatus, MemberType } from '../../enums/member.enum';
import { ObjectId } from 'mongoose';

@InputType()
export class MemberUpdate {
    @IsNotEmpty()
    @Field(() => String)
    _id: ObjectId;

    @IsOptional()
    @Field(() => MemberType, { nullable: true })
    memberType?: MemberType;

    @IsOptional()
    @Field(() => MemberStatus, { nullable: true })
    memberStatus?: MemberStatus;

    @IsOptional()
    @Field(() => String, { nullable: true })
    memberPhone?: string;

    @IsOptional()
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    @IsEmail()
    @Field(() => String, { nullable: true })
    memberEmail?: string;

    @IsOptional()
    @Length(3, 12)
    @Field(() => String, { nullable: true })
    memberNick?: string;

    @IsOptional()
    @Length(5, 12)
    @Field(() => String, { nullable: true })
    memberPassword?: string;

    @IsOptional()
    @Length(3, 100)
    @Field(() => String, { nullable: true })
    memberFullName?: string;

    @IsOptional()
    @Field(() => String, { nullable: true })
    memberImage?: string;

    @IsOptional()
    @Field(() => String, { nullable: true })
    memberAddress?: string;

    @IsOptional()
    @Field(() => String, { nullable: true })
    memberDesc?: string;

    deletedAt?: Date;
}
