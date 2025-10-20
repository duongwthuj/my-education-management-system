import mongoose, { Schema, Document } from 'mongoose';
import { ITeacher } from '../types';

export interface ITeacherDocument extends ITeacher, Document {}

const teacherSchema = new Schema<ITeacherDocument>(
  {
    name: {
      type: String,
      required: [true, 'Tên giáo viên là bắt buộc'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại là bắt buộc'],
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      required: [true, 'Địa chỉ là bắt buộc'],
      trim: true,
    },
    joinDate: {
      type: String,
      required: [true, 'Ngày tham gia là bắt buộc'],
    },
    status: {
      type: String,
      enum: ['active', 'on-leave', 'inactive'],
      default: 'active',
    },
    education: {
      type: String,
      required: [true, 'Trình độ học vấn là bắt buộc'],
    },
    bio: {
      type: String,
      default: '',
    },
    subjects: [{
      type: Schema.Types.ObjectId,
      ref: 'Subject',
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
teacherSchema.index({ email: 1 });
teacherSchema.index({ status: 1 });
teacherSchema.index({ name: 'text' });

export default mongoose.model<ITeacherDocument>('Teacher', teacherSchema);
