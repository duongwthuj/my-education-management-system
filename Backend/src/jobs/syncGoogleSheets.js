import { getOffsetClassesFromSheet, updateOffsetStatus } from '../services/googleSheetsService.js';
import OffsetClass from '../models/offsetClass.js';
import SubjectLevel from '../models/subjectLevel.js';
import Subject from '../models/subject.js';
import Notification from '../models/notification.js';

// Background job để tự động sync và import offset từ Google Sheet
export const syncAndImportOffsetClasses = async () => {
    try {
        console.log('🔄 [Sync Job] Starting automatic sync from Google Sheet...');
        
        const sheetData = await getOffsetClassesFromSheet();
        console.log(`📊 [Sync Job] Found ${sheetData.length} items in Google Sheet`);
        
        let importedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        for (const item of sheetData) {
            try {
                const { subjectCode, ma_lop, cac_buoi, link_offset } = item.data || {};
                
                if (!cac_buoi || cac_buoi.length === 0) {
                    console.log(`⚠️ [Sync Job] No sessions found for ${ma_lop}`);
                    errorCount++;
                    continue;
                }
                
                console.log(`🔄 [Sync Job] Processing ${ma_lop} - Subject: ${subjectCode} - ${cac_buoi.length} sessions`);
                console.log(`   📧 Sender: ${item.sender} - Sent: ${item.sentTime}`);
                
                // ✅ EXTRACT EMAIL TỪ SENDER (loại bỏ tên)
                const emailMatch = item.sender.match(/<([^>]+)>/);
                const senderEmail = emailMatch ? emailMatch[1] : item.sender;
                
                // ✅ CHECK EMAIL ĐÃ ĐƯỢC IMPORT CHƯA (mỗi email = 1 học sinh)
                // Check bằng email + className + scheduled dates
                // Lấy tất cả scheduled dates từ cac_buoi
                const scheduledDates = cac_buoi.map(buoi => {
                    const [day, month, year] = buoi.ngay.split('/');
                    return new Date(year, month - 1, day);
                });
                
                // Check xem đã tồn tại offset classes với cùng email, className và bất kỳ scheduled date nào
                const existingClasses = await OffsetClass.find({
                    studentEmail: senderEmail,
                    className: ma_lop,
                    scheduledDate: { $in: scheduledDates }
                });
                
                if (existingClasses.length > 0) {
                    console.log(`⏩ [Sync Job] Email from ${senderEmail} already processed for ${ma_lop} on ${existingClasses.length} date(s), skipping...`);
                    skippedCount++;
                    continue;
                }
                
                // ✅ KIỂM TRA STATUS TRONG SHEET
                const canImport = !item.status?.includes('Imported') && !item.status?.includes('✅ Imported');
                
                if (!canImport && item.status !== '⏳ Đang xử lý') {
                    console.log(`⏩ [Sync Job] Skipping ${ma_lop} - Status: ${item.status}`);
                    skippedCount++;
                    continue;
                }

                
                // Tìm SubjectLevel
                let subjectLevel = await SubjectLevel.findOne({ 
                    name: subjectCode 
                }).populate('subjectId');
                
                // Thử parse nếu không tìm thấy trực tiếp
                if (!subjectLevel) {
                    const match = subjectCode.match(/([A-Z]+)[\s_]?HP(\d+)/i);
                    if (match) {
                        const subjectCodePart = match[1];
                        const semester = parseInt(match[2]);

                        const subject = await Subject.findOne({ 
                            code: new RegExp(`^${subjectCodePart}$`, 'i')
                        });

                        if (subject) {
                            subjectLevel = await SubjectLevel.findOne({
                                subjectId: subject._id,
                                semester: semester
                            }).populate('subjectId');
                        }
                    }
                }
                
                if (!subjectLevel) {
                    console.log(`❌ [Sync Job] Subject level not found for: ${subjectCode}`);
                    await updateOffsetStatus(item.sender, item.sentTime, `❌ Subject level not found: ${subjectCode}`);
                    errorCount++;
                    continue;
                }
                
                // Tạo offset classes CHỈ cho các buổi chưa tồn tại
                const createdClasses = [];
                for (const buoi of cac_buoi) {
                    const [day, month, year] = buoi.ngay.split('/');
                    const scheduledDate = new Date(year, month - 1, day);

                    const offsetClass = await OffsetClass.create({
                        subjectLevelId: subjectLevel._id,
                        className: ma_lop,
                        scheduledDate,
                        startTime: buoi.gio_bat_dau,
                        endTime: buoi.gio_ket_thuc,
                        meetingLink: link_offset || '',
                        notes: buoi.noi_dung || '',
                        status: 'pending',
                        studentEmail: senderEmail,        // ← LƯU CHỈ EMAIL (không có tên)
                        emailSentTime: item.sentTime      // ← LƯU THỜI GIAN GỬI
                    });

                    createdClasses.push(offsetClass);
                }
                
                // 🔔 TẠO NOTIFICATION CHO LỚP MỚI
                if (createdClasses.length > 0) {
                    await Notification.create({
                        type: 'new_offset_class',
                        title: `Lớp offset mới: ${ma_lop}`,
                        message: `${createdClasses.length} buổi học ${subjectLevel.subjectId?.name || subjectCode} cần được phân công giáo viên`,
                        relatedId: createdClasses[0]._id,
                        priority: 'high'
                    });
                    console.log(`🔔 [Sync Job] Created notification for ${ma_lop}`);
                }
                
                // Update status trong sheet
                await updateOffsetStatus(item.sender, item.sentTime, `✅ Imported ${createdClasses.length} classes`);
                
                importedCount += createdClasses.length;
                console.log(`✅ [Sync Job] Imported ${createdClasses.length} classes for ${ma_lop}`);
                
            } catch (error) {
                console.error(`❌ [Sync Job] Error importing ${item.data?.ma_lop}:`, error.message);
                await updateOffsetStatus(item.sender, item.sentTime, `❌ Error: ${error.message}`);
                errorCount++;
            }
        }
        
        console.log(`✨ [Sync Job] Complete - Imported: ${importedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
        
        return {
            success: true,
            imported: importedCount,
            skipped: skippedCount,
            errors: errorCount
        };
        
    } catch (error) {
        console.error('❌ [Sync Job] Fatal error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Chạy sync job mỗi 30 giây
export const startSyncJob = () => {
    console.log('🚀 [Sync Job] Starting automatic sync job (every 30 seconds)...');
    
    // Chạy ngay lập tức
    syncAndImportOffsetClasses();
    
    // Chạy mỗi 15 phút (900000ms)
    setInterval(() => {
        syncAndImportOffsetClasses();
    }, 900000); // 15 minutes
};
