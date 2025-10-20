import type { Metadata } from 'next';
import { TeachersList } from '../../../components/teachers/teachers-list';

export const metadata: Metadata = {
  title: 'Quản lý giáo viên',
  description: 'Trang quản lý danh sách giáo viên',
};

export default function TeachersPage() {
  return <TeachersList />;
}