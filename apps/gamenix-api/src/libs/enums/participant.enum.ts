import { registerEnumType } from '@nestjs/graphql';

export enum ParticipantStatus {
    PENDING = 'PENDING',
    REGISTERED = 'REGISTERED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
}

registerEnumType(ParticipantStatus, { name: 'ParticipantStatus' });
