import { Schema } from 'mongoose';
import { ParticipantStatus } from '../libs/enums/participant.enum';

const EventParticipantSchema = new Schema(
    {
        eventId: {
            type: Schema.Types.ObjectId,
            ref: 'Event',
            required: true,
        },

        memberId: {
            type: Schema.Types.ObjectId,
            ref: 'Member',
            required: true,
        },

        participantStatus: {
            type: String,
            enum: ParticipantStatus,
            required: true,
            default: ParticipantStatus.REGISTERED,
        },
    },
    { timestamps: true, collection: 'eventParticipants' },
);

EventParticipantSchema.index({ eventId: 1, memberId: 1 }, { unique: true });

export default EventParticipantSchema;
