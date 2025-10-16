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

// Schedule
export interface ISchedule {
  teacherId: string;
  subjectId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
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
