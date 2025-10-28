import dotenv from 'dotenv';
import connectDB from '../config/database';
import { WorkSchedule, TeachingSchedule, FreeSchedule, Teacher, Subject, Teach, Class } from '../models';

dotenv.config();

const seedSchedules = async () => {
  try {
    console.log('🌱 Starting schedules seeding...\n');

    // Connect to database
    await connectDB();

    // Clear existing schedule data
    console.log('🗑️  Clearing existing schedule data...');
    await Promise.all([
      WorkSchedule.deleteMany({}),
      TeachingSchedule.deleteMany({}),
      FreeSchedule.deleteMany({}),
      Teach.deleteMany({}),
    ]);
    console.log('✅ Existing schedule data cleared\n');

    // Fetch existing teachers and subjects
    const teachers = await Teacher.find().limit(5);
    const subjects = await Subject.find().limit(10);

    if (teachers.length === 0 || subjects.length === 0) {
      console.log('⚠️  No teachers or subjects found in database');
      console.log('Please seed teachers and subjects first');
      process.exit(1);
    }

    console.log(`📚 Found ${teachers.length} teachers and ${subjects.length} subjects\n`);

    // Fetch existing classes for session type teaches
    const classes = await Class.find().limit(10);

    // Seed Work Schedules
    console.log('⏰ Seeding work schedules...');
    const workSchedulesData: any[] = [];
    const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
    const shifts = ['Sáng', 'Chiều', 'Tối'];

    teachers.forEach((teacher, tIndex) => {
      daysOfWeek.forEach((day) => {
        shifts.forEach((shift) => {
          const startHour = shift === 'Sáng' ? 8 : shift === 'Chiều' ? 13 : 18;
          const startTime = `${String(startHour).padStart(2, '0')}:00`;
          const endTime = `${String(startHour + 4).padStart(2, '0')}:00`;

          workSchedulesData.push({
            teacherId: teacher._id,
            dayOfWeek: day,
            shift,
            startTime,
            endTime,
            duration: 4,
            status: 'scheduled',
            notes: `Ca làm việc ${shift}`,
          });
        });
      });
    });

    const workSchedules = await WorkSchedule.insertMany(workSchedulesData);
    console.log(`✅ ${workSchedules.length} work schedules created\n`);

    // Seed Teaches (Fixed and Session Class Assignments)
    console.log('📚 Seeding teaches (class assignments)...');
    const teachesData: any[] = [];
    const daysOfWeekForTeaches = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const fixedClassNames = ['Lớp 10A', 'Lớp 10B', 'Lớp 11A', 'Lớp 11B', 'Lớp 12A', 'Lớp 12B'];

    teachers.forEach((teacher, tIndex) => {
      // Create 2-3 fixed class assignments per teacher
      const numFixedClasses = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < numFixedClasses; i++) {
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const day = daysOfWeekForTeaches[Math.floor(Math.random() * daysOfWeekForTeaches.length)];
        const startHour = 8 + Math.floor(Math.random() * 8);
        const startTime = `${String(startHour).padStart(2, '0')}:00`;
        const endTime = `${String(startHour + 2).padStart(2, '0')}:00`;

        teachesData.push({
          teacherId: teacher._id,
          subjectId: subject._id,
          className: fixedClassNames[Math.floor(Math.random() * fixedClassNames.length)],
          classType: 'fixed',
          dayOfWeek: day,
          startTime,
          endTime,
          notes: `Giảng dạy ${subject.name} cho lớp cố định`,
        });
      }

      // Create 1-2 session class assignments per teacher
      if (classes.length > 0) {
        const numSessionClasses = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < numSessionClasses; i++) {
          const subject = subjects[Math.floor(Math.random() * subjects.length)];
          const sessionClass = classes[Math.floor(Math.random() * classes.length)];
          const day = daysOfWeekForTeaches[Math.floor(Math.random() * daysOfWeekForTeaches.length)];
          const startHour = 8 + Math.floor(Math.random() * 8);
          const startTime = `${String(startHour).padStart(2, '0')}:00`;
          const endTime = `${String(startHour + 1).padStart(2, '0')}:00`;

          teachesData.push({
            teacherId: teacher._id,
            subjectId: subject._id,
            sessionClassId: sessionClass._id,
            classType: 'session',
            dayOfWeek: day,
            startTime,
            endTime,
            notes: `Giảng dạy ${subject.name} cho lớp ngoài khóa`,
          });
        }
      }
    });

    const teaches = await Teach.insertMany(teachesData);
    console.log(`✅ ${teaches.length} teaches created\n`);
    console.log('📖 Seeding teaching schedules...');
    const teachingSchedulesData: any[] = [];

    workSchedules.forEach((ws, wsIndex) => {
      // Each work schedule gets 1-2 teaching assignments
      const numAssignments = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numAssignments; i++) {
        const teacher = teachers.find((t: any) => t._id.equals(ws.teacherId));
        const subject = subjects[Math.floor(Math.random() * subjects.length)];

        const startHour = parseInt(ws.startTime.split(':')[0]);
        const teachingStart = startHour + i * 2;
        const teachingEnd = teachingStart + 2;

        teachingSchedulesData.push({
          workScheduleId: ws._id,
          teacherId: ws.teacherId,
          subjectId: subject._id,
          classId: null,
          dayOfWeek: ws.dayOfWeek,
          startTime: `${String(teachingStart).padStart(2, '0')}:00`,
          endTime: `${String(teachingEnd).padStart(2, '0')}:00`,
          room: `Phòng ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 9) + 1}0${Math.floor(Math.random() * 5) + 1}`,
          status: 'scheduled',
          description: `Giảng dạy ${subject.name}`,
        });
      }
    });

    const teachingSchedules = await TeachingSchedule.insertMany(teachingSchedulesData);
    console.log(`✅ ${teachingSchedules.length} teaching schedules created\n`);

    // Seed Free Schedules
    console.log('☕ Seeding free schedules...');
    const freeSchedulesData: any[] = [];
    const reasons = ['break', 'lunch', 'other'];

    workSchedules.forEach((ws) => {
      // Add 1-2 free time slots per work schedule
      const numFree = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numFree; i++) {
        const startHour = parseInt(ws.startTime.split(':')[0]) + i * 2;
        if (startHour < parseInt(ws.endTime.split(':')[0])) {
          freeSchedulesData.push({
            workScheduleId: ws._id,
            teacherId: ws.teacherId,
            dayOfWeek: ws.dayOfWeek,
            startTime: `${String(startHour).padStart(2, '0')}:30`,
            endTime: `${String(startHour + 1).padStart(2, '0')}:00`,
            reason: reasons[Math.floor(Math.random() * reasons.length)],
            notes: i === 0 && parseInt(ws.startTime.split(':')[0]) === 12 ? 'Ăn trưa' : 'Giải lao',
          });
        }
      }
    });

    const freeSchedules = await FreeSchedule.insertMany(freeSchedulesData);
    console.log(`✅ ${freeSchedules.length} free schedules created\n`);

    // Summary
    console.log('✅ Schedules seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Work Schedules: ${workSchedules.length}`);
    console.log(`   - Teaches: ${teaches.length}`);
    console.log(`   - Teaching Schedules: ${teachingSchedules.length}`);
    console.log(`   - Free Schedules: ${freeSchedules.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding schedules:', error);
    process.exit(1);
  }
};

seedSchedules();
