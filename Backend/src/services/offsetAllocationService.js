import Teacher from '../models/teacher.js';
import TeacherLevel from '../models/teacherLevel.js';
import WorkShift from '../models/workShift.js';
import FixedSchedule from '../models/fixedScheduled.js';
import OffsetClass from '../models/offsetClass.js';

/**
 * Service để phân bổ lớp offset cho giáo viên
 * Ưu tiên: Lịch làm việc > Trình độ > Cân bằng số lớp
 */

class OffsetAllocationService {
    /**
     * Tìm giáo viên phù hợp cho lớp offset
     * @param {Object} offsetClass - Thông tin lớp offset
     * @returns {Object|null} - Giáo viên được chọn hoặc null
     */
    async findSuitableTeacher(offsetClass) {
        const { subjectLevelId, scheduledDate, startTime, endTime } = offsetClass;

        console.log('\n🔍 Finding suitable teacher for offset class:');
        console.log(`   📅 Date: ${scheduledDate}`);
        console.log(`   ⏰ Time: ${startTime} - ${endTime}`);
        console.log(`   📚 Subject Level: ${subjectLevelId}`);

        // Bước 1: Lấy danh sách giáo viên có trình độ phù hợp
        const teachersWithLevel = await TeacherLevel.find({
            subjectLevelId,
            isActive: true
        }).populate({
            path: 'teacherId',
            match: { status: 'active' }
        });

        console.log(`   👥 Found ${teachersWithLevel.length} teachers with required level`);

        if (teachersWithLevel.length === 0) {
            console.log('   ❌ No teachers with required level found');
            return null;
        }

        // Lọc giáo viên active
        const activeTeachers = teachersWithLevel
            .filter(tl => tl.teacherId)
            .map(tl => ({
                teacher: tl.teacherId,
                experienceYears: tl.experienceYears
            }));

        console.log(`   ✅ ${activeTeachers.length} active teachers after filtering`);

        if (activeTeachers.length === 0) {
            console.log('   ❌ No active teachers found');
            return null;
        }

        // Bước 2: Tính điểm cho từng giáo viên
        console.log('\n   📊 Calculating scores for each teacher:');
        const scoredTeachers = await Promise.all(
            activeTeachers.map(async ({ teacher, experienceYears }) => {
                console.log(`\n   👤 Evaluating teacher: ${teacher.name} (ID: ${teacher._id})`);
                const score = await this.calculateTeacherScore(
                    teacher,
                    scheduledDate,
                    startTime,
                    endTime,
                    experienceYears
                );
                console.log(`   💯 Final score for ${teacher.name}: ${score}`);
                return { teacher, score };
            })
        );

        // Bước 3: Chọn giáo viên có điểm cao nhất
        scoredTeachers.sort((a, b) => b.score - a.score);

        console.log('\n   🏆 Top 3 teachers:');
        scoredTeachers.slice(0, 3).forEach((st, index) => {
            console.log(`   ${index + 1}. ${st.teacher.name}: ${st.score} points`);
        });

        // Nếu giáo viên có điểm cao nhất có score <= 0, không có giáo viên phù hợp
        if (scoredTeachers[0].score <= 0) {
            console.log('   ❌ No suitable teacher found (all scores <= 0)');
            return null;
        }

        console.log(`   ✅ Selected teacher: ${scoredTeachers[0].teacher.name}\n`);
        return scoredTeachers[0].teacher;
    }

    /**
     * Tính điểm phù hợp của giáo viên cho lớp offset
     * @param {Object} teacher - Giáo viên
     * @param {Date} scheduledDate - Ngày dự kiến
     * @param {String} startTime - Giờ bắt đầu
     * @param {String} endTime - Giờ kết thúc
     * @param {Number} experienceYears - Số năm kinh nghiệm
     * @returns {Number} - Điểm tổng hợp
     */
    async calculateTeacherScore(teacher, scheduledDate, startTime, endTime, experienceYears) {
        // Ưu tiên 1: Lịch làm việc (trọng số cao nhất: 50%)
        // QUAN TRỌNG: Nếu không có lịch làm việc phù hợp → LOẠI BỎ ngay
        const scheduleScore = await this.calculateScheduleScore(
            teacher._id,
            scheduledDate,
            startTime,
            endTime
        );

        // NẾU KHÔNG CÓ LỊCH LÀM VIỆC PHÙ HỢP → RETURN 0 NGAY (KHÔNG TÍNH ĐIỂM KHÁC)
        if (scheduleScore === 0) {
            console.log(`   ❌ Schedule score = 0 → Total score = 0 (REJECTED)`);
            return 0;
        }

        let score = scheduleScore * 0.5;

        // Ưu tiên 2: Trình độ (trọng số: 30%)
        const levelScore = this.calculateLevelScore(experienceYears);
        score += levelScore * 0.3;

        // Ưu tiên 3: Cân bằng số lớp (trọng số: 20%)
        const balanceScore = await this.calculateBalanceScore(teacher);
        score += balanceScore * 0.2;

        console.log(`   📊 Breakdown: Schedule(${scheduleScore}×0.5) + Level(${levelScore}×0.3) + Balance(${balanceScore}×0.2) = ${score}`);

        return score;
    }

    /**
     * Tính điểm lịch làm việc
     * Kiểm tra giáo viên có rảnh không, có xung đột với lịch cố định không
     * @returns {Number} - Điểm từ 0-100
     */
    async calculateScheduleScore(teacherId, scheduledDate, startTime, endTime) {
        // CHUẨN HÓA NGÀY VỀ UTC ĐỂ TRÁNH LỆCH MÚI GIỜ
        const queryDate = new Date(scheduledDate);
        const startOfDay = new Date(Date.UTC(queryDate.getUTCFullYear(), queryDate.getUTCMonth(), queryDate.getUTCDate(), 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(queryDate.getUTCFullYear(), queryDate.getUTCMonth(), queryDate.getUTCDate(), 23, 59, 59, 999));

        console.log(`   🔍 Checking schedule for teacher ${teacherId} on ${queryDate.toISOString().split('T')[0]}`);

        // DEBUG LOG: In ra thông tin truy vấn workShifts
        console.log('DEBUG: Querying workShifts with:', {
            teacherId,
            scheduledDate,
            startOfDay,
            endOfDay
        });

        // Kiểm tra lịch làm việc (WorkShift) - QUAN TRỌNG NHẤT
        const workShifts = await WorkShift.find({
            teacherId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            isAvailable: true
        }).populate('shiftId');

        // DEBUG LOG: In ra kết quả tìm được
        console.log('DEBUG: workShifts found:', workShifts);

        console.log(`   📋 Found ${workShifts.length} work shifts for this day`);

        // BƯỚC 1: Nếu KHÔNG có ca làm việc trong ngày → LOẠI BỎ ngay
        if (!workShifts || workShifts.length === 0) {
            console.log(`   ❌ REJECTED: Teacher ${teacherId} has NO work shifts on this day`);
            return 0;
        }

        // BƯỚC 2: Kiểm tra xem có ca nào phù hợp với thời gian offset không
        let hasMatchingShift = false;
        let matchingShiftDetails = null;

        for (const ws of workShifts) {
            if (!ws.shiftId) {
                console.log(`   ⚠️ Warning: WorkShift ${ws._id} missing shiftId reference`);
                continue;
            }

            const shiftStart = ws.shiftId.startTime;
            const shiftEnd = ws.shiftId.endTime;
            
            // Offset class phải nằm HOÀN TOÀN trong ca làm việc
            const inRange = this.isTimeInRange(startTime, endTime, shiftStart, shiftEnd);
            
            console.log(`   🕐 Checking shift: ${shiftStart}-${shiftEnd} vs offset: ${startTime}-${endTime} → ${inRange ? 'MATCH ✅' : 'NO MATCH ❌'}`);
            
            if (inRange) {
                hasMatchingShift = true;
                matchingShiftDetails = `${shiftStart}-${shiftEnd}`;
                break;
            }
        }

        // Nếu KHÔNG có ca nào phù hợp với thời gian → LOẠI BỎ
        if (!hasMatchingShift) {
            console.log(`   ❌ REJECTED: No shift covers the required time ${startTime}-${endTime}`);
            return 0;
        }

        console.log(`   ✅ Found matching shift: ${matchingShiftDetails}`);

        console.log(`   ✅ Found matching shift: ${matchingShiftDetails}`);

        // BƯỚC 3: Kiểm tra xung đột với lịch cố định (FixedSchedule)
        const dayOfWeek = this.getDayOfWeek(queryDate);
        console.log(`   📅 Checking fixed schedules for ${dayOfWeek}...`);
        
        const fixedSchedules = await FixedSchedule.find({
            teacherId,
            dayOfWeek,
            isActive: true
        });

        console.log(`   📋 Found ${fixedSchedules.length} fixed schedules`);

        for (const fs of fixedSchedules) {
            const conflict = this.isTimeOverlap(startTime, endTime, fs.startTime, fs.endTime);
            if (conflict) {
                console.log(`   ❌ REJECTED: Fixed schedule conflict ${fs.startTime}-${fs.endTime}`);
                return 0;
            }
        }

        // BƯỚC 4: Kiểm tra xung đột với các lớp offset đã được phân công
        console.log(`   🔍 Checking existing offset classes...`);
        
        const existingOffsetClasses = await OffsetClass.find({
            assignedTeacherId: teacherId,
            scheduledDate: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            status: { $in: ['pending', 'assigned'] }
        });

        console.log(`   📋 Found ${existingOffsetClasses.length} existing offset classes`);

        for (const oc of existingOffsetClasses) {
            const conflict = this.isTimeOverlap(startTime, endTime, oc.startTime, oc.endTime);
            if (conflict) {
                console.log(`   ❌ REJECTED: Offset class conflict ${oc.startTime}-${oc.endTime} (${oc.className})`);
                return 0;
            }
        }

        // Nếu tất cả đều OK, trả về điểm tối đa
        console.log(`   ✅ AVAILABLE: No conflicts found, score = 100`);
        return 100;
    }

    /**
     * Tính điểm trình độ dựa trên số năm kinh nghiệm
     * @returns {Number} - Điểm từ 0-100
     */
    calculateLevelScore(experienceYears) {
        // Giáo viên có kinh nghiệm càng cao, điểm càng cao
        // Tối đa 10 năm = 100 điểm
        return Math.min(experienceYears * 10, 100);
    }

    /**
     * Tính điểm cân bằng số lớp
     * Giáo viên có ít lớp offset hơn sẽ được ưu tiên
     * @returns {Number} - Điểm từ 0-100
     */
    async calculateBalanceScore(teacher) {
        // Đếm số lớp offset hiện tại
        const currentOffsetCount = await OffsetClass.countDocuments({
            assignedTeacherId: teacher._id,
            status: { $in: ['pending', 'assigned'] }
        });

        // Nếu đã đạt max, điểm = 0
        if (currentOffsetCount >= teacher.maxOffsetClasses) {
            return 0;
        }

        // Tính phần trăm còn lại
        if (teacher.maxOffsetClasses === 0) {
            return 100; // Nếu không giới hạn, điểm tối đa
        }

        const percentageRemaining =
            ((teacher.maxOffsetClasses - currentOffsetCount) / teacher.maxOffsetClasses) * 100;

        return percentageRemaining;
    }

    /**
     * Kiểm tra thời gian bắt đầu của lớp có nằm trong ca làm việc không
     */
    isTimeInRange(classStart, classEnd, shiftStart, shiftEnd) {
        // Chỉ cần thời gian bắt đầu nằm trong ca làm việc
        const result = classStart >= shiftStart && classStart < shiftEnd;
        console.log(`      🔍 Time check: ${classStart} >= ${shiftStart} && ${classStart} < ${shiftEnd} = ${result}`);
        return result;
    }

    /**
     * Kiểm tra hai khoảng thời gian có chồng lấn không
     */
    isTimeOverlap(start1, end1, start2, end2) {
        return (start1 < end2 && end1 > start2);
    }

    /**
     * Lấy tên thứ trong tuần từ Date
     */
    getDayOfWeek(date) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    }

    /**
     * Phân bổ nhiều lớp offset cùng lúc
     * @param {Array} offsetClasses - Danh sách lớp offset
     * @returns {Array} - Danh sách kết quả phân bổ
     */
    async allocateMultipleClasses(offsetClasses) {
        const results = [];

        for (const offsetClass of offsetClasses) {
            try {
                const teacher = await this.findSuitableTeacher(offsetClass);

                if (teacher) {
                    results.push({
                        offsetClass,
                        assignedTeacher: teacher,
                        success: true,
                        message: 'Teacher assigned successfully'
                    });
                } else {
                    results.push({
                        offsetClass,
                        assignedTeacher: null,
                        success: false,
                        message: 'No suitable teacher found'
                    });
                }
            } catch (error) {
                results.push({
                    offsetClass,
                    assignedTeacher: null,
                    success: false,
                    message: error.message
                });
            }
        }

        return results;
    }

    /**
     * Tái phân bổ lớp offset khi giáo viên không khả dụng
     * @param {String} offsetClassId - ID lớp offset
     * @returns {Object} - Giáo viên mới hoặc null
     */
    async reallocateClass(offsetClassId) {
        const offsetClass = await OffsetClass.findById(offsetClassId);

        if (!offsetClass) {
            throw new Error('Offset class not found');
        }

        // Tìm giáo viên khác, loại trừ giáo viên hiện tại
        const newTeacher = await this.findSuitableTeacher(offsetClass);

        return newTeacher;
    }
}

export default new OffsetAllocationService();
