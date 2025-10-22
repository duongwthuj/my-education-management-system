import dotenv from 'dotenv';
import connectDB from '../config/database';
import { Teacher, Subject, Class, Schedule } from '../models';

dotenv.config();

// Sample data - Copy từ Frontend
const teachersData = [
  {
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0901234567',
    avatar: 'https://i.pravatar.cc/150?img=1',
    address: 'Hà Nội, Việt Nam',
    joinDate: '2023-01-15',
    status: 'active',
    education: 'Thạc sĩ Công nghệ Thông tin',
    bio: 'Giáo viên giàu kinh nghiệm trong lập trình web',
  },
  {
    name: 'Trần Thị B',
    email: 'tranthib@example.com',
    phone: '0912345678',
    avatar: 'https://i.pravatar.cc/150?img=2',
    address: 'TP. Hồ Chí Minh, Việt Nam',
    joinDate: '2023-02-20',
    status: 'active',
    education: 'Cử nhân Khoa học Máy tính',
    bio: 'Chuyên gia về lập trình game',
  },
  {
    name: 'Lê Văn C',
    email: 'levanc@example.com',
    phone: '0923456789',
    avatar: 'https://i.pravatar.cc/150?img=3',
    address: 'Đà Nẵng, Việt Nam',
    joinDate: '2023-03-10',
    status: 'active',
    education: 'Thạc sĩ Giáo dục',
    bio: 'Giáo viên dạy lập trình cho trẻ em',
  },
  {
    name: 'Phạm Thị D',
    email: 'phamthid@example.com',
    phone: '0934567890',
    avatar: 'https://i.pravatar.cc/150?img=4',
    address: 'Cần Thơ, Việt Nam',
    joinDate: '2023-04-05',
    status: 'active',
    education: 'Cử nhân Công nghệ Phần mềm',
    bio: 'Lập trình viên chuyên nghiệp',
  },
  {
    name: 'Hoàng Văn E',
    email: 'hoangvane@example.com',
    phone: '0945678901',
    avatar: 'https://i.pravatar.cc/150?img=5',
    address: 'Hải Phòng, Việt Nam',
    joinDate: '2023-05-12',
    status: 'active',
    education: 'Thạc sĩ Thiết kế Đồ họa',
    bio: 'Chuyên gia thiết kế số',
  },
  {
    name: 'Vũ Thị F',
    email: 'vuthif@example.com',
    phone: '0956789012',
    avatar: 'https://i.pravatar.cc/150?img=6',
    address: 'Nha Trang, Việt Nam',
    joinDate: '2023-06-18',
    status: 'active',
    education: 'Cử nhân Mỹ thuật Đa phương tiện',
    bio: 'Giảng viên thiết kế số và UI/UX',
  },
];

const subjectsData = [
  // Web Programming
  { name: 'Siêu nhân lập trình web - Học phần 1', code: 'WEB101', description: 'Khóa học về lập trình web cơ bản - HTML, CSS.', category: 'Lập trình Web', level: 'beginner' },
  { name: 'Siêu nhân lập trình web - Học phần 2', code: 'WEB102', description: 'Khóa học về CSS nâng cao và bố cục responsive.', category: 'Lập trình Web', level: 'beginner' },
  { name: 'Siêu nhân lập trình web - Học phần 3', code: 'WEB103', description: 'Giới thiệu về JavaScript cơ bản.', category: 'Lập trình Web', level: 'intermediate' },
  { name: 'Siêu nhân lập trình web - Học phần 4', code: 'WEB104', description: 'Xây dựng trang web tương tác với DOM.', category: 'Lập trình Web', level: 'intermediate' },
  { name: 'Siêu nhân lập trình web - Học phần 5', code: 'WEB105', description: 'Giới thiệu ReactJS và component cơ bản.', category: 'Lập trình Web', level: 'intermediate' },

  // Game Programming
  { name: 'Siêu nhân lập trình game - Học phần 1', code: 'GAME101', description: 'Làm quen tư duy lập trình game.', category: 'Lập trình Game', level: 'beginner' },
  { name: 'Siêu nhân lập trình game - Học phần 2', code: 'GAME102', description: 'Thiết kế nhân vật và môi trường game.', category: 'Lập trình Game', level: 'beginner' },
  { name: 'Siêu nhân lập trình game - Học phần 3', code: 'GAME103', description: 'Giới thiệu Pygame và hoạt cảnh cơ bản.', category: 'Lập trình Game', level: 'beginner' },

  // Kids Game
  { name: 'Bé làm game - Học phần 1', code: 'KIDGAME101', description: 'Làm quen với Scratch và lập trình khối.', category: 'Lập trình Game', level: 'beginner' },
  { name: 'Bé làm game - Học phần 2', code: 'KIDGAME102', description: 'Tạo nhân vật hoạt hình đơn giản.', category: 'Lập trình Game', level: 'beginner' },

  // Design
  { name: 'Digistyle 2025 - Học phần 1', code: 'DIGI25_101', description: 'Khởi đầu với thiết kế đồ họa cơ bản.', category: 'Thiết kế số', level: 'beginner' },
  { name: 'Digistyle 2025 - Học phần 2', code: 'DIGI25_102', description: 'Làm quen với Photoshop cơ bản.', category: 'Thiết kế số', level: 'beginner' },
];

const seed = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to database
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      Teacher.deleteMany({}),
      Subject.deleteMany({}),
      Class.deleteMany({}),
      Schedule.deleteMany({}),
    ]);
    console.log('✅ Existing data cleared\n');

    // Seed Teachers
    console.log('👨‍🏫 Seeding teachers...');
    const teachers = await Teacher.insertMany(teachersData);
    console.log(`✅ ${teachers.length} teachers created\n`);

    // Seed Subjects (liên kết với teachers)
    console.log('📚 Seeding subjects...');
    const subjectsWithTeachers = subjectsData.map((subject, index) => ({
      ...subject,
      teachers: [teachers[index % teachers.length]._id],
    }));
    const subjects = await Subject.insertMany(subjectsWithTeachers);
    console.log(`✅ ${subjects.length} subjects created\n`);

    // Update teachers' subjects
    console.log('🔗 Linking teachers to subjects...');
    for (let i = 0; i < teachers.length; i++) {
      const teacherSubjects = subjects
        .filter((_s, index) => index % teachers.length === i)
        .map(s => s._id);
      await Teacher.findByIdAndUpdate(teachers[i]._id, { subjects: teacherSubjects });
    }
    console.log('✅ Teachers linked to subjects\n');

    // Seed Classes
    console.log('🏫 Seeding classes...');
    const classesData = [
      {
        name: 'Lớp Web cơ bản K01',
        subjectId: subjects[0]._id,
        startDate: '2025-01-15',
        endDate: '2025-03-15',
        studentsCount: 15,
        status: 'active',
        teacherId: teachers[0]._id,
        description: 'Lớp học lập trình web cơ bản cho người mới bắt đầu',
        location: 'Phòng A101',
      },
      {
        name: 'Lớp Game Python K02',
        subjectId: subjects[5]._id,
        startDate: '2025-02-01',
        endDate: '2025-04-01',
        studentsCount: 12,
        status: 'active',
        teacherId: teachers[1]._id,
        description: 'Lớp học lập trình game với Python',
        location: 'Phòng B201',
      },
      {
        name: 'Lớp Thiết kế K03',
        subjectId: subjects[10]._id,
        startDate: '2025-03-01',
        endDate: '2025-05-01',
        studentsCount: 10,
        status: 'pending',
        teacherId: teachers[4]._id,
        description: 'Lớp học thiết kế đồ họa cơ bản',
        location: 'Phòng C301',
      },
    ];
    const classes = await Class.insertMany(classesData);
    console.log(`✅ ${classes.length} classes created\n`);

    // Seed Schedules
    console.log('📅 Seeding schedules...');
    const schedulesData = [
      // Teacher 0 - Nguyễn Văn A (3 schedules)
      {
        teacherId: teachers[0]._id,
        subjectId: subjects[0]._id,
        dayOfWeek: 'Thứ 2',
        startTime: '08:00',
        endTime: '10:00',
        room: 'A101',
        status: 'scheduled',
      },
      {
        teacherId: teachers[0]._id,
        subjectId: subjects[2]._id,
        dayOfWeek: 'Thứ 2',
        startTime: '13:00',
        endTime: '15:00',
        room: 'A102',
        status: 'scheduled',
      },
      {
        teacherId: teachers[0]._id,
        subjectId: subjects[1]._id,
        dayOfWeek: 'Thứ 5',
        startTime: '09:00',
        endTime: '11:00',
        room: 'A103',
        status: 'scheduled',
      },
      // Teacher 1 - Trần Thị B (3 schedules)
      {
        teacherId: teachers[1]._id,
        subjectId: subjects[5]._id,
        dayOfWeek: 'Thứ 4',
        startTime: '07:30',
        endTime: '09:30',
        room: 'B201',
        status: 'scheduled',
      },
      {
        teacherId: teachers[1]._id,
        subjectId: subjects[3]._id,
        dayOfWeek: 'Thứ 3',
        startTime: '14:00',
        endTime: '16:00',
        room: 'B202',
        status: 'scheduled',
      },
      {
        teacherId: teachers[1]._id,
        subjectId: subjects[4]._id,
        dayOfWeek: 'Thứ 6',
        startTime: '10:00',
        endTime: '12:00',
        room: 'B203',
        status: 'scheduled',
      },
      // Teacher 2 - Lê Văn C (3 schedules)
      {
        teacherId: teachers[2]._id,
        subjectId: subjects[6]._id,
        dayOfWeek: 'Thứ 2',
        startTime: '09:00',
        endTime: '11:00',
        room: 'C101',
        status: 'scheduled',
      },
      {
        teacherId: teachers[2]._id,
        subjectId: subjects[7]._id,
        dayOfWeek: 'Thứ 4',
        startTime: '13:00',
        endTime: '15:00',
        room: 'C102',
        status: 'scheduled',
      },
      {
        teacherId: teachers[2]._id,
        subjectId: subjects[8]._id,
        dayOfWeek: 'Thứ 6',
        startTime: '08:00',
        endTime: '10:00',
        room: 'C103',
        status: 'scheduled',
      },
      // Teacher 3 - Phạm Thị D (3 schedules)
      {
        teacherId: teachers[3]._id,
        subjectId: subjects[9]._id,
        dayOfWeek: 'Thứ 3',
        startTime: '10:00',
        endTime: '12:00',
        room: 'D101',
        status: 'scheduled',
      },
      {
        teacherId: teachers[3]._id,
        subjectId: subjects[0]._id,
        dayOfWeek: 'Thứ 5',
        startTime: '14:00',
        endTime: '16:00',
        room: 'D102',
        status: 'scheduled',
      },
      {
        teacherId: teachers[3]._id,
        subjectId: subjects[1]._id,
        dayOfWeek: 'Thứ 2',
        startTime: '15:00',
        endTime: '17:00',
        room: 'D103',
        status: 'scheduled',
      },
      // Teacher 4 - Hoàng Văn E (3 schedules)
      {
        teacherId: teachers[4]._id,
        subjectId: subjects[10]._id,
        dayOfWeek: 'Thứ 3',
        startTime: '08:00',
        endTime: '10:00',
        room: 'C301',
        status: 'scheduled',
      },
      {
        teacherId: teachers[4]._id,
        subjectId: subjects[11]._id,
        dayOfWeek: 'Thứ 5',
        startTime: '11:00',
        endTime: '13:00',
        room: 'C302',
        status: 'scheduled',
      },
      {
        teacherId: teachers[4]._id,
        subjectId: subjects[2]._id,
        dayOfWeek: 'Thứ 6',
        startTime: '13:00',
        endTime: '15:00',
        room: 'C303',
        status: 'scheduled',
      },
      // Teacher 5 - Trần Văn F (3 schedules)
      {
        teacherId: teachers[5]._id,
        subjectId: subjects[3]._id,
        dayOfWeek: 'Thứ 2',
        startTime: '10:00',
        endTime: '12:00',
        room: 'E101',
        status: 'scheduled',
      },
      {
        teacherId: teachers[5]._id,
        subjectId: subjects[5]._id,
        dayOfWeek: 'Thứ 4',
        startTime: '15:00',
        endTime: '17:00',
        room: 'E102',
        status: 'scheduled',
      },
      {
        teacherId: teachers[5]._id,
        subjectId: subjects[6]._id,
        dayOfWeek: 'Thứ 6',
        startTime: '09:00',
        endTime: '11:00',
        room: 'E103',
        status: 'scheduled',
      },
    ];
    const schedules = await Schedule.insertMany(schedulesData);
    console.log(`✅ ${schedules.length} schedules created\n`);

    // Summary
    console.log('✅ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Teachers: ${teachers.length}`);
    console.log(`   - Subjects: ${subjects.length}`);
    console.log(`   - Classes: ${classes.length}`);
    console.log(`   - Schedules: ${schedules.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seed();
