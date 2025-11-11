import { Schema, model } from "mongoose";


const teacherLevelSchema = new Schema(
    {
        teacherId: {
            type: Schema.Types.ObjectId,
            ref: "Teacher",
            required: true
        },
        subjectLevelId: {
            type: Schema.Types.ObjectId,
            ref: "SubjectLevel",
            required: true
        },
        experienceYears: {
            type: Number,
            default: 0
        },
        certifications: [{
            name: String,
            issuedDate: Date,
            expiryDate: Date
        }],
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);


teacherLevelSchema.index({ teacherId: 1, subjectLevelId: 1 }, { unique: true });
teacherLevelSchema.index({ teacherId: 1 });
teacherLevelSchema.index({ subjectLevelId: 1 });

const TeacherLevel = model("TeacherLevel", teacherLevelSchema);

export default TeacherLevel;
