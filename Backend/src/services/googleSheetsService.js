import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đường dẫn đến file credentials
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../../google-credentials.json');

// Configure Google Sheets API
const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

let sheets = null;

// Initialize sheets client
const initSheetsClient = async () => {
    if (!sheets) {
        const authClient = await auth.getClient();
        sheets = google.sheets({ version: 'v4', auth: authClient });
        console.log('✅ Google Sheets API initialized');
    }
    return sheets;
};

/**
 * Đọc các offset classes từ sheet và parse JSON
 */
export const getOffsetClassesFromSheet = async () => {
    try {
        const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
        
        console.log('🔍 Checking GOOGLE_SHEET_ID:', SPREADSHEET_ID);
        
        const sheetsClient = await initSheetsClient();
        
        if (!SPREADSHEET_ID) {
            throw new Error('GOOGLE_SHEET_ID not configured in .env');
        }

        const response = await sheetsClient.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'OffsetAI!A2:D', // Bỏ qua header row
        });

        const rows = response.data.values || [];
        
        const offsetClasses = rows
            .filter(row => row[2] && row[2].startsWith('{')) // Có JSON data
            .map(row => {
                try {
                    const jsonData = JSON.parse(row[2]);
                    return {
                        sender: row[0],
                        sentTime: new Date(row[1]),
                        data: jsonData,
                        status: row[3] || 'pending'
                    };
                } catch (err) {
                    console.error('Error parsing JSON from row:', err.message);
                    return null;
                }
            })
            .filter(item => item !== null);

        console.log(`📊 Parsed ${offsetClasses.length} offset classes from sheet`);
        return offsetClasses;
    } catch (error) {
        console.error('Error getting offset classes from sheet:', error.message);
        throw error;
    }
};

/**
 * Update giáo viên đã dạy vào Google Sheet
 * @param {String} className - Mã lớp
 * @param {Date} scheduledDate - Ngày học
 * @param {String} teacherName - Tên giáo viên
 */
export const updateTeacherToSheet = async (className, scheduledDate, teacherName) => {
    try {
        const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
        const sheetsClient = await initSheetsClient();
        
        // Đọc tất cả dữ liệu từ sheet (bao gồm cột E - Giáo viên)
        const response = await sheetsClient.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'OffsetAI!A2:E',
        });

        const rows = response.data.values || [];
        
        // Tìm row khớp với className và scheduledDate
        const targetDate = new Date(scheduledDate).toISOString().split('T')[0];
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const jsonData = row[2]; // Cột C chứa JSON
            
            if (!jsonData || !jsonData.startsWith('{')) continue;
            
            try {
                const data = JSON.parse(jsonData);
                const maLop = data.ma_lop;
                const cacBuoi = data.cac_buoi || [];
                
                // Kiểm tra xem có buổi nào khớp với scheduledDate không
                const hasMatchingSession = cacBuoi.some(buoi => {
                    const [day, month, year] = buoi.ngay.split('/');
                    const buoiDate = new Date(year, month - 1, day).toISOString().split('T')[0];
                    return buoiDate === targetDate;
                });
                
                if (maLop === className && hasMatchingSession) {
                    const actualRowNumber = i + 2; // +2 vì header và zero-based
                    const currentTeachers = row[4] || ''; // Cột E - Giáo viên
                    
                    // Thêm giáo viên mới vào danh sách (nếu chưa có)
                    let teachersList = currentTeachers
                        .split(',')
                        .map(t => t.trim())
                        .filter(t => t.length > 0);
                    
                    if (!teachersList.includes(teacherName)) {
                        teachersList.push(teacherName);
                    }
                    
                    const updatedTeachers = teachersList.join(', ');
                    const range = `OffsetAI!E${actualRowNumber}`;
                    
                    await sheetsClient.spreadsheets.values.update({
                        spreadsheetId: SPREADSHEET_ID,
                        range: range,
                        valueInputOption: 'RAW',
                        resource: {
                            values: [[updatedTeachers]],
                        },
                    });
                    
                    console.log(`✅ Updated teacher "${teacherName}" to row ${actualRowNumber} for class ${className}`);
                    return { success: true, rowNumber: actualRowNumber, teachers: updatedTeachers };
                }
            } catch (parseError) {
                console.error(`Error parsing JSON at row ${i + 2}:`, parseError.message);
                continue;
            }
        }
        
        console.log(`⚠️ No matching row found for class ${className} on ${targetDate}`);
        return { success: false, message: 'No matching row found' };
        
    } catch (error) {
        console.error('Error updating teacher to sheet:', error.message);
        throw error;
    }
};

/**
 * Update trạng thái trong sheet (tìm row theo sender + sentTime)
 */
export const updateOffsetStatus = async (sender, sentTime, newStatus) => {
    try {
        const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
        const sheetsClient = await initSheetsClient();
        
        const response = await sheetsClient.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'OffsetAI!A2:D',
        });

        const rows = response.data.values || [];
        
        // Tìm row index (thêm 2 vì: 1 cho header, 1 cho zero-based -> 1-based)
        const rowIndex = rows.findIndex(row => 
            row[0] === sender && 
            new Date(row[1]).getTime() === new Date(sentTime).getTime()
        );

        if (rowIndex === -1) {
            throw new Error('Row not found in sheet');
        }

        const actualRowNumber = rowIndex + 2; // +2 vì header và zero-based
        const range = `OffsetAI!D${actualRowNumber}`;
        
        await sheetsClient.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
            valueInputOption: 'RAW',
            resource: {
                values: [[newStatus]],
            },
        });

        console.log(`✅ Updated status to "${newStatus}" at row ${actualRowNumber}`);
        
        return { success: true, rowNumber: actualRowNumber };
    } catch (error) {
        console.error('Error updating offset status:', error.message);
        throw error;
    }
};

/**
 * Fetch offset classes from Google Sheets (legacy function - kept for compatibility)
 * @param {string} spreadsheetId - The Google Sheets spreadsheet ID
 * @param {string} range - The range to read (e.g., 'Sheet1!A2:H')
 */
export const fetchOffsetClassesFromSheet = async (spreadsheetId, range = 'Sheet1!A2:Z') => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return { success: true, data: [], message: 'No data found in sheet' };
        }

        const offsetClasses = [];
        const errors = [];

        // Process each row
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            try {
                // Map columns to fields
                // Adjust column indices based on your sheet structure
                const offsetClass = {
                    className: row[0]?.trim(),           // Column A: Tên lớp
                    subjectId: row[1]?.trim(),           // Column B: Mã môn học
                    subjectLevelId: row[2]?.trim(),      // Column C: Mã học phần
                    originalDate: parseDate(row[3]),     // Column D: Ngày gốc
                    originalTime: row[4]?.trim(),        // Column E: Giờ gốc
                    offsetDate: parseDate(row[5]),       // Column F: Ngày bù
                    offsetTime: row[6]?.trim(),          // Column G: Giờ bù
                    teacherId: row[7]?.trim(),           // Column H: Mã giáo viên
                    reason: row[8]?.trim() || '',        // Column I: Lý do
                    notes: row[9]?.trim() || '',         // Column J: Ghi chú
                    status: row[10]?.trim() || 'pending' // Column K: Trạng thái
                };

                // Validate required fields
                if (!offsetClass.className || !offsetClass.originalDate || !offsetClass.offsetDate) {
                    errors.push({
                        row: i + 2, // +2 because row 1 is header, and i starts from 0
                        error: 'Missing required fields: className, originalDate, or offsetDate'
                    });
                    continue;
                }

                offsetClasses.push(offsetClass);
            } catch (error) {
                errors.push({
                    row: i + 2,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            data: offsetClasses,
            total: offsetClasses.length,
            errors: errors.length > 0 ? errors : undefined
        };
    } catch (error) {
        console.error('Error fetching from Google Sheets:', error);
        throw new Error(`Failed to fetch from Google Sheets: ${error.message}`);
    }
};

/**
 * Sync offset classes from Google Sheets to database
 * @param {string} spreadsheetId - The Google Sheets spreadsheet ID
 * @param {string} range - The range to read
 * @param {boolean} overwrite - Whether to overwrite existing data
 */
export const syncOffsetClassesFromSheet = async (spreadsheetId, range = 'Sheet1!A2:Z', overwrite = false) => {
    try {
        // Fetch data from sheet
        const sheetData = await fetchOffsetClassesFromSheet(spreadsheetId, range);
        
        if (!sheetData.success || sheetData.data.length === 0) {
            return {
                success: false,
                message: 'No data to sync',
                errors: sheetData.errors
            };
        }

        const results = {
            created: 0,
            updated: 0,
            skipped: 0,
            errors: []
        };

        // Process each offset class
        for (const offsetClassData of sheetData.data) {
            try {
                // Check if offset class already exists (by className and originalDate)
                const existing = await OffsetClass.findOne({
                    className: offsetClassData.className,
                    originalDate: offsetClassData.originalDate
                });

                if (existing) {
                    if (overwrite) {
                        // Update existing
                        await OffsetClass.findByIdAndUpdate(existing._id, offsetClassData);
                        results.updated++;
                    } else {
                        // Skip
                        results.skipped++;
                    }
                } else {
                    // Create new
                    await OffsetClass.create(offsetClassData);
                    results.created++;
                }
            } catch (error) {
                results.errors.push({
                    className: offsetClassData.className,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            message: 'Sync completed',
            results,
            sheetErrors: sheetData.errors
        };
    } catch (error) {
        console.error('Error syncing from Google Sheets:', error);
        throw error;
    }
};

/**
 * Parse date string from various formats
 * @param {string} dateStr - Date string
 * @returns {Date} Parsed date
 */
function parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Try common formats
    // Format: DD/MM/YYYY
    if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        return new Date(year, month - 1, day);
    }
    
    // Format: YYYY-MM-DD
    if (dateStr.includes('-')) {
        return new Date(dateStr);
    }
    
    // Try direct parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date;
    }
    
    return null;
}

export default {
    getOffsetClassesFromSheet,
    updateOffsetStatus,
    updateTeacherToSheet,
    fetchOffsetClassesFromSheet,
    syncOffsetClassesFromSheet
};
