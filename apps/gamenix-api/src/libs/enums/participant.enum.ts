import { registerEnumType } from '@nestjs/graphql';

export enum ParticipantStatus {
    REGISTERED = 'REGISTERED',
    CANCELLED = 'CANCELLED',
}

registerEnumType(ParticipantStatus, { name: 'ParticipantStatus' });
