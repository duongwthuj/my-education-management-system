import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/user.js';
import Teacher from '../src/models/teacher.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const createDefaultAccounts = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all active teachers
        const teachers = await Teacher.find({ status: 'active' });
        console.log(`Found ${teachers.length} active teachers`);

        let createdCount = 0;
        let skippedCount = 0;

        for (const teacher of teachers) {
            if (!teacher.email) {
                console.log(`Skipping teacher ${teacher.name} (no email)`);
                skippedCount++;
                continue;
            }

            // Check if user already exists (by email or teacherId)
            const existingUser = await User.findOne({
                $or: [
                    { username: teacher.email },
                    { teacherId: teacher._id }
                ]
            });

            if (existingUser) {
                console.log(`Account already exists for ${teacher.name} (${teacher.email})`);
                skippedCount++;
                continue;
            }

            // Create new user
            const newUser = new User({
                username: teacher.email,
                name: teacher.name,
                password: 'teky123', // Will be hashed by pre-save hook
                role: 'user', // Default role for ordinary teachers
                teacherId: teacher._id
            });

            await newUser.save();
            console.log(`Created account for ${teacher.name} (${teacher.email})`);
            createdCount++;
        }

        console.log('\n--- Summary ---');
        console.log(`Total Teachers: ${teachers.length}`);
        console.log(`Created: ${createdCount}`);
        console.log(`Skipped: ${skippedCount}`);

    } catch (error) {
        console.error('Error creating default accounts:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
};

createDefaultAccounts();
