import type { Metadata } from 'next';
import { SubjectsList } from '../../../components/subjects/subjects-list';
import { Suspense } from 'react';
import { LinearProgress } from '@mui/material';

export const metadata: Metadata = {
  title: 'Quản lý môn học | Hệ thống quản lý giáo dục',
  description: 'Quản lý danh sách và thông tin chi tiết các môn học trong hệ thống',
};

// Loader component
function SubjectsLoader() {
  return (
    <div style={{ padding: '20px' }}>
      <LinearProgress />
    </div>
  );
}

export default function SubjectsPage() {
  return (
    <Suspense fallback={<SubjectsLoader />}>
      <SubjectsList />
    </Suspense>
  );
}