import { Field, InputType } from '@nestjs/graphql';
import { IsString, Matches } from 'class-validator';

@InputType()
export class VerifyEmailInput {
    @IsString()
    @Matches(/^[a-f0-9]{64}$/)
    @Field(() => String)
    token: string;
}
