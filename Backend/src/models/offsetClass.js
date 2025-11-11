import { Schema, model } from "mongoose";

const offsetClassSchema = new Schema(
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
            type: String // Lý do cần lớp bù
        },
        originalClassId: {
            type: Schema.Types.ObjectId,
            ref: "FixedSchedule"
        },
        notes: {
            type: String
        },
        studentEmail: {
            type: String,  // Email học sinh gửi yêu cầu (optional cho manual creation)
            required: false
        },
        emailSentTime: {
            type: Date,    // Thời gian gửi email (optional cho manual creation)
            required: false
        }
    },
    { timestamps: true }
);

offsetClassSchema.index({ subjectLevelId: 1 });
offsetClassSchema.index({ assignedTeacherId: 1 });
offsetClassSchema.index({ scheduledDate: 1 });
offsetClassSchema.index({ status: 1 });
offsetClassSchema.index({ studentEmail: 1, emailSentTime: 1 }); // ← Index cho duplicate check

const OffsetClass = model("OffsetClass", offsetClassSchema);

export default OffsetClass;
