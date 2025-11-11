import Shift from '../models/shift.js';
import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

const defaultShifts = [
    {
        name: 'Ca sáng',
        startTime: '08:00',
        endTime: '12:00',
        description: 'Ca làm việc buổi sáng',
        isActive: true
    },
    {
        name: 'Ca chiều',
        startTime: '13:00',
        endTime: '17:00',
        description: 'Ca làm việc buổi chiều',
        isActive: true
    },
    {
        name: 'Ca tối',
        startTime: '19:00',
        endTime: '21:00',
        description: 'Ca làm việc buổi tối',
        isActive: true
    }
];

const seedShifts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Xóa tất cả shifts cũ (nếu muốn reset)
        await Shift.deleteMany({});
        console.log('Cleared existing shifts');

        // Thêm shifts mặc định
        await Shift.insertMany(defaultShifts);
        console.log('✅ Successfully seeded default shifts');

        // Hiển thị danh sách
        const shifts = await Shift.find({});
        console.log('\n📋 Default Shifts:');
        shifts.forEach(shift => {
            console.log(`  - ${shift.name}: ${shift.startTime} - ${shift.endTime}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding shifts:', error);
        process.exit(1);
    }
};

seedShifts();
