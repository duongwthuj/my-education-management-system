import { Schedule } from '@/types';

export const schedules: Schedule[] = [
  {
    id: '1',
    teacherId: '1',
    subjectId: '1',
    dayOfWeek: 'Thứ 2',
    startTime: '08:00',
    endTime: '10:00',
    room: 'A101',
    status: 'scheduled'
  },
  {
    id: '2',
    teacherId: '1',
    subjectId: '3',
    dayOfWeek: 'Thứ 2',
    startTime: '13:00',
    endTime: '15:00',
    room: 'A102',
    status: 'scheduled'
  },
  {
    id: '3',
    teacherId: '1',
    subjectId: '5',
    dayOfWeek: 'Thứ 3',
    startTime: '08:00',
    endTime: '10:00',
    room: 'A103',
    status: 'scheduled'
  },
  {
    id: '4',
    teacherId: '2',
    subjectId: '2',
    dayOfWeek: 'Thứ 4',
    startTime: '07:30',
    endTime: '09:30',
    room: 'B201',
    status: 'scheduled'
  },
  {
    id: '5',
    teacherId: '2',
    subjectId: '4',
    dayOfWeek: 'Thứ 4',
    startTime: '13:30',
    endTime: '15:30',
    room: 'B202',
    status: 'scheduled'
  },
  {
    id: '6',
    teacherId: '2',
    subjectId: '2',
    dayOfWeek: 'Thứ 5',
    startTime: '08:00',
    endTime: '10:00',
    room: 'B203',
    status: 'scheduled'
  },
  {
    id: '7',
    teacherId: '3',
    subjectId: '5',
    dayOfWeek: 'Thứ 2',
    startTime: '15:00',
    endTime: '17:00',
    room: 'C301',
    status: 'in-progress'
  },
  {
    id: '8',
    teacherId: '3',
    subjectId: '6',
    dayOfWeek: 'Thứ 3',
    startTime: '13:00',
    endTime: '15:00',
    room: 'C302',
    status: 'scheduled'
  },
  {
    id: '9',
    teacherId: '3',
    subjectId: '6',
    dayOfWeek: 'Thứ 6',
    startTime: '08:00',
    endTime: '10:00',
    room: 'C303',
    status: 'scheduled'
  },
  {
    id: '10',
    teacherId: '4',
    subjectId: '7',
    dayOfWeek: 'Thứ 2',
    startTime: '08:00',
    endTime: '10:00',
    room: 'D401',
    status: 'cancelled'
  },
  {
    id: '11',
    teacherId: '4',
    subjectId: '8',
    dayOfWeek: 'Thứ 4',
    startTime: '13:00',
    endTime: '15:00',
    room: 'D402',
    status: 'cancelled'
  },
  {
    id: '12',
    teacherId: '5',
    subjectId: '9',
    dayOfWeek: 'Thứ 3',
    startTime: '08:00',
    endTime: '10:00',
    room: 'E501',
    status: 'scheduled'
  },
  {
    id: '13',
    teacherId: '5',
    subjectId: '10',
    dayOfWeek: 'Thứ 5',
    startTime: '13:00',
    endTime: '16:00',
    room: 'E502',
    status: 'scheduled'
  },
  {
    id: '14',
    teacherId: '5',
    subjectId: '9',
    dayOfWeek: 'Thứ 6',
    startTime: '08:00',
    endTime: '10:00',
    room: 'E503',
    status: 'in-progress'
  },
  {
    id: '15',
    teacherId: '6',
    subjectId: '11',
    dayOfWeek: 'Thứ 2',
    startTime: '07:30',
    endTime: '09:30',
    room: 'F601',
    status: 'cancelled'
  },
  {
    id: '16',
    teacherId: '6',
    subjectId: '12',
    dayOfWeek: 'Thứ 4',
    startTime: '13:30',
    endTime: '16:30',
    room: 'F602',
    status: 'cancelled'
  }
];