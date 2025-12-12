import { Schema, model } from "mongoose";

const testClassSchema = new Schema(
    {
        subjectId: {
            type: Schema.Types.ObjectId,
            ref: "Subject",
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

testClassSchema.index({ subjectId: 1 });
testClassSchema.index({ assignedTeacherId: 1 });
testClassSchema.index({ scheduledDate: 1 });
testClassSchema.index({ status: 1 });

const TestClass = model("TestClass", testClassSchema);

export default TestClass;
