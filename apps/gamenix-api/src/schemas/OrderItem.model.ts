import { Schema } from 'mongoose';

const OrderItemSchema = new Schema(
    {
        itemQuantity: {
            type: Number,
            required: true,
            min: 1,
            validate: { validator: Number.isInteger, message: 'Must be an integer' },
        },

        itemPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },

        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },

    },
    { timestamps: true, collection: 'orderItems' },
);

export default OrderItemSchema;
