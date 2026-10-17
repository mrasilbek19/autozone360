import { Schema } from 'mongoose';
import { EventType, EventStatus } from '../libs/enums/event.enum';

const EventSchema = new Schema(
    {
        eventType: {
            type: String,
            enum: EventType,
            required: true,
        },

        eventStatus: {
            type: String,
            enum: EventStatus,
            required: true,
            default: EventStatus.PENDING,
        },

        eventTitle: {
            type: String,
            required: true,
        },

        eventDesc: {
            type: String,
            required: true,
        },

        eventGame: {
            type: String,
            required: true,
        },

        eventImage: {
            type: String,
            required: true,
        },

        eventDate: {
            type: Date,
            required: true,
        },

        eventMaxParticipants: {
            type: Number,
            required: true,
            min: 1,
            validate: { validator: Number.isInteger, message: 'Must be an integer' },
        },

        eventOrganizer: {
            type: Schema.Types.ObjectId,
            ref: 'Member',
            required: true,
        },

        eventStart: {
            type: Date,
            required: true,
        },

        eventEnd: {
            type: Date,
            required: true,
        },

        eventPrize: {
            type: String,
            required: true,
        },

        deletedAt: {
            type: Date,
            default: null,
        },

    },
    { timestamps: true, collection: 'events' },
);

export default EventSchema;
