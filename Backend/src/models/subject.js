import { Schema, model } from "mongoose";

const subjectSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true
        },
        code: {
            type: String,
            required: true,
            unique: true
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

subjectSchema.virtual('levels', {
    ref: 'SubjectLevel',
    localField: '_id',
    foreignField: 'subjectId'
});


subjectSchema.set('toJSON', { virtuals: true });
subjectSchema.set('toObject', { virtuals: true });

const Subject = model("Subject", subjectSchema);

export default Subject;
