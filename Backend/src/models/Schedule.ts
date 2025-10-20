import mongoose, { Schema, Document } from 'mongoose';
import { ISchedule } from '../types';

export interface IScheduleDocument extends ISchedule, Document {}

const scheduleSchema = new Schema<IScheduleDocument>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Giáo viên là bắt buộc'],
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Môn học là bắt buộc'],
    },
    dayOfWeek: {
      type: String,
      required: [true, 'Ngày trong tuần là bắt buộc'],
      enum: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'],
    },
    startTime: {
      type: String,
      required: [true, 'Giờ bắt đầu là bắt buộc'],
    },
    endTime: {
      type: String,
      required: [true, 'Giờ kết thúc là bắt buộc'],
    },
    room: {
      type: String,
      required: [true, 'Phòng học là bắt buộc'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
scheduleSchema.index({ teacherId: 1, dayOfWeek: 1 });
scheduleSchema.index({ subjectId: 1 });
scheduleSchema.index({ status: 1 });
scheduleSchema.index({ dayOfWeek: 1, startTime: 1 });

export default mongoose.model<IScheduleDocument>('Schedule', scheduleSchema);
