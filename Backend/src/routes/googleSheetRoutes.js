import express from 'express';
import { syncFromGoogleSheet, importOffsetFromSheet } from '../controllers/googleSheetController.js';

const router = express.Router();

// GET /api/google-sheets/sync - Đọc dữ liệu từ Google Sheet
router.get('/sync', syncFromGoogleSheet);

// POST /api/google-sheets/import - Import offset class từ Sheet vào DB
router.post('/import', importOffsetFromSheet);

export default router;
