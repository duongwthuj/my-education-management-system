import type { Metadata } from 'next';
import { TeacherDetail } from '../../../../components/teachers/teacher-detail';

export const metadata: Metadata = {
  title: 'Chi tiết giáo viên',
  description: 'Trang thông tin chi tiết về giáo viên',
};

interface TeacherDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TeacherDetailPage({ params }: TeacherDetailPageProps) {
  const { id } = await params;
  return <TeacherDetail teacherId={id} />;
}