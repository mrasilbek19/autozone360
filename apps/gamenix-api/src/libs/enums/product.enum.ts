import { registerEnumType } from '@nestjs/graphql';

export enum ProductType {
    KEYBOARD = 'KEYBOARD',
    MOUSE = 'MOUSE',
    MONITOR = 'MONITOR',
    HEADPHONES = 'HEADPHONES',
    CHAIR = 'CHAIR',
    DESK = 'DESK',
    CONTROLLER = 'CONTROLLER',
    ACCESSORY = 'ACCESSORY',
    GPU = 'GPU',
    GAMING_PHONE = 'GAMING_PHONE',
}
registerEnumType(ProductType, { name: 'ProductType' });

export enum ProductStatus {
    PAUSE = 'PAUSE',
    PROCESS = 'PROCESS',
    FINISHED = 'FINISHED',
}
registerEnumType(ProductStatus, { name: 'ProductStatus' });
