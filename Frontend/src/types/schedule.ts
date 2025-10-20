export interface Schedule {
  id: string;
  teacherId: string;
  subjectId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}