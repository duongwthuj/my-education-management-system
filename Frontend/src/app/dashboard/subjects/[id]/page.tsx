'use client';

import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Box } from '@mui/material';
import { SubjectDetail } from '@/components/subjects/subject-detail';

export default function SubjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;

  return (
    <Box sx={{ p: 3 }}>
      <SubjectDetail
        subjectId={subjectId}
        onBack={() => router.back()}
      />
    </Box>
  );
}
