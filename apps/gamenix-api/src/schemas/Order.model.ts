import { Schema } from 'mongoose';
import { OrderStatus } from '../libs/enums/order.enum';

const OrderSchema = new Schema(
    {
        orderTotal: {
            type: Number,
            required: true,
            min: 0,
        },

        orderDelivery: {
            type: String,
            required: true,
        },

        orderStatus: {
            type: String,
            enum: OrderStatus,
            required: true,
            default: OrderStatus.PAUSE,
        },

        memberId: {
            type: Schema.Types.ObjectId,
            ref: 'Member',
            required: true,
        },

        shopId: {
            type: Schema.Types.ObjectId,
            ref: 'Member',
            required: true,
        },

    },
    { timestamps: true, collection: 'order' },
);

export default OrderSchema;
