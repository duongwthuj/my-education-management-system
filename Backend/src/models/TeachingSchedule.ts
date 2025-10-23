import mongoose, { Schema, Document, Types } from 'mongoose';
import { ITeachingSchedule } from '../types';

export interface ITeachingScheduleDocument extends ITeachingSchedule, Document {
  _id: Types.ObjectId;
  id?: string;
}

const teachingScheduleSchema = new Schema<ITeachingScheduleDocument>(
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
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Môn học là bắt buộc'],
    } as any,
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
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
    description: {
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
        if (ret.subjectId && typeof ret.subjectId === 'object') {
          ret.subjectId = ret.subjectId._id ? ret.subjectId._id.toString() : ret.subjectId.toString();
        }
        if (ret.classId && typeof ret.classId === 'object') {
          ret.classId = ret.classId._id ? ret.classId._id.toString() : ret.classId.toString();
        }
        
        return ret;
      },
    },
  }
);

// Indexes
teachingScheduleSchema.index({ teacherId: 1, dayOfWeek: 1 });
teachingScheduleSchema.index({ workScheduleId: 1 });
teachingScheduleSchema.index({ subjectId: 1 });
teachingScheduleSchema.index({ classId: 1 });
teachingScheduleSchema.index({ status: 1 });

export default mongoose.model<ITeachingScheduleDocument>('TeachingSchedule', teachingScheduleSchema);
