import { Schema, model } from "mongoose";

const notificationSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['new_offset_class', 'offset_assigned', 'offset_completed', 'offset_cancelled'],
            required: true
        },
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        relatedId: {
            type: Schema.Types.ObjectId,
            ref: 'OffsetClass'
        },
        isRead: {
            type: Boolean,
            default: false
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium'
        }
    },
    { timestamps: true }
);

// Index để query nhanh
notificationSchema.index({ isRead: 1, createdAt: -1 });

const Notification = model("Notification", notificationSchema);

export default Notification;
