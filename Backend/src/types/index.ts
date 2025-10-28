// Teacher
export interface ITeacher {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  address: string;
  joinDate: string;
  status: 'active' | 'on-leave' | 'inactive';
  education: string;
  bio: string;
  subjects: string[];
  fixedClasses?: Array<{
    classId: string;
    subjectId: string;
    dayOfWeek: string;
    shift: string;
    startTime: string;
    endTime: string;
    room?: string;
  }>;
}

// Subject
export interface ISubject {
  name: string;
  code: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  teachers: string[];
}

// Class
export interface IClass {
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

// Schedule (Legacy - kept for compatibility)
export interface ISchedule {
  teacherId: string;
  subjectId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

// Work Schedule - Shift Registration
export interface IWorkSchedule {
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
export interface ITeachingSchedule {
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
export interface IFreeSchedule {
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

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
