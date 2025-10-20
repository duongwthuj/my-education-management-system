import mongoose, { Schema, Document } from 'mongoose';
import { ISubject } from '../types';

export interface ISubjectDocument extends ISubject, Document {}

const subjectSchema = new Schema<ISubjectDocument>(
  {
    name: {
      type: String,
      required: [true, 'Tên môn học là bắt buộc'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Mã môn học là bắt buộc'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Mô tả là bắt buộc'],
    },
    category: {
      type: String,
      required: [true, 'Danh mục là bắt buộc'],
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: [true, 'Cấp độ là bắt buộc'],
    },
    teachers: [{
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
    }],
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
subjectSchema.index({ code: 1 });
subjectSchema.index({ category: 1 });
subjectSchema.index({ level: 1 });
subjectSchema.index({ name: 'text', description: 'text' });

export default mongoose.model<ISubjectDocument>('Subject', subjectSchema);
