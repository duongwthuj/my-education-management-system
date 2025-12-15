import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

// Import models để đảm bảo schemas được register
import './models/user.js';
import './models/teacher.js';
import './models/shift.js';
import './models/workShift.js';
import './models/subject.js';
import './models/subjectLevel.js';
import './models/teacherLevel.js';
import './models/offsetClass.js';
import './models/fixedScheduled.js';
import './models/fixedScheduleLeave.js';
import './models/notification.js';
import './models/supplementaryClass.js';
import './models/testClass.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/health.js';
import teacherRoutes from './routes/teacherRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import shiftRoutes from './routes/shiftRoutes.js';
import offsetClassRoutes from './routes/offsetClassRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import fixedScheduleLeaveRoutes from './routes/fixedScheduleLeaveRoutes.js';
import googleSheetRoutes from './routes/googleSheetRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import supplementaryClassRoutes from './routes/supplementaryClassRoutes.js';
import testClassRoutes from './routes/testClassRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/schedule', shiftRoutes);
app.use('/api/offset-classes', offsetClassRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/fixed-schedule-leaves', fixedScheduleLeaveRoutes);
app.use('/api/google-sheets', googleSheetRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/supplementary-classes', supplementaryClassRoutes);
app.use('/api/test-classes', testClassRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;