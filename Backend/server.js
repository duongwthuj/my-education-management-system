import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import app from './src/app.js';
import { connectDB } from './src/config/database.js';
import { startSyncJob } from './src/jobs/syncGoogleSheets.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
connectDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);

        // Start background sync job
        startSyncJob();
    });
}).catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
});