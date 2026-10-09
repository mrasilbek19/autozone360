import { registerEnumType } from '@nestjs/graphql';

export enum EventType {
    TOURNAMENT = 'TOURNAMENT',
    GIVEAWAY = 'GIVEAWAY',
}

registerEnumType(EventType, { name: 'EventType' });

export enum EventStatus {
    PAUSED = 'PAUSED',
    PROCESS = 'PROCESS',
    FINISHED = 'FINISHED',
}

registerEnumType(EventStatus, { name: 'EventStatus' });
