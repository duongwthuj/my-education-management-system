import type { Metadata } from 'next';
import { ClassesList } from '../../../components/classes/classes-list';

export const metadata: Metadata = {
  title: 'Thông tin lớp mới',
  description: 'Trang quản lý các thông tin lớp mới',
};

export default function ClassesPage() {
  return <ClassesList />;
}