// Teach - Fixed/Session Class Assignment
export interface Teach {
  _id?: string;
  id?: string;
  teacherId: string;
  subjectId: string;
  className?: string;
  sessionClassId?: string;
  classType: 'fixed' | 'session';
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

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

// Work Schedule - Shift Registration
export interface WorkSchedule {
  id: string;
  teacherId: string;
  dayOfWeek: string;
  shift: 'Sáng' | 'Chiều' | 'Tối';
  startTime: string;
  endTime: string;
  duration: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Teaching Schedule - Teaching Assignment
export interface TeachingSchedule {
  id: string;
  workScheduleId: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Free Schedule - Break Time
export interface FreeSchedule {
  id: string;
  workScheduleId: string;
  teacherId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  reason: 'break' | 'lunch' | 'other';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}