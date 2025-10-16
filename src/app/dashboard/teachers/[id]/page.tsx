import type { Metadata } from 'next';
import { TeacherDetail } from '../../../../components/teachers/teacher-detail';

export const metadata: Metadata = {
  title: 'Chi tiết giáo viên',
  description: 'Trang thông tin chi tiết về giáo viên',
};

interface TeacherDetailPageProps {
  params: {
    id: string;
  };
}

export default function TeacherDetailPage({ params }: TeacherDetailPageProps) {
  return <TeacherDetail teacherId={params.id} />;
}