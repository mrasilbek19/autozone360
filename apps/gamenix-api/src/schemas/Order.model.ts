import { Schema } from 'mongoose';
import { OrderDeliveryType, OrderStatus } from '../libs/enums/order.enum';

const OrderSchema = new Schema(
    {
        orderTotal: {
            type: Number,
            required: true,
            min: 0,
        },

        orderDelivery: {
            type: Number,
            required: true,
            min: 0,
        },

        orderAddress: {
            type: String,
            required: function () {
                return this.orderDeliveryType === OrderDeliveryType.DELIVERY;
            },
        },

        orderDeliveryType: {
            type: String,
            enum: OrderDeliveryType,
            required: true,
            default: OrderDeliveryType.DELIVERY,
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
