import Teacher from '../models/teacher.js';
import TeacherLevel from '../models/teacherLevel.js';
import WorkShift from '../models/workShift.js';
import FixedSchedule from '../models/fixedScheduled.js';
import OffsetClass from '../models/offsetClass.js';
import FixedScheduleLeave from '../models/fixedScheduleLeave.js';

/**
 * Service để phân bổ lớp offset cho giáo viên
 * Ưu tiên: Lịch làm việc > Cân bằng số lớp
 */

class OffsetAllocationService {
    /**
     * Tìm giáo viên phù hợp cho lớp offset
     * @param {Object} offsetClass - Thông tin lớp offset
     * @param {Array|string|null} excludeTeacherIds - ID giáo viên cần loại trừ (mảng hoặc single id)
     * @returns {Object|null} - Giáo viên được chọn hoặc null
     */
    async findSuitableTeacher(offsetClass, excludeTeacherIds = null) {
        const { subjectLevelId, scheduledDate, startTime, endTime } = offsetClass;

        console.log('\n🔍 Finding suitable teacher for offset class:');
        console.log(`   📅 Date: ${scheduledDate}`);
        console.log(`   ⏰ Time: ${startTime} - ${endTime}`);
        console.log(`   📚 Subject Level: ${subjectLevelId}`);
        if (excludeTeacherIds) {
            console.log(
                `   🚫 Excluding teacher(s): ${Array.isArray(excludeTeacherIds)
                    ? excludeTeacherIds.join(',')
                    : excludeTeacherIds
                }`
            );
        }

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

        // Lọc giáo viên active + loại trừ giáo viên cũ (nếu có)
        const excludeSet = new Set();
        if (excludeTeacherIds) {
            if (Array.isArray(excludeTeacherIds)) {
                excludeTeacherIds.forEach(id => excludeSet.add(id.toString()));
            } else {
                excludeSet.add(excludeTeacherIds.toString());
            }
        }

        const activeTeachers = teachersWithLevel
            .filter(tl => {
                if (!tl.teacherId) return false;
                const tid = tl.teacherId._id.toString();
                if (excludeSet.size > 0 && excludeSet.has(tid)) {
                    console.log(
                        `      🚫 Filtered out teacher ${tl.teacherId.name} (ID: ${tid}) because in exclude list`
                    );
                    return false;
                }
                return true;
            })
            .map(tl => ({
                teacher: tl.teacherId,
                experienceYears: tl.experienceYears
            }));

        console.log(`   ✅ ${activeTeachers.length} active teachers after filtering`);

        if (activeTeachers.length === 0) {
            console.log('   ❌ No active teachers found');
            return null;
        }

        // Bước 2: Loại bỏ những giáo viên KHÔNG có ca làm việc phù hợp trước khi tính workload
        console.log('\n   🔎 Filtering teachers by schedule availability...');
        const availableTeachers = [];
        for (const { teacher, experienceYears } of activeTeachers) {
            try {
                const scheduleScore = await this.calculateScheduleScore(
                    teacher._id,
                    scheduledDate,
                    startTime,
                    endTime
                );

                if (scheduleScore > 0) {
                    availableTeachers.push({ teacher, experienceYears, scheduleScore });
                } else {
                    console.log(
                        `      🚫 Excluding ${teacher.name} (ID: ${teacher._id}) - schedule not suitable (no shift or conflict)`
                    );
                }
            } catch (err) {
                console.log(
                    `      ⚠️ Error checking schedule for ${teacher.name}:`,
                    err.message
                );
            }
        }

        console.log(
            `   ✅ ${availableTeachers.length} teachers available after schedule filter`
        );

        if (availableTeachers.length === 0) {
            console.log('   ❌ No available teachers with matching shifts');
            return null;
        }

        // Thu thập thông tin giờ dạy và offset của các giáo viên đã được lọc
        console.log(
            '\n   📊 Collecting teacher workload data for relative comparison...'
        );
        const teacherWorkloads = await Promise.all(
            availableTeachers.map(async ({ teacher }) => {
                const workload = await this.getTeacherWorkload(teacher);
                return { teacher, workload };
            })
        );

        // Tìm min và max để tính điểm tương đối
        const allHours = teacherWorkloads.map(tw => tw.workload.totalHours);
        const allOffsets = teacherWorkloads.map(tw => tw.workload.offsetCount);
        const minHours = Math.min(...allHours);
        const maxHours = Math.max(...allHours);
        const minOffsets = Math.min(...allOffsets);
        const maxOffsets = Math.max(...allOffsets);

        console.log(
            `   📊 Workload range: Hours [${minHours.toFixed(
                1
            )} - ${maxHours.toFixed(1)}], Offsets [${minOffsets} - ${maxOffsets}]`
        );

        console.log(`   📋 Detailed workload:`);
        teacherWorkloads.forEach(tw => {
            console.log(
                `      - ${tw.teacher.name}: ${tw.workload.totalHours.toFixed(
                    1
                )}h, ${tw.workload.offsetCount} offsets`
            );
        });

        // Bước 3: Tính điểm cho từng giáo viên (sử dụng dữ liệu tương đối)
        console.log('\n   📊 Calculating scores for each teacher:');
        const scoredTeachers = await Promise.all(
            availableTeachers.map(async ({ teacher, experienceYears, scheduleScore }) => {
                console.log(
                    `\n   👤 Evaluating teacher: ${teacher.name} (ID: ${teacher._id})`
                );
                const workload = teacherWorkloads.find(
                    tw => tw.teacher._id.toString() === teacher._id.toString()
                ).workload;
                const score = await this.calculateTeacherScore(
                    teacher,
                    scheduledDate,
                    startTime,
                    endTime,
                    experienceYears,
                    workload,
                    { minHours, maxHours, minOffsets, maxOffsets },
                    scheduleScore
                );
                console.log(`   💯 Final score for ${teacher.name}: ${score}`);
                return { teacher, score };
            })
        );

        // Bước 4: Chọn giáo viên có điểm cao nhất
        scoredTeachers.sort((a, b) => b.score - a.score);

        console.log(
            '\n   🏆 Top 3 teachers (sorted by score DESC - highest first):'
        );
        scoredTeachers.slice(0, 3).forEach((st, index) => {
            const workload = teacherWorkloads.find(
                tw => tw.teacher._id.toString() === st.teacher._id.toString()
            )?.workload;
            console.log(
                `   ${index + 1}. ${st.teacher.name}: ${st.score.toFixed(
                    2
                )} points (${workload?.totalHours.toFixed(1)}h, ${workload?.offsetCount
                } offsets)`
            );
        });

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
     * @param {Object} workload - Thông tin workload của giáo viên
     * @param {Object} ranges - Phạm vi min/max để tính điểm tương đối
     * @param {Number} scheduleScore - Điểm lịch làm việc đã tính sẵn
     * @returns {Number} - Điểm tổng hợp
     */
    async calculateTeacherScore(
        teacher,
        scheduledDate,
        startTime,
        endTime,
        experienceYears,
        workload,
        ranges,
        scheduleScore
    ) {
        console.log(
            `   🔁 Using precomputed scheduleScore for ${teacher.name}: ${scheduleScore}`
        );

        if (!scheduleScore || scheduleScore <= 0) {
            console.log(
                `   ❌ Schedule score <= 0 in scoring phase → Total score = 0 (REJECTED)`
            );
            return 0;
        }

        let score = scheduleScore * 0.5;

        // Cân bằng số lớp (50%)
        const balanceScore = this.calculateBalanceScore(workload, ranges);
        score += balanceScore * 0.5;

        console.log(
            `   📊 Breakdown: Schedule(${scheduleScore}×0.5) + Balance(${balanceScore}×0.5) = ${score}`
        );

        return score;
    }

    /**
     * CHUẨN HOÁ NGÀY LOCAL (UTC+7) → "YYYY-MM-DD"
     */
    getLocalICTDateString(date) {
        const d = new Date(date);
        // +7h để convert sang Asia/Bangkok
        const shifted = new Date(d.getTime() + 7 * 60 * 60 * 1000);
        const y = shifted.getUTCFullYear();
        const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
        const day = String(shifted.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    /**
     * Tính điểm lịch làm việc
     * Kiểm tra giáo viên có rảnh không, có xung đột với lịch cố định & offset khác không
     * @returns {Number} - Điểm từ 0-100
     */
    async calculateScheduleScore(teacherId, scheduledDate, startTime, endTime) {
        const queryDate = new Date(scheduledDate);

        // Dùng UTC để define "ngày" trong DB, nhưng ta sẽ so sánh LOCAL DAY bằng getLocalICTDateString
        const startOfDayUTC = new Date(
            Date.UTC(
                queryDate.getUTCFullYear(),
                queryDate.getUTCMonth(),
                queryDate.getUTCDate(),
                0,
                0,
                0,
                0
            )
        );
        const endOfDayUTC = new Date(
            Date.UTC(
                queryDate.getUTCFullYear(),
                queryDate.getUTCMonth(),
                queryDate.getUTCDate(),
                23,
                59,
                59,
                999
            )
        );

        const localDayStr = this.getLocalICTDateString(queryDate);

        console.log(
            `   🔍 Checking schedule for teacher ${teacherId} on local day ${localDayStr}`
        );
        console.log('DEBUG: Query UTC day range:', { startOfDayUTC, endOfDayUTC });

        // 1) WorkShift – ca làm việc trong ngày (dựa trên date UTC như DB đang lưu)
        const workShifts = await WorkShift.find({
            teacherId,
            date: {
                $gte: startOfDayUTC,
                $lte: endOfDayUTC
            },
            isAvailable: true
        }).populate('shiftId');

        console.log('DEBUG: workShifts found:', workShifts);
        console.log(`   📋 Found ${workShifts.length} work shifts for this day`);

        // Kiểm tra WorkShift - Bắt buộc phải có lịch làm việc và lớp offset phải nằm trong ca
        // Nếu không có ca hoặc không khớp giờ -> Reject

        let hasMatchingShift = false;
        let matchingShiftDetails = null;

        if (workShifts && workShifts.length > 0) {
            for (const ws of workShifts) {
                if (!ws.shiftId) continue;

                const shiftStart = ws.shiftId.startTime;
                const shiftEnd = ws.shiftId.endTime;

                const inRange = this.isTimeInRange(startTime, endTime, shiftStart, shiftEnd);

                if (inRange) {
                    hasMatchingShift = true;
                    matchingShiftDetails = `${shiftStart}-${shiftEnd}`;
                    break;
                }
            }
        }

        if (hasMatchingShift) {
            console.log(`   ✅ Found matching shift: ${matchingShiftDetails}`);
        } else {
            console.log(
                `   ❌ REJECTED: No matching shift found (Required to be within work schedule)`
            );
            return 0;
        }

        // 2) FixedSchedule – xung đột lịch cố định
        const dayOfWeek = this.getDayOfWeek(queryDate);
        console.log(`   📅 Checking fixed schedules for ${dayOfWeek}...`);

        const fixedSchedules = await FixedSchedule.find({
            teacherId,
            dayOfWeek,
            isActive: true
        });

        console.log(`   📋 Found ${fixedSchedules.length} fixed schedules`);

        for (const fs of fixedSchedules) {
            const conflict = this.isTimeOverlap(
                startTime,
                endTime,
                fs.startTime,
                fs.endTime
            );
            if (conflict) {
                console.log(
                    `   ❌ REJECTED: Fixed schedule conflict ${fs.startTime}-${fs.endTime}`
                );
                return 0;
            }
        }

        // 3) OffsetClass – xung đột với các lớp offset khác CÙNG NGÀY LOCAL (Asia/Bangkok)
        console.log(`   🔍 Checking existing offset classes (same local day)...`);

        // Lấy rộng ra ±36h rồi filter bằng localDay
        const windowStart = new Date(queryDate.getTime() - 36 * 60 * 60 * 1000);
        const windowEnd = new Date(queryDate.getTime() + 36 * 60 * 60 * 1000);

        const existingOffsetClassesRaw = await OffsetClass.find({
            assignedTeacherId: teacherId,
            status: { $in: ['pending', 'assigned', 'completed'] },
            scheduledDate: {
                $gte: windowStart,
                $lte: windowEnd
            }
        });

        console.log(
            `   📋 Found ${existingOffsetClassesRaw.length} existing offset classes in ±36h window`
        );

        const existingOffsetClasses = existingOffsetClassesRaw.filter(oc => {
            const ocLocal = this.getLocalICTDateString(oc.scheduledDate);
            const sameDay = ocLocal === localDayStr;
            console.log(
                `      🔍 Offset ${oc.className} at ${oc.startTime}-${oc.endTime}, scheduledDate=${oc.scheduledDate.toISOString()} → local=${ocLocal}, sameDay=${sameDay}`
            );
            return sameDay;
        });

        console.log(
            `   📋 After local-day filter: ${existingOffsetClasses.length} offsets in same local day`
        );

        for (const oc of existingOffsetClasses) {
            console.log(
                `      🔍 Checking offset: ${oc.className} ${oc.startTime}-${oc.endTime} (${oc.status})`
            );
            const conflict = this.isTimeOverlap(
                startTime,
                endTime,
                oc.startTime,
                oc.endTime
            );
            if (conflict) {
                console.log(
                    `   ❌ REJECTED: Offset class conflict ${oc.startTime}-${oc.endTime} (${oc.className})`
                );
                return 0;
            } else {
                console.log(`      ✅ No conflict with ${oc.className}`);
            }
        }

        console.log(`   ✅ AVAILABLE: No conflicts found, score = 100`);
        return 100;
    }

    /**
     * Tính điểm cân bằng số lớp dựa trên so sánh tương đối
     */
    calculateBalanceScore(workload, ranges) {
        const { totalHours, offsetCount } = workload;
        const { minHours, maxHours, minOffsets, maxOffsets } = ranges;

        console.log(
            `   📚 Total hours (fixed + offset): ${totalHours.toFixed(
                1
            )} hours (range: ${minHours.toFixed(1)} - ${maxHours.toFixed(1)})`
        );
        console.log(
            `   📊 Current offset classes: ${offsetCount} (range: ${minOffsets} - ${maxOffsets})`
        );

        let hoursScore = 100;
        if (maxHours > minHours) {
            const hoursRatio = (totalHours - minHours) / (maxHours - minHours);
            hoursScore = 100 - hoursRatio * 100;
            console.log(
                `   🔢 Hours calculation: (${totalHours.toFixed(
                    1
                )} - ${minHours.toFixed(1)}) / (${maxHours.toFixed(
                    1
                )} - ${minHours.toFixed(1)}) = ${hoursRatio.toFixed(
                    3
                )} → score = ${hoursScore.toFixed(1)}`
            );
        } else {
            hoursScore = 50;
            console.log(
                `   ⚠️ All teachers have same hours (${totalHours.toFixed(
                    1
                )}), using default score 50`
            );
        }

        let offsetScore = 100;
        if (maxOffsets > minOffsets) {
            const offsetRatio = (offsetCount - minOffsets) / (maxOffsets - minOffsets);
            offsetScore = 100 - offsetRatio * 100;
            console.log(
                `   🔢 Offset calculation: (${offsetCount} - ${minOffsets}) / (${maxOffsets} - ${minOffsets}) = ${offsetRatio.toFixed(
                    3
                )} → score = ${offsetScore.toFixed(1)}`
            );
        } else {
            offsetScore = 50;
            console.log(
                `   ⚠️ All teachers have same offsets (${offsetCount}), using default score 50`
            );
        }

        hoursScore = Math.max(0, Math.min(100, hoursScore));
        offsetScore = Math.max(0, Math.min(100, offsetScore));

        const balanceScore = hoursScore * 0.95 + offsetScore * 0.05;

        console.log(
            `   💯 Balance breakdown: Hours(${hoursScore.toFixed(
                1
            )}×0.95) + Offset(${offsetScore.toFixed(1)}×0.05) = ${balanceScore.toFixed(
                1
            )}`
        );

        return balanceScore;
    }

    /**
     * Chuẩn hoá thời gian & chuyển sang phút
     */
    normalizeTime(timeStr) {
        if (!timeStr) return null;
        return timeStr.toString().trim().slice(0, 5); // HH:MM
    }

    timeToMinutes(timeStr) {
        const norm = this.normalizeTime(timeStr);
        if (!norm || !norm.includes(':')) {
            console.log('      ⚠️ Invalid time string:', timeStr);
            return NaN;
        }
        const [hours, minutes] = norm.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Kiểm tra thời gian bắt đầu của lớp có nằm trong ca làm việc không
     */
    isTimeInRange(classStart, classEnd, shiftStart, shiftEnd) {
        const cs = this.timeToMinutes(classStart);
        const ss = this.timeToMinutes(shiftStart);
        const se = this.timeToMinutes(shiftEnd);

        const result = cs >= ss && cs < se;
        console.log(
            `      🔍 Time check (minutes): ${cs} >= ${ss} && ${cs} < ${se} = ${result} (${classStart} vs ${shiftStart}-${shiftEnd})`
        );
        return result;
    }

    /**
     * Kiểm tra hai khoảng thời gian có chồng lấn không
     */
    isTimeOverlap(start1, end1, start2, end2) {
        const s1 = this.timeToMinutes(start1);
        const e1 = this.timeToMinutes(end1);
        const s2 = this.timeToMinutes(start2);
        const e2 = this.timeToMinutes(end2);

        if ([s1, e1, s2, e2].some(v => Number.isNaN(v))) {
            console.log(
                '      ⚠️ Cannot check overlap, invalid time(s):',
                start1,
                end1,
                start2,
                end2
            );
            return false;
        }

        const overlap = s1 < e2 && e1 > s2;
        console.log(
            `      [OverlapCheck] ${start1}-${end1} (${s1}-${e1}) vs ${start2}-${end2} (${s2}-${e2}) → ${overlap}`
        );
        return overlap;
    }

    /**
     * Lấy tên thứ trong tuần từ Date
     */
    getDayOfWeek(date) {
        const days = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday'
        ];
        return days[date.getDay()];
    }

    /**
     * Thu thập thông tin workload của giáo viên
     */
    async getTeacherWorkload(teacher) {
        const fixedSchedules = await FixedSchedule.find({
            teacherId: teacher._id,
            isActive: true
        });

        let totalHoursInMonth = 0;
        if (fixedSchedules && fixedSchedules.length > 0) {
            const today = new Date();
            const monthStart = new Date(
                Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 0, 0, 0, 0)
            );
            const monthEnd = new Date(
                Date.UTC(
                    today.getUTCFullYear(),
                    today.getUTCMonth() + 1,
                    0,
                    23,
                    59,
                    59,
                    999
                )
            );

            console.log(
                `      [${teacher.name}] Found ${fixedSchedules.length} fixed schedules`
            );
            console.log(
                `      [${teacher.name}] Month range: ${monthStart
                    .toISOString()
                    .split('T')[0]} to ${monthEnd.toISOString().split('T')[0]}`
            );

            for (const schedule of fixedSchedules) {
                const startMinutes = this.timeToMinutes(schedule.startTime);
                const endMinutes = this.timeToMinutes(schedule.endTime);
                let hoursPerSession = (endMinutes - startMinutes) / 60;

                // Apply 0.75 multiplier for Tutors (based on schedule role)
                if (schedule.role === 'tutor') {
                    hoursPerSession *= 0.75;
                }

                let sessionsInMonth = 0;
                const scheduleDayOfWeek = schedule.dayOfWeek;

                const dayNameToNumber = {
                    Sunday: 0,
                    Monday: 1,
                    Tuesday: 2,
                    Wednesday: 3,
                    Thursday: 4,
                    Friday: 5,
                    Saturday: 6
                };
                const expectedDayNumber = dayNameToNumber[scheduleDayOfWeek];

                if (expectedDayNumber === undefined) {
                    console.log(
                        `      ⚠️ Warning: Invalid dayOfWeek "${scheduleDayOfWeek}" for schedule ${schedule._id}`
                    );
                    continue;
                }

                const leaves = await FixedScheduleLeave.find({
                    teacherId: teacher._id,
                    fixedScheduleId: schedule._id,
                    date: {
                        $gte: monthStart,
                        $lte: monthEnd
                    }
                });

                const leaveDates = new Set();
                leaves.forEach(leave => {
                    const leaveDate = new Date(leave.date);
                    const dateKey = `${leaveDate.getUTCFullYear()}-${String(
                        leaveDate.getUTCMonth() + 1
                    ).padStart(2, '0')}-${String(
                        leaveDate.getUTCDate()
                    ).padStart(2, '0')}`;
                    leaveDates.add(dateKey);
                });

                for (let d = new Date(monthStart); d <= monthEnd; d.setUTCDate(
                    d.getUTCDate() + 1
                )) {
                    const scheduleStart = schedule.startDate
                        ? new Date(schedule.startDate)
                        : null;
                    const scheduleEnd = schedule.endDate
                        ? new Date(schedule.endDate)
                        : null;

                    const isInDateRange =
                        (!scheduleStart || d >= scheduleStart) &&
                        (!scheduleEnd || d <= scheduleEnd);

                    if (isInDateRange) {
                        const currentDayOfWeek = d.getUTCDay();
                        if (currentDayOfWeek === expectedDayNumber) {
                            const dateKey = `${d.getUTCFullYear()}-${String(
                                d.getUTCMonth() + 1
                            ).padStart(2, '0')}-${String(
                                d.getUTCDate()
                            ).padStart(2, '0')}`;
                            if (!leaveDates.has(dateKey)) {
                                sessionsInMonth++;
                            }
                        }
                    }
                }

                totalHoursInMonth += hoursPerSession * sessionsInMonth;
                const scheduleTotalHours = hoursPerSession * sessionsInMonth;
                console.log(
                    `      [${teacher.name}] Schedule ${schedule.className} (${scheduleDayOfWeek} ${schedule.startTime}-${schedule.endTime}): ${sessionsInMonth} sessions × ${hoursPerSession.toFixed(
                        1
                    )}h = ${scheduleTotalHours.toFixed(1)}h`
                );
                if (leaves.length > 0) {
                    console.log(`        ⚠️ ${leaves.length} leave days excluded`);
                }
            }

            console.log(
                `      [${teacher.name}] Total fixed hours in month: ${totalHoursInMonth.toFixed(
                    1
                )}h`
            );
        } else {
            console.log(`      [${teacher.name}] No fixed schedules found`);
        }

        const today = new Date();
        const monthStart = new Date(
            Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 0, 0, 0, 0)
        );
        const monthEnd = new Date(
            Date.UTC(
                today.getUTCFullYear(),
                today.getUTCMonth() + 1,
                0,
                23,
                59,
                59,
                999
            )
        );

        const offsetClasses = await OffsetClass.find({
            assignedTeacherId: teacher._id,
            status: { $in: ['pending', 'assigned', 'completed'] },
            scheduledDate: {
                $gte: monthStart,
                $lte: monthEnd
            }
        });

        let offsetHoursInMonth = 0;
        for (const oc of offsetClasses) {
            const startMinutes = this.timeToMinutes(oc.startTime);
            const endMinutes = this.timeToMinutes(oc.endTime);
            const hoursPerClass = (endMinutes - startMinutes) / 60;
            offsetHoursInMonth += hoursPerClass;
        }

        const totalHours = totalHoursInMonth + offsetHoursInMonth;
        const currentOffsetCount = offsetClasses.length;

        console.log(
            `      [${teacher.name}] Fixed: ${totalHoursInMonth.toFixed(
                1
            )}h, Offset: ${offsetHoursInMonth.toFixed(
                1
            )}h, Total: ${totalHours.toFixed(
                1
            )}h, Offset count: ${currentOffsetCount}`
        );

        return {
            totalHours,
            offsetCount: currentOffsetCount
        };
    }

    /**
     * Phân bổ nhiều lớp offset cùng lúc
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
     */
    async reallocateClass(offsetClassId) {
        const offsetClass = await OffsetClass.findById(offsetClassId);

        if (!offsetClass) {
            throw new Error('Offset class not found');
        }

        const excludeIds = [];
        if (offsetClass.assignedTeacherId)
            excludeIds.push(offsetClass.assignedTeacherId.toString());
        if (
            offsetClass.assignedHistory &&
            Array.isArray(offsetClass.assignedHistory) &&
            offsetClass.assignedHistory.length
        ) {
            offsetClass.assignedHistory.forEach(id => excludeIds.push(id.toString()));
        }

        const newTeacher = await this.findSuitableTeacher(offsetClass, excludeIds);

        return newTeacher;
    }
}

export default new OffsetAllocationService();
