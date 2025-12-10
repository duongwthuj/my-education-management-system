import { Schema, model } from "mongoose";

const fixedScheduleLeaveSchema = new Schema(
    {
        fixedScheduleId: {
            type: Schema.Types.ObjectId,
            ref: "FixedSchedule",
            required: true
        },
        teacherId: {
            type: Schema.Types.ObjectId,
            ref: "Teacher",
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        reason: {
            type: String
        },
        substituteTeacherId: {
            type: Schema.Types.ObjectId,
            ref: "Teacher",
            required: false
        }
    },
    { timestamps: true }
);

// Index để tránh trùng lặp và query nhanh
fixedScheduleLeaveSchema.index({ fixedScheduleId: 1, date: 1 }, { unique: true });
fixedScheduleLeaveSchema.index({ teacherId: 1, date: 1 });

const FixedScheduleLeave = model("FixedScheduleLeave", fixedScheduleLeaveSchema);

export default FixedScheduleLeave;
