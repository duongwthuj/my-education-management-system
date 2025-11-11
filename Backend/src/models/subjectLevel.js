import { Schema, model } from "mongoose";

const subjectLevelSchema = new Schema(
    {
        subjectId: {
            type: Schema.Types.ObjectId,
            ref: "Subject",
            required: true
        },
        semester: {
            type: Number,
            required: true,
            min: 1,
            max: 12
        },
        name: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

// Index để tránh trùng lặp môn học và học phần
subjectLevelSchema.index({ subjectId: 1, semester: 1 }, { unique: true });

const SubjectLevel = model("SubjectLevel", subjectLevelSchema);

export default SubjectLevel;
