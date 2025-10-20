export interface TeacherTimeSlot {
  time: string;
  status: 'available' | 'teaching' | 'unavailable';
  period: 'morning' | 'afternoon' | 'evening';
}

export interface TeacherScheduleDay {
  date: string;
  weekday: string;
  slots: TeacherTimeSlot[];
}

export interface TeacherSchedule {
  [teacherName: string]: TeacherScheduleDay[];
}