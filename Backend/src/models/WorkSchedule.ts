import mongoose, { Schema, Document, Types } from 'mongoose';
import { IWorkSchedule } from '../types';

export interface IWorkScheduleDocument extends IWorkSchedule, Document {
  _id: Types.ObjectId;
  id?: string;
}

const workScheduleSchema = new Schema<IWorkScheduleDocument>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Giáo viên là bắt buộc'],
    } as any,
    dayOfWeek: {
      type: String,
      enum: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'],
      required: [true, 'Ngày trong tuần là bắt buộc'],
    },
    shift: {
      type: String,
      enum: ['Sáng', 'Chiều', 'Tối'],
      required: [true, 'Ca làm là bắt buộc'],
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
    duration: {
      type: Number,
      required: [true, 'Thời lượng là bắt buộc'],
      description: 'Thời lượng ca làm (tính bằng giờ)',
    },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'completed', 'cancelled'],
      default: 'scheduled',
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
workScheduleSchema.index({ teacherId: 1 });
workScheduleSchema.index({ dayOfWeek: 1 });
workScheduleSchema.index({ teacherId: 1, dayOfWeek: 1 });

export default mongoose.model<IWorkScheduleDocument>('WorkSchedule', workScheduleSchema);
