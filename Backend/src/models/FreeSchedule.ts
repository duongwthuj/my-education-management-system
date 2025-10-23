import mongoose, { Schema, Document, Types } from 'mongoose';
import { IFreeSchedule } from '../types';

export interface IFreeScheduleDocument extends IFreeSchedule, Document {
  _id: Types.ObjectId;
  id?: string;
}

const freeScheduleSchema = new Schema<IFreeScheduleDocument>(
  {
    workScheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkSchedule',
      required: [true, 'Lịch làm việc là bắt buộc'],
    } as any,
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
    reason: {
      type: String,
      enum: ['break', 'lunch', 'other'],
      default: 'break',
      description: 'Lý do rảnh: giải lao, ăn trưa, hoặc khác',
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
        
        // Convert ObjectId references to strings
        if (ret.workScheduleId && typeof ret.workScheduleId === 'object') {
          ret.workScheduleId = ret.workScheduleId._id ? ret.workScheduleId._id.toString() : ret.workScheduleId.toString();
        }
        if (ret.teacherId && typeof ret.teacherId === 'object') {
          ret.teacherId = ret.teacherId._id ? ret.teacherId._id.toString() : ret.teacherId.toString();
        }
        
        return ret;
      },
    },
  }
);

// Indexes
freeScheduleSchema.index({ teacherId: 1, dayOfWeek: 1 });
freeScheduleSchema.index({ workScheduleId: 1 });
freeScheduleSchema.index({ reason: 1 });

export default mongoose.model<IFreeScheduleDocument>('FreeSchedule', freeScheduleSchema);
