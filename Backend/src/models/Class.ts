import mongoose, { Schema, Document, Types } from 'mongoose';
import { IClass } from '../types';

export interface IClassDocument extends IClass, Document {}

const classSchema = new Schema<IClassDocument>(
  {
    name: {
      type: String,
      required: [true, 'Tên lớp học là bắt buộc'],
      trim: true,
    },
    subjectId: {
      type: Types.ObjectId,
      ref: 'Subject',
      required: true,
    } as any,
    startDate: {
      type: String,
      required: [true, 'Ngày bắt đầu là bắt buộc'],
    },
    endDate: {
      type: String,
      required: [true, 'Ngày kết thúc là bắt buộc'],
    },
    studentsCount: {
      type: Number,
      required: [true, 'Số lượng học sinh là bắt buộc'],
      min: [0, 'Số lượng học sinh phải lớn hơn hoặc bằng 0'],
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed'],
      default: 'pending',
    },
    teacherId: {
      type: Types.ObjectId,
      ref: 'Teacher',
    } as any,
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
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
classSchema.index({ status: 1 });
classSchema.index({ subjectId: 1 });
classSchema.index({ teacherId: 1 });
classSchema.index({ startDate: 1, endDate: 1 });
classSchema.index({ name: 'text', description: 'text' });

export default mongoose.model<IClassDocument>('Class', classSchema);
