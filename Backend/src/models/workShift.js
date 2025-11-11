import { Schema, model } from "mongoose";

const workShiftSchema = new Schema(
    {
        teacherId: {
            type: Schema.Types.ObjectId,
            ref: "Teacher",
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        shiftId: {
            type: Schema.Types.ObjectId,
            ref: "Shift",
            required: true
        },
        isAvailable: {
            type: Boolean,
            default: true
        },
        isOnLeave: {
            type: Boolean,
            default: false
        },
        leaveReason: {
            type: String
        },
        notes: {
            type: String
        }
    },
    { timestamps: true }
);

// Index để tránh trùng lặp và query nhanh
workShiftSchema.index({ teacherId: 1, date: 1, shiftId: 1 }, { unique: true });
workShiftSchema.index({ teacherId: 1, date: 1 });
workShiftSchema.index({ date: 1 });

const WorkShift = model("WorkShift", workShiftSchema);

export default WorkShift;
