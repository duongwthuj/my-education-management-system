import { Schema, model } from "mongoose";

const teacherSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        phone: {
            type: String
        },
        address: {
            type: String
        },
        dateOfBirth: {
            type: Date
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'on_leave'],
            default: 'active'
        },
        qualifications: [{
            degree: String,
            institution: String,
            year: Number
        }],
        bio: {
            type: String
        },
        maxOffsetClasses: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    { timestamps: true }
);

// Virtual để lấy danh sách SubjectLevel mà giáo viên dạy
teacherSchema.virtual('subjectLevels', {
    ref: 'TeacherLevel',
    localField: '_id',
    foreignField: 'teacherId'
});

// Virtual để lấy WorkShift của giáo viên
teacherSchema.virtual('workShifts', {
    ref: 'WorkShift',
    localField: '_id',
    foreignField: 'teacherId'
});

// Virtual để lấy FixedSchedule của giáo viên
teacherSchema.virtual('fixedSchedules', {
    ref: 'FixedSchedule',
    localField: '_id',
    foreignField: 'teacherId'
});

// Đảm bảo virtuals được include khi convert sang JSON
teacherSchema.set('toJSON', { virtuals: true });
teacherSchema.set('toObject', { virtuals: true });

const Teacher = model("Teacher", teacherSchema);

export default Teacher;