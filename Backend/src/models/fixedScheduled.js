import { Schema, model } from "mongoose";

const fixedScheduleSchema = new Schema(
    {
        teacherId: {
            type: Schema.Types.ObjectId,
            ref: "Teacher",
            required: true
        },
        subjectLevelId: {
            type: Schema.Types.ObjectId,
            ref: "SubjectLevel",
            required: false
        },
        subjectId: {
            type: Schema.Types.ObjectId,
            ref: "Subject",
            required: true
        },
        className: {
            type: String,
            required: true
        },
        dayOfWeek: {
            type: String,
            required: true,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
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
        isActive: {
            type: Boolean,
            default: true
        },
        notes: {
            type: String
        }
    },
    { timestamps: true }
);

fixedScheduleSchema.index({ teacherId: 1 });
fixedScheduleSchema.index({ subjectLevelId: 1 });
fixedScheduleSchema.index({ dayOfWeek: 1, startTime: 1 });

const FixedSchedule = model("FixedSchedule", fixedScheduleSchema);

export default FixedSchedule;
