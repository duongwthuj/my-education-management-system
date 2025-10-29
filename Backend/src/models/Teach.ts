import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITeach {
  teacherId: Types.ObjectId;
  subjectId: Types.ObjectId;
  // For fixed classes (school-year classes) use `className` (string)
  // For one-off/session classes, reference the actual Class document in `sessionClassId`.
  className?: string;
  sessionClassId?: Types.ObjectId;
  classType: 'fixed' | 'session';
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface ITeachDocument extends ITeach, Document {
  _id: Types.ObjectId;
  id?: string;
}

const teachSchema = new Schema<ITeachDocument>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Giáo viên là bắt buộc'],
    } as any,
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Môn học là bắt buộc'],
    } as any,
    className: {
      type: String,
      trim: true,
    },
    // Optional reference to a Class document when this Teach represents a session/one-off class
    sessionClassId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    } as any,
    classType: {
      type: String,
      enum: ['fixed', 'session'],
      default: 'fixed',
      required: [true, 'Loại lớp (classType) là bắt buộc'],
    },
    dayOfWeek: {
      type: String,
      enum: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'],
      required: [true, 'Ngày trong tuần là bắt buộc'],
    },
    startTime: {
      type: String,
      required: [true, 'Giờ bắt đầu là bắt buộc'],
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng giờ không hợp lệ (HH:mm)'],
    },
    endTime: {
      type: String,
      required: [true, 'Giờ kết thúc là bắt buộc'],
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng giờ không hợp lệ (HH:mm)'],
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
teachSchema.index({ teacherId: 1 });
teachSchema.index({ subjectId: 1 });
teachSchema.index({ className: 1 });
teachSchema.index({ sessionClassId: 1 });
teachSchema.index({ teacherId: 1, dayOfWeek: 1, startTime: 1 });

// Unique constraint: Một giáo viên không thể dạy 2 lớp khác nhau cùng 1 thời gian
// Note: Mongoose unique doesn't work well with findByIdAndUpdate - we'll handle in code
teachSchema.index(
  { teacherId: 1, dayOfWeek: 1, startTime: 1, endTime: 1 },
  { unique: false } // Removed unique to handle in code
);

export default mongoose.model<ITeachDocument>('Teach', teachSchema);
