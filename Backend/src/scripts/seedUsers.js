import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import User from '../models/user.js';
import mongoose from 'mongoose';

dotenv.config();

const users = [
    {
        username: 'admin',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin'
    },
    {
        username: 'st',
        password: 'st123',
        name: 'ST User',
        role: 'st'
    },
    {
        username: 'user',
        password: 'user123',
        name: 'Normal User',
        role: 'user'
    }
];

const seedUsers = async () => {
    try {
        await connectDB();

        // Clear existing users
        await User.deleteMany();
        console.log('Cleared existing users');

        // Create new users
        for (const user of users) {
            await User.create(user);
            console.log(`Created user: ${user.username} (${user.role})`);
        }

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
