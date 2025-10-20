export interface Class {
  id: string;
  name: string;
  subjectId: string;
  startDate: string;
  endDate: string;
  studentsCount: number;
  status: 'pending' | 'active' | 'completed';
  teacherId?: string;
  description: string;
  location: string;
}