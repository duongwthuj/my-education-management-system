import { getOffsetClassesFromSheet, updateOffsetStatus } from '../services/googleSheetsService.js';
import OffsetClass from '../models/offsetClass.js';
import SubjectLevel from '../models/subjectLevel.js';
import Subject from '../models/subject.js';

// GET: Đọc offset classes từ Google Sheet
export const syncFromGoogleSheet = async (req, res) => {
    try {
        console.log('📊 Starting sync from Google Sheet...');
        
        const offsetClasses = await getOffsetClassesFromSheet();
        
        res.status(200).json({
            success: true,
            message: `Found ${offsetClasses.length} offset classes in sheet`,
            data: offsetClasses
        });
    } catch (error) {
        console.error('Error syncing from Google Sheet:', error);
        res.status(500).json({
            success: false,
            message: 'Error syncing from Google Sheet',
            error: error.message
        });
    }
};

// POST: Import offset class từ Sheet vào Database
export const importOffsetFromSheet = async (req, res) => {
    try {
        const { sender, sentTime } = req.body;
        
        if (!sender || !sentTime) {
            return res.status(400).json({
                success: false,
                message: 'sender and sentTime are required'
            });
        }

        // Lấy data từ sheet
        const offsetClasses = await getOffsetClassesFromSheet();
        
        // Tìm offset class matching với sender và sentTime
        const targetOffset = offsetClasses.find(oc => 
            oc.sender === sender && 
            new Date(oc.sentTime).getTime() === new Date(sentTime).getTime()
        );

        if (!targetOffset) {
            return res.status(404).json({
                success: false,
                message: 'Offset class not found in sheet'
            });
        }

        // Parse dữ liệu từ sheet
        const { subjectCode, ma_lop, cac_buoi, link_offset } = targetOffset.data;
        
        console.log('📝 Parsing offset data:', { subjectCode, ma_lop, sessions: cac_buoi?.length });
        
        if (!cac_buoi || cac_buoi.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No sessions found in offset data'
            });
        }

        // Tìm SubjectLevel từ subjectCode
        // Format có thể là: "BLG_HP5", "SNLTW_HP1", hoặc "Bé làm game HP5"
        let subjectLevel = null;

        // Thử 1: Tìm trực tiếp theo name (nếu format chính xác như "SNLTW_HP1")
        subjectLevel = await SubjectLevel.findOne({ 
            name: subjectCode 
        }).populate('subjectId');

        // Thử 2: Parse và tìm theo subject code + semester
        if (!subjectLevel) {
            let match = subjectCode.match(/([A-Z]+)[\s_]?HP(\d+)/i);
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

        // Thử 3: Tìm theo tên môn học trong subjectCode
        if (!subjectLevel) {
            const allSubjects = await Subject.find({});
            
            for (const s of allSubjects) {
                const normalizedName = s.name.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '');
                
                const normalizedCode = subjectCode.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '');

                if (normalizedCode.includes(normalizedName) || 
                    normalizedCode.includes(s.code.toLowerCase())) {
                    
                    const semesterMatch = subjectCode.match(/(?:HP|Level\s*)(\d+)/i);
                    if (semesterMatch) {
                        const semester = parseInt(semesterMatch[1]);
                        subjectLevel = await SubjectLevel.findOne({
                            subjectId: s._id,
                            semester: semester
                        }).populate('subjectId');
                        
                        if (subjectLevel) break;
                    }
                }
            }
        }

        if (!subjectLevel) {
            const allSubjectLevels = await SubjectLevel.find({}).populate('subjectId');
            const availableLevels = allSubjectLevels.map(sl => 
                `${sl.name} (${sl.subjectId?.name} - Học phần ${sl.semester})`
            ).join(', ');

            return res.status(404).json({
                success: false,
                message: `Subject level not found for: ${subjectCode}`,
                hint: `Available subject levels: ${availableLevels}`,
                suggestion: `Please use format like: SNLTW_HP1, BLG_HP5, etc.`
            });
        }

        console.log('✅ Found subject level:', subjectLevel.name, '-', subjectLevel.subjectId?.name);

        // Tạo offset classes cho từng buổi
        const createdClasses = [];
        
        for (const buoi of cac_buoi) {
            // Parse date từ format dd/MM/yyyy
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
                status: 'pending'
            });

            createdClasses.push(offsetClass);
        }

        // Update status trong sheet
        await updateOffsetStatus(sender, sentTime, `✅ Imported ${createdClasses.length} classes`);

        res.status(201).json({
            success: true,
            message: `Successfully imported ${createdClasses.length} offset classes`,
            data: createdClasses
        });

    } catch (error) {
        console.error('Error importing offset from sheet:', error);
        res.status(500).json({
            success: false,
            message: 'Error importing offset from sheet',
            error: error.message
        });
    }
};

export default {
    syncFromGoogleSheet,
    importOffsetFromSheet
};
