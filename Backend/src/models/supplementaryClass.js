import { Schema, model } from "mongoose";

const supplementaryClassSchema = new Schema(
    {
        subjectLevelId: {
            type: Schema.Types.ObjectId,
            ref: "SubjectLevel",
            required: true
        },
        assignedTeacherId: {
            type: Schema.Types.ObjectId,
            ref: "Teacher",
            default: null
        },
        className: {
            type: String,
            required: true
        },
        scheduledDate: {
            type: Date,
            required: true
        },
        startTime: {
            type: String, // Format: "HH:mm"
            required: true
        },
        endTime: {
            type: String, // Format: "HH:mm"
            required: true
        },
        meetingLink: {
            type: String // Link Zoom, Google Meet, etc.
        },
        status: {
            type: String,
            enum: ['pending', 'assigned', 'completed', 'cancelled'],
            default: 'pending'
        },
        reason: {
            type: String // Lý do cần lớp bổ trợ
        },
        notes: {
            type: String
        },
        studentEmail: {
            type: String,  // Email học sinh gửi yêu cầu (optional)
            required: false
        },
        emailSentTime: {
            type: Date,    // Thời gian gửi email (optional)
            required: false
        },
        assignedHistory: {
            type: [{ type: Schema.Types.ObjectId, ref: 'Teacher' }],
            default: []
        }
    },
    { timestamps: true }
);

supplementaryClassSchema.index({ subjectLevelId: 1 });
supplementaryClassSchema.index({ assignedTeacherId: 1 });
supplementaryClassSchema.index({ scheduledDate: 1 });
supplementaryClassSchema.index({ status: 1 });

const SupplementaryClass = model("SupplementaryClass", supplementaryClassSchema);

export default SupplementaryClass;
