export interface Schedule {
  _id?: string;
  id?: string;
  teacherId: string;
  subjectId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}