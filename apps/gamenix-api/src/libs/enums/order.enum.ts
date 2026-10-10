import { registerEnumType } from '@nestjs/graphql';

export enum OrderStatus {
    PAUSE = 'PAUSE',
    PROCESS = 'PROCESS',
    FINISHED = 'FINISHED',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

export enum OrderDeliveryType {
    PICKUP = 'PICKUP',
    DELIVERY = 'DELIVERY',
}

registerEnumType(OrderDeliveryType, { name: 'OrderDeliveryType' });
