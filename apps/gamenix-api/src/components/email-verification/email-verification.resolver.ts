import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Request } from 'express';
import { ObjectId } from 'mongoose';
import { VerifyEmailInput } from '../../libs/dto/auth/verify-email.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { EmailVerificationService } from './email-verification.service';

@Resolver()
export class EmailVerificationResolver {
    constructor(private readonly emailVerificationService: EmailVerificationService) { }

    @UseGuards(AuthGuard)
    @Mutation(() => Boolean)
    public async requestEmailVerification(
        @AuthMember('_id') memberId: ObjectId,
        @Context('req') request: Request,
    ): Promise<boolean> {
        return this.emailVerificationService.requestEmailVerification(memberId, request.ip ?? request.socket?.remoteAddress);
    }

    @Mutation(() => Boolean)
    public async verifyEmail(@Args('input') input: VerifyEmailInput, @Context('req') request: Request): Promise<boolean> {
        return this.emailVerificationService.verifyEmail(input.token, request.ip ?? request.socket?.remoteAddress);
    }
}
