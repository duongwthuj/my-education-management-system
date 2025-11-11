import { useState, useEffect } from 'react';
import { Plus, Filter, Calendar, User } from 'lucide-react';
import { scheduleAPI, teachersAPI, fixedScheduleLeaveAPI, offsetClassesAPI, subjectsAPI } from '../services/api';

const Schedule = () => {
  const [shifts, setShifts] = useState([]);
  const [workShifts, setWorkShifts] = useState([]);
  const [fixedScheduleLeaves, setFixedScheduleLeaves] = useState([]);
  const [offsetClasses, setOffsetClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allTeachersDetails, setAllTeachersDetails] = useState([]); // For fixed schedules
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false); // ← Modal tạo nhanh
  const [showFixedScheduleForm, setShowFixedScheduleForm] = useState(false); // ← Form lịch cố định
  const [showOffsetClassForm, setShowOffsetClassForm] = useState(false); // ← Form offset class
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState({}); // { 'YYYY-MM-DD_shiftId': boolean }
  const [quickCreateData, setQuickCreateData] = useState(null); // { teacherId, date, shift }
  const [subjects, setSubjects] = useState([]); // Danh sách môn học
  const [subjectLevels, setSubjectLevels] = useState([]); // Danh sách học phần
  
  // Form data cho Fixed Schedule
  const [fixedScheduleFormData, setFixedScheduleFormData] = useState({
    subjectId: '',
    className: '',
    startTime: '',
    endTime: '',
    dayOfWeek: '',
  });
  
  // Form data cho Offset Class
  const [offsetClassFormData, setOffsetClassFormData] = useState({
    subjectLevelId: '',
    className: '',
    startTime: '',
    endTime: '',
    meetingLink: '',
    notes: '',
  });
  const [formData, setFormData] = useState({
    teacherId: '',
    startDate: '',
    endDate: '',
    isAvailable: true,
    isOnLeave: false,
  });
  const [dateRange, setDateRange] = useState([]);
  
  // Filter states
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  useEffect(() => {
    loadData();
  }, []);

  // Auto-generate date range when start/end date changes
  useEffect(() => {
    generateDateRange();
  }, [formData.startDate, formData.endDate]);

  const loadData = async () => {
    try {
      const [shiftsRes, workShiftsRes, teachersRes, leavesRes, offsetClassesRes, subjectsRes, subjectLevelsRes] = await Promise.all([
        scheduleAPI.getAllShifts(),
        scheduleAPI.getWorkShifts(),
        teachersAPI.getAll(),
        fixedScheduleLeaveAPI.getAll(),
        offsetClassesAPI.getAll({ limit: 1000 }), // Lấy tất cả offset classes (tăng limit)
        subjectsAPI.getAll(), // Lấy danh sách môn học
        subjectsAPI.getAllLevels() // Lấy tất cả học phần
      ]);
      
      // API returns { success, data } after interceptor
      const shiftsArray = shiftsRes?.data || shiftsRes || [];
      const workShiftsArray = workShiftsRes?.data || workShiftsRes || [];
      const teachersArray = teachersRes?.data || teachersRes || [];
      const leavesArray = leavesRes?.data || leavesRes || [];
      const offsetClassesArray = offsetClassesRes?.data || offsetClassesRes || [];
      const subjectsArray = subjectsRes?.data || subjectsRes || [];
      const subjectLevelsArray = subjectLevelsRes?.data || subjectLevelsRes || [];
      
      setShifts(Array.isArray(shiftsArray) ? shiftsArray : []);
      setWorkShifts(Array.isArray(workShiftsArray) ? workShiftsArray : []);
      setTeachers(Array.isArray(teachersArray) ? teachersArray : []);
      setFixedScheduleLeaves(Array.isArray(leavesArray) ? leavesArray : []);
      setOffsetClasses(Array.isArray(offsetClassesArray) ? offsetClassesArray : []);
      setSubjects(Array.isArray(subjectsArray) ? subjectsArray : []);
      
      // Format subject levels with display name
      const formattedLevels = subjectLevelsArray.map(level => ({
        ...level,
        displayName: `${level.subjectId?.name || 'N/A'} - HP${level.semester || '?'}`
      }));
      setSubjectLevels(formattedLevels);
      
      console.log('📊 Loaded subjects:', subjectsArray.length);
      console.log('📊 Loaded subject levels:', formattedLevels.length);
      console.log('📊 Loaded offset classes:', offsetClassesArray.length);
      console.log('📊 Offset classes with status assigned:', offsetClassesArray.filter(oc => oc.status === 'assigned').length);
      console.log('📊 All offset classes:', offsetClassesArray);

      // Load all teachers' details to get fixed schedules
      if (Array.isArray(teachersArray) && teachersArray.length > 0) {
        const teacherDetailsPromises = teachersArray.map(t => 
          teachersAPI.getDetails(t._id).catch(err => {
            console.error(`Error loading details for teacher ${t._id}:`, err);
            return { ...t, fixedSchedules: [] };
          })
        );
        const teacherDetailsRes = await Promise.all(teacherDetailsPromises);
        // Extract data from response
        const teacherDetails = teacherDetailsRes.map(res => res?.data || res);
        setAllTeachersDetails(teacherDetails);
      } else {
        setAllTeachersDetails([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty arrays on error
      setShifts([]);
      setWorkShifts([]);
      setTeachers([]);
      setAllTeachersDetails([]);
      setFixedScheduleLeaves([]);
    } finally {
      setLoading(false);
    }
  };  // Tạo danh sách các ngày trong khoảng
  const generateDateRange = () => {
    console.log('generateDateRange called:', { startDate: formData.startDate, endDate: formData.endDate });
    
    if (!formData.startDate || !formData.endDate) {
      console.log('Missing dates, clearing range');
      setDateRange([]);
      return;
    }
    
    try {
      // Sửa lỗi tạo date range để tránh infinite loop và lệch timezone
      const start = new Date(formData.startDate + 'T00:00:00.000Z');
      const end = new Date(formData.endDate + 'T00:00:00.000Z');
      
      console.log('Date objects:', { start, end });
      
      if (start > end) {
        console.log('Start date after end date');
        setDateRange([]);
        return;
      }
      
      const dates = [];
      
      // Tạo copy để tránh modify object gốc
      const currentDate = new Date(start);
      
      while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
      
      console.log('Generated dates:', dates);
      setDateRange(dates);
    } catch (error) {
      console.error('Error generating date range:', error);
      setDateRange([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedCount = Object.keys(selectedSlots).filter(key => selectedSlots[key]).length;
      
      if (selectedCount === 0) {
        alert('Vui lòng chọn ít nhất một ca làm việc');
        return;
      }

      // Tạo lịch làm việc cho tất cả các slot đã chọn
      for (const [key, isSelected] of Object.entries(selectedSlots)) {
        if (isSelected) {
          const [date, shiftId] = key.split('_');
          // Đảm bảo ngày được gửi với UTC timezone để tránh lệch múi giờ
          const dateObject = new Date(date + 'T00:00:00.000Z');
          await scheduleAPI.createWorkShift({
            teacherId: formData.teacherId,
            date: dateObject.toISOString(),
            shiftId: shiftId,
            isAvailable: formData.isAvailable,
            isOnLeave: formData.isOnLeave
          });
        }
      }

      setShowModal(false);
      setFormData({ 
        teacherId: '', 
        startDate: '', 
        endDate: '', 
        isAvailable: true,
        isOnLeave: false
      });
      setSelectedSlots({});
      setDateRange([]);
      loadData();
      alert(`✅ Đã thêm ${selectedCount} ca làm việc thành công!`);
    } catch (error) {
      alert('Có lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSlotToggle = (date, shiftId) => {
    const key = `${date}_${shiftId}`;
    setSelectedSlots(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectAllSlots = () => {
    const allKeys = dateRange.flatMap(date => 
      shifts.map(shift => `${date}_${shift._id}`)
    );
    
    const allSelected = allKeys.every(key => selectedSlots[key]);
    
    if (allSelected) {
      setSelectedSlots({});
    } else {
      const newSelected = {};
      allKeys.forEach(key => newSelected[key] = true);
      setSelectedSlots(newSelected);
    }
  };

  const handleSelectDateRow = (date) => {
    const rowKeys = shifts.map(shift => `${date}_${shift._id}`);
    const allSelected = rowKeys.every(key => selectedSlots[key]);
    
    const newSelected = { ...selectedSlots };
    rowKeys.forEach(key => {
      newSelected[key] = !allSelected;
    });
    setSelectedSlots(newSelected);
  };

  const handleSelectShiftColumn = (shiftId) => {
    const colKeys = dateRange.map(date => `${date}_${shiftId}`);
    const allSelected = colKeys.every(key => selectedSlots[key]);
    
    const newSelected = { ...selectedSlots };
    colKeys.forEach(key => {
      newSelected[key] = !allSelected;
    });
    setSelectedSlots(newSelected);
  };

  // Handle click on fixed schedule to toggle leave status
  const handleScheduleClick = (teacherId, date, shift, fixedSchedule, isOnLeave) => {
    setSelectedSchedule({
      teacherId,
      date,
      shift,
      fixedSchedule,
      isOnLeave
    });
    setShowLeaveModal(true);
  };

  // Submit leave request or restore
  const handleLeaveSubmit = async () => {
    try {
      const { teacherId, date, fixedSchedule, isOnLeave } = selectedSchedule;
      
      console.log('handleLeaveSubmit called with:', {
        isOnLeave,
        fixedScheduleId: fixedSchedule._id,
        date,
        teacherId
      });
      
      if (isOnLeave) {
        // Restore - delete the fixed schedule leave
        console.log('Deleting leave...');
        await fixedScheduleLeaveAPI.delete(fixedSchedule._id, date);
      } else {
        // Create fixed schedule leave
        console.log('Creating leave...');
        await fixedScheduleLeaveAPI.create({
          fixedScheduleId: fixedSchedule._id,
          teacherId,
          date
        });
      }

      setShowLeaveModal(false);
      setSelectedSchedule(null);
      loadData();
    } catch (error) {
      console.error('Leave request error:', error);
      alert('Có lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  // Submit Fixed Schedule
  const handleFixedScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!quickCreateData) return;
      
      const dayOfWeek = new Date(quickCreateData.date).getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeekName = dayNames[dayOfWeek];
      
      await teachersAPI.addSchedule(quickCreateData.teacherId, {
        subjectId: fixedScheduleFormData.subjectId,
        className: fixedScheduleFormData.className,
        startTime: fixedScheduleFormData.startTime,
        endTime: fixedScheduleFormData.endTime,
        dayOfWeek: dayOfWeekName,
      });
      
      // Reset form
      setShowFixedScheduleForm(false);
      setShowQuickCreateModal(false);
      setFixedScheduleFormData({
        subjectId: '',
        className: '',
        startTime: '',
        endTime: '',
        dayOfWeek: '',
      });
      
      alert('✅ Đã thêm lịch cố định thành công!');
      loadData();
    } catch (error) {
      console.error('Error creating fixed schedule:', error);
      alert('❌ Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  // Submit Offset Class
  const handleOffsetClassSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!quickCreateData) return;
      
      const newOffsetClass = await offsetClassesAPI.create({
        subjectLevelId: offsetClassFormData.subjectLevelId,
        className: offsetClassFormData.className,
        scheduledDate: quickCreateData.date,
        startTime: offsetClassFormData.startTime,
        endTime: offsetClassFormData.endTime,
        meetingLink: offsetClassFormData.meetingLink,
        notes: offsetClassFormData.notes,
        assignedTeacherId: quickCreateData.teacherId, // ← Auto-assign cho giáo viên hiện tại
        status: 'assigned' // ← Đặt status là assigned luôn
      });
      
      console.log('✅ Created offset class:', newOffsetClass);
      
      // Reset form
      setShowOffsetClassForm(false);
      setShowQuickCreateModal(false);
      setOffsetClassFormData({
        subjectLevelId: '',
        className: '',
        startTime: '',
        endTime: '',
        meetingLink: '',
        notes: '',
      });
      
      alert('✅ Đã tạo lớp offset và phân công cho ' + quickCreateData.teacherName + ' thành công!');
      await loadData();
      console.log('✅ Data reloaded after creating offset class');
    } catch (error) {
      console.error('Error creating offset class:', error);
      alert('❌ Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  // Get current week range
  const getCurrentWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    };
  };

  // Initialize filter to current week
  useEffect(() => {
    const currentWeek = getCurrentWeekRange();
    setFilterStartDate(currentWeek.start);
    setFilterEndDate(currentWeek.end);
  }, []);

  // Get week dates for calendar view
  const getWeekDates = () => {
    if (!filterStartDate || !filterEndDate) return [];
    
    const dates = [];
    const startDate = new Date(filterStartDate);
    const endDate = new Date(filterEndDate);
    
    // Calculate number of days between start and end
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  // Helper: Convert day number to day name
  const dayNumberToName = (dayNum) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum];
  };

  // Helper: Get day of week (0 = Sunday, 1 = Monday, ...)
  const getDayOfWeek = (dateString) => {
    const day = new Date(dateString).getDay();
    return day;
  };

  // Helper: Convert time string to minutes
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper: Check if time gap is >= 1 hour (60 minutes)
  const hasSignificantGap = (endTime, startTime) => {
    const endMinutes = timeToMinutes(endTime);
    const startMinutes = timeToMinutes(startTime);
    return startMinutes - endMinutes >= 60;
  };

  // Helper: Calculate free time slots (>= 1 hour)
  const getFreeTimeSlots = (teacherId, date, shift) => {
    const teacher = allTeachersDetails.find(t => t._id === teacherId);
    if (!teacher || !teacher.fixedSchedules) {
      return []; // No fixed schedules, will show work shift status instead
    }

    const dayOfWeek = getDayOfWeek(date);
    const dayName = dayNumberToName(dayOfWeek);
    
    const shiftStartMinutes = timeToMinutes(shift.startTime);
    const shiftEndMinutes = timeToMinutes(shift.endTime);
    
    // Get all fixed schedules that overlap with this shift
    // A schedule overlaps if: (fsStart < shiftEnd) AND (fsEnd > shiftStart)
    const fixedSchedulesInShift = teacher.fixedSchedules.filter(fs => {
      const fsDay = fs.dayOfWeek;
      if (fsDay !== dayName) return false;
      
      const fsStartMinutes = timeToMinutes(fs.startTime);
      const fsEndMinutes = timeToMinutes(fs.endTime);
      
      // Check if schedule overlaps with shift
      return fsStartMinutes < shiftEndMinutes && fsEndMinutes > shiftStartMinutes;
    });
    
    // Get all offset classes for this teacher on this date in this shift
    const offsetClassesInShift = offsetClasses.filter(oc => {
      // Chỉ tính offset class đã có giáo viên (assigned hoặc completed)
      if (!oc.assignedTeacherId || (oc.status !== 'assigned' && oc.status !== 'completed')) {
        return false;
      }
      
      const ocDate = new Date(oc.scheduledDate).toISOString().split('T')[0];
      const ocTeacherId = typeof oc.assignedTeacherId === 'object' 
        ? oc.assignedTeacherId._id 
        : oc.assignedTeacherId;
      
      if (ocTeacherId === teacherId && ocDate === date) {
        const ocStartMinutes = timeToMinutes(oc.startTime);
        const ocEndMinutes = timeToMinutes(oc.endTime);
        
        // Check if offset class overlaps with shift
        return ocStartMinutes < shiftEndMinutes && ocEndMinutes > shiftStartMinutes;
      }
      
      return false;
    });

    // Tổng hợp tất cả các lịch bận (fixed schedules + offset classes)
    const allBusySchedules = [
      ...fixedSchedulesInShift,
      ...offsetClassesInShift.map(oc => ({
        startTime: oc.startTime,
        endTime: oc.endTime,
        isOffsetClass: true
      }))
    ];

    if (allBusySchedules.length === 0) {
      return []; // No schedules in this shift
    }

    // Sort all busy schedules by start time
    const sortedSchedules = allBusySchedules.sort((a, b) => 
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    const freeSlots = [];

    // For calculating free slots, we need to consider the actual overlap with shift
    // Adjust schedule times to be within shift boundaries
    const adjustedSchedules = sortedSchedules.map(schedule => {
      const scheduleStartMinutes = timeToMinutes(schedule.startTime);
      const scheduleEndMinutes = timeToMinutes(schedule.endTime);
      
      // Use the later of (schedule start, shift start) and earlier of (schedule end, shift end)
      const effectiveStart = Math.max(scheduleStartMinutes, shiftStartMinutes);
      const effectiveEnd = Math.min(scheduleEndMinutes, shiftEndMinutes);
      
      return {
        ...schedule,
        effectiveStartTime: `${Math.floor(effectiveStart / 60).toString().padStart(2, '0')}:${(effectiveStart % 60).toString().padStart(2, '0')}`,
        effectiveEndTime: `${Math.floor(effectiveEnd / 60).toString().padStart(2, '0')}:${(effectiveEnd % 60).toString().padStart(2, '0')}`
      };
    });

    // Check gap between shift start and first schedule's effective start
    const firstSchedule = adjustedSchedules[0];
    if (hasSignificantGap(shift.startTime, firstSchedule.effectiveStartTime)) {
      freeSlots.push({
        start: shift.startTime,
        end: firstSchedule.effectiveStartTime
      });
    }

    // Check gaps between consecutive schedules (using effective end/start times)
    for (let i = 0; i < adjustedSchedules.length - 1; i++) {
      const currentEnd = adjustedSchedules[i].effectiveEndTime;
      const nextStart = adjustedSchedules[i + 1].effectiveStartTime;
      if (hasSignificantGap(currentEnd, nextStart)) {
        freeSlots.push({
          start: currentEnd,
          end: nextStart
        });
      }
    }

    // Check gap between last schedule's effective end and shift end
    const lastSchedule = adjustedSchedules[adjustedSchedules.length - 1];
    if (hasSignificantGap(lastSchedule.effectiveEndTime, shift.endTime)) {
      freeSlots.push({
        start: lastSchedule.effectiveEndTime,
        end: shift.endTime
      });
    }

    return freeSlots;
  };

  // Helper: Get fixed schedules that belong to this shift (for display)
  // A schedule belongs to the shift where it STARTS
  const getFixedSchedulesForDateShift = (teacherId, date, shift) => {
    const teacher = allTeachersDetails.find(t => t._id === teacherId);
    if (!teacher || !teacher.fixedSchedules) {
      return [];
    }

    const dayOfWeek = getDayOfWeek(date);
    const dayName = dayNumberToName(dayOfWeek);
    
    const shiftStartMinutes = timeToMinutes(shift.startTime);
    const shiftEndMinutes = timeToMinutes(shift.endTime);
    
    const schedulesInShift = teacher.fixedSchedules.filter(fs => {
      const fsDay = fs.dayOfWeek;
      if (fsDay !== dayName) return false;
      
      // Only include if schedule STARTS in this shift
      const fsStartMinutes = timeToMinutes(fs.startTime);
      return fsStartMinutes >= shiftStartMinutes && fsStartMinutes < shiftEndMinutes;
    });
    
    // Sort by start time (earliest first)
    return schedulesInShift.sort((a, b) => 
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );
  };

  // Filter work shifts
  const filteredWorkShifts = workShifts.filter(ws => {
    // Filter by teacher
    if (filterTeacher && ws.teacherId?._id !== filterTeacher) return false;
    
    // Filter by date range
    if (filterStartDate && filterEndDate) {
      const wsDate = new Date(ws.date).toISOString().split('T')[0];
      if (wsDate < filterStartDate || wsDate > filterEndDate) return false;
    }
    
    return true;
  });

  // Get all teachers to display (either filtered or all)
  const teachersToDisplay = filterTeacher 
    ? allTeachersDetails.filter(t => t._id === filterTeacher)
    : allTeachersDetails;

  // Group by teacher and date
  const groupedByTeacher = {};
  
  teachersToDisplay.forEach(teacher => {
    const teacherId = teacher._id;
    groupedByTeacher[teacherId] = {
      teacher: teacher,
      slots: {} // { 'date_shiftId': { workShift, fixedSchedules } }
    };
    
    // First, add all work shifts
    filteredWorkShifts
      .filter(ws => ws.teacherId?._id === teacherId)
      .forEach(ws => {
        const dateKey = new Date(ws.date).toISOString().split('T')[0];
        const slotKey = `${dateKey}_${ws.shiftId._id}`;
        
        if (!groupedByTeacher[teacherId].slots[slotKey]) {
          groupedByTeacher[teacherId].slots[slotKey] = {
            date: dateKey,
            shift: ws.shiftId,
            workShift: null,
            fixedSchedules: []
          };
        }
        groupedByTeacher[teacherId].slots[slotKey].workShift = ws;
      });
    
    // Then, add fixed schedules for each date/shift in the range
    if (filterStartDate && filterEndDate) {
      const weekDates = getWeekDates();
      weekDates.forEach(date => {
        shifts.forEach(shift => {
          const slotKey = `${date}_${shift._id}`;
          const fixedSchedules = getFixedSchedulesForDateShift(teacherId, date, shift);
          
          // Create slot if not exists OR update existing slot with fixed schedules
          if (!groupedByTeacher[teacherId].slots[slotKey]) {
            groupedByTeacher[teacherId].slots[slotKey] = {
              date: date,
              shift: shift,
              workShift: null,
              fixedSchedules: fixedSchedules
            };
          } else {
            // Merge fixed schedules into existing slot
            groupedByTeacher[teacherId].slots[slotKey].fixedSchedules = fixedSchedules;
          }
        });
      });
    }
  });

  const weekDates = getWeekDates();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Lịch làm việc</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          Thêm lịch làm việc
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Bộ lọc:</span>
          </div>
          
          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Tất cả giáo viên</option>
            {teachers.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Từ ngày:</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Đến ngày:</label>
            <input
              type="date"
              value={filterEndDate}
              min={filterStartDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <button
            onClick={() => {
              const currentWeek = getCurrentWeekRange();
              setFilterStartDate(currentWeek.start);
              setFilterEndDate(currentWeek.end);
            }}
            className="px-3 py-2 text-xs text-primary-600 hover:bg-primary-50 rounded-lg border border-primary-200"
          >
            Tuần này
          </button>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                viewMode === 'calendar' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Bảng tuần
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <User className="w-4 h-4" />
              Theo giáo viên
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && weekDates.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Lịch làm việc tuần</h2>
            
            {/* Legend */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-gray-600">Rảnh</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-blue-100 border border-blue-300 rounded"></div>
                <span className="text-gray-600">Lịch cố định</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-purple-100 border border-purple-300 rounded"></div>
                <span className="text-gray-600">Lớp offset</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-red-100 border border-red-300 rounded"></div>
                <span className="text-gray-600">Xin nghỉ</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-gray-100 border border-gray-300 rounded"></div>
                <span className="text-gray-600">Bận</span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left font-medium text-gray-700 sticky left-0 bg-gray-50 z-20 w-32">Giáo viên</th>
                  <th className="border p-2 text-center font-medium text-gray-700 sticky left-32 bg-gray-50 z-20 w-20">Ca</th>
                  {weekDates.map(date => {
                    const dateObj = new Date(date);
                    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                    const dayName = dayNames[dateObj.getDay()];
                    return (
                      <th key={date} className="border p-2 text-center w-28">
                        <div className="font-medium text-gray-900">{dayName}</div>
                        <div className="text-[10px] text-gray-500">{date.slice(5)}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedByTeacher).map(([teacherId, data]) => {
                  // Calculate rowspan for teacher name
                  const totalRows = shifts.length;
                  
                  return shifts.map((shift, shiftIndex) => (
                    <tr key={`${teacherId}_${shift._id}`} className="hover:bg-gray-50">
                      {shiftIndex === 0 && (
                        <td 
                          rowSpan={totalRows} 
                          className="border p-2 font-medium text-gray-900 align-top sticky left-0 bg-white z-10"
                        >
                          {data.teacher?.name || 'Unknown'}
                        </td>
                      )}
                      <td className="border p-1.5 text-center bg-gray-50 font-medium text-gray-700 sticky left-32 z-10">
                        <div className="text-[11px]">{shift.name}</div>
                        <div className="text-[9px] text-gray-500">
                          {shift.startTime}-{shift.endTime}
                        </div>
                      </td>
                    {weekDates.map(date => {
                      const slotKey = `${date}_${shift._id}`;
                      const slot = data.slots[slotKey];
                      
                      // Get free time slots (>= 1 hour)
                      const freeSlots = getFreeTimeSlots(teacherId, date, shift);
                      
                      // Check if has offset classes for this slot (in this specific shift)
                      const ocDate = new Date(date).toISOString().split('T')[0];
                      const hasOffsetClasses = offsetClasses.some(oc => {
                        if (!oc.assignedTeacherId || (oc.status !== 'assigned' && oc.status !== 'completed')) {
                          return false;
                        }
                        const offsetDate = new Date(oc.scheduledDate).toISOString().split('T')[0];
                        const offsetTeacherId = typeof oc.assignedTeacherId === 'object' 
                          ? oc.assignedTeacherId._id 
                          : oc.assignedTeacherId;
                        
                        if (offsetTeacherId === teacherId && offsetDate === ocDate) {
                          const ocStartMinutes = timeToMinutes(oc.startTime);
                          const shiftStartMinutes = timeToMinutes(shift.startTime);
                          const shiftEndMinutes = timeToMinutes(shift.endTime);
                          // Hiển thị ở ca chứa giờ bắt đầu
                          return ocStartMinutes >= shiftStartMinutes && ocStartMinutes < shiftEndMinutes;
                        }
                        return false;
                      });
                      
                      // Check if teacher has ANY offset class on this date (for shouldShow logic)
                      const hasAnyOffsetOnDate = offsetClasses.some(oc => {
                        if (!oc.assignedTeacherId || (oc.status !== 'assigned' && oc.status !== 'completed')) {
                          return false;
                        }
                        const offsetDate = new Date(oc.scheduledDate).toISOString().split('T')[0];
                        const offsetTeacherId = typeof oc.assignedTeacherId === 'object' 
                          ? oc.assignedTeacherId._id 
                          : oc.assignedTeacherId;
                        return offsetTeacherId === teacherId && offsetDate === ocDate;
                      });
                      
                      // Determine what to show
                      const hasFixedSchedules = slot?.fixedSchedules && slot.fixedSchedules.length > 0;
                      const hasWorkShift = slot?.workShift;
                      const showFreeSlots = freeSlots.length > 0;
                      
                      console.log('📊 shouldShow check:', {
                        date,
                        shift: shift.name,
                        hasOffsetClasses,
                        hasAnyOffsetOnDate,
                        hasFixedSchedules,
                        hasWorkShift,
                        showFreeSlots
                      });
                      
                      // ALWAYS show if teacher has offset class on this date (manual assignment)
                      // If has fixed schedules, show free slots OR fixed schedules
                      // If no fixed schedules, show work shift status
                      const shouldShow = hasAnyOffsetOnDate || hasOffsetClasses || (hasFixedSchedules ? (showFreeSlots || hasFixedSchedules) : hasWorkShift);
                      
                      console.log('📊 shouldShow result:', shouldShow);
                      
                      // Skip if nothing to show
                      if (!shouldShow) {
                        return (
                          <td 
                            key={date} 
                            className="border p-1 text-center text-gray-300 cursor-pointer hover:bg-blue-50 transition-colors"
                            onClick={() => {
                              // Click vào ô trống để tạo offset class hoặc thêm lịch
                              setQuickCreateData({
                                teacherId,
                                teacherName: data.teacher?.name,
                                date,
                                shift
                              });
                              setShowQuickCreateModal(true);
                            }}
                          >
                            <span className="text-[10px]">+ Thêm</span>
                          </td>
                        );
                      }
                      
                      const { workShift, fixedSchedules } = slot || {};
                      
                      return (
                        <td 
                          key={date} 
                          className="border p-1 align-top cursor-pointer hover:bg-blue-50 transition-colors"
                          onClick={() => {
                            // Click vào ô để tạo offset class hoặc thêm lịch
                            setQuickCreateData({
                              teacherId,
                              teacherName: data.teacher?.name,
                              date,
                              shift
                            });
                            setShowQuickCreateModal(true);
                          }}
                        >
                          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                            {(() => {
                              // Thu thập tất cả các items để sắp xếp theo thời gian
                              const allItems = [];
                              
                              // 1. Thêm Free Time Slots
                              if (showFreeSlots && workShift?.isAvailable) {
                                freeSlots.forEach((freeSlot, idx) => {
                                  allItems.push({
                                    type: 'free',
                                    startTime: freeSlot.start,
                                    sortTime: timeToMinutes(freeSlot.start),
                                    element: (
                                      <div 
                                        key={`free-${idx}`}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-800 border border-green-300"
                                      >
                                        <div className="font-medium">✓ Rảnh</div>
                                        <div className="text-[8px] text-green-600">
                                          {freeSlot.start}-{freeSlot.end}
                                        </div>
                                      </div>
                                    )
                                  });
                                });
                              }
                              
                              // 2. Thêm Fixed Schedules
                              if (fixedSchedules && fixedSchedules.length > 0) {
                                fixedSchedules.forEach((fs, idx) => {
                                  const isOnLeave = fixedScheduleLeaves.some(leave => {
                                    const leaveScheduleId = typeof leave.fixedScheduleId === 'object' 
                                      ? leave.fixedScheduleId._id 
                                      : leave.fixedScheduleId;
                                    const leaveDate = new Date(leave.date).toISOString().split('T')[0];
                                    return leaveScheduleId === fs._id && leaveDate === date;
                                  });
                                  
                                  allItems.push({
                                    type: 'fixed',
                                    startTime: fs.startTime,
                                    sortTime: timeToMinutes(fs.startTime),
                                    element: (
                                      <button
                                        key={`fixed-${idx}`}
                                        type="button"
                                        onClick={() => handleScheduleClick(teacherId, date, shift, fs, isOnLeave)}
                                        className={`w-full text-left text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                          isOnLeave
                                            ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                                            : 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                                        }`}
                                      >
                                        <div className="font-medium truncate">
                                          {isOnLeave ? '🏖️ ' : '📚 '}
                                          {fs.subjectId?.name || 'N/A'}
                                          {isOnLeave && ' (Nghỉ)'}
                                        </div>
                                        <div className={`text-[8px] ${isOnLeave ? 'text-red-600' : 'text-blue-600'}`}>
                                          {fs.startTime}-{fs.endTime}
                                        </div>
                                      </button>
                                    )
                                  });
                                });
                              }
                              
                              // 3. Thêm Offset Classes
                              console.log('🔎 Starting offset filter for teacherId:', teacherId, 'date:', date, 'shift:', shift.name);
                              console.log('🔎 Total offset classes:', offsetClasses.length);
                              
                              const teacherOffsetClasses = offsetClasses.filter(oc => {
                                // Chỉ hiển thị lớp đã có giáo viên (assigned hoặc completed)
                                if (!oc.assignedTeacherId) {
                                  console.log('❌ Offset class không có assignedTeacherId:', oc);
                                  return false;
                                }
                                
                                if (oc.status !== 'assigned' && oc.status !== 'completed') {
                                  console.log('❌ Offset class status không phải assigned/completed:', oc.status, oc);
                                  return false;
                                }
                                
                                const ocDate = new Date(oc.scheduledDate).toISOString().split('T')[0];
                                const ocTeacherId = typeof oc.assignedTeacherId === 'object' 
                                  ? oc.assignedTeacherId._id 
                                  : oc.assignedTeacherId;
                                
                                console.log('🔎 Checking offset:', 
                                  'className:', oc.className,
                                  'ocTeacherId:', ocTeacherId,
                                  'targetTeacherId:', teacherId,
                                  'teacherMatch:', ocTeacherId === teacherId,
                                  'ocDate:', ocDate,
                                  'targetDate:', date,
                                  'dateMatch:', ocDate === date
                                );
                                
                if (ocTeacherId === teacherId && ocDate === date) {
                  const ocStartMinutes = timeToMinutes(oc.startTime);
                  const shiftStartMinutes = timeToMinutes(shift.startTime);
                  const shiftEndMinutes = timeToMinutes(shift.endTime);
                  
                  console.log('🔍 Checking offset class:',
                    'className:', oc.className,
                    'startTime:', oc.startTime,
                    'endTime:', oc.endTime,
                    'ocStartMinutes:', ocStartMinutes,
                    'shiftStartMinutes:', shiftStartMinutes,
                    'shiftEndMinutes:', shiftEndMinutes,
                    'shift:', shift.name,
                    'match:', ocStartMinutes >= shiftStartMinutes && ocStartMinutes < shiftEndMinutes
                  );
                  
                  // Hiển thị ở ca chứa giờ bắt đầu
                  return ocStartMinutes >= shiftStartMinutes && ocStartMinutes < shiftEndMinutes;
                }                                return false;
                              });
                              
                              teacherOffsetClasses.forEach((oc, idx) => {
                                allItems.push({
                                  type: 'offset',
                                  startTime: oc.startTime,
                                  sortTime: timeToMinutes(oc.startTime),
                                  element: (
                                    <div
                                      key={`offset-${idx}`}
                                      className="w-full text-left text-[9px] px-1.5 py-0.5 rounded border bg-purple-100 text-purple-800 border-purple-300"
                                      title={`Offset: ${oc.className}`}
                                    >
                                      <div className="font-medium truncate">
                                        🔄 {oc.subjectLevelId?.subjectId?.name || 'Offset'}
                                      </div>
                                      <div className="text-[8px] text-purple-600">
                                        {oc.startTime}-{oc.endTime}
                                      </div>
                                      <div className="text-[7px] text-purple-500 truncate">
                                        {oc.className}
                                      </div>
                                    </div>
                                  )
                                });
                              });
                              
                              // Sắp xếp theo thời gian bắt đầu
                              allItems.sort((a, b) => a.sortTime - b.sortTime);
                              
                              // Nếu có items, hiển thị chúng theo thứ tự
                              if (allItems.length > 0) {
                                return allItems.map(item => item.element);
                              }
                              
                              // Nếu không có items nhưng có work shift status
                              if (!hasFixedSchedules && workShift) {
                                return (
                                  <div 
                                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                                      workShift.isOnLeave
                                        ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                        : workShift.isAvailable 
                                        ? 'bg-green-100 text-green-800 border border-green-300' 
                                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                                    }`}
                                  >
                                    {workShift.isOnLeave ? '🏖️ Nghỉ' : workShift.isAvailable ? '✓ Rảnh' : '🔒 Bận'}
                                  </div>
                                );
                              }
                              
                              // Busy status khi có free slots nhưng work shift không available
                              if (showFreeSlots && workShift && !workShift.isAvailable && !workShift.isOnLeave) {
                                return (
                                  <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 border border-gray-300">
                                    🔒 Bận
                                  </div>
                                );
                              }
                              
                              return null;
                            })()}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ));
              })}
              {Object.keys(groupedByTeacher).length === 0 && (
                <tr>
                  <td colSpan={9} className="border p-8 text-center text-gray-500">
                    Không có lịch làm việc nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* List View - Group by Teacher */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {Object.entries(groupedByTeacher).map(([teacherId, data]) => {
            // Group slots by date
            const slotsByDate = {};
            Object.entries(data.slots).forEach(([slotKey, slot]) => {
              const date = slot.date;
              if (!slotsByDate[date]) {
                slotsByDate[date] = [];
              }
              slotsByDate[date].push(slot);
            });

            return (
              <div key={teacherId} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-600" />
                  {data.teacher?.name || 'Unknown'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(slotsByDate).map(([date, slots]) => (
                    <div key={date} className="border rounded-lg p-3">
                      <div className="font-medium text-sm text-gray-900 mb-2">
                        {new Date(date).toLocaleDateString('vi-VN', { 
                          weekday: 'short', 
                          day: '2-digit', 
                          month: '2-digit' 
                        })}
                      </div>
                      <div className="space-y-2">
                        {slots.map((slot, idx) => (
                          <div key={idx} className="space-y-1">
                            {/* Work Shift */}
                            {slot.workShift && (
                              <div 
                                className={`text-xs px-2 py-1 rounded ${
                                  slot.workShift.isAvailable 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {slot.shift.name} ({slot.shift.startTime}-{slot.shift.endTime})
                                {!slot.workShift.isAvailable && ' 🔒'}
                              </div>
                            )}
                            
                            {/* Fixed Schedules */}
                            {slot.fixedSchedules.map((fs, fsIdx) => (
                              <div 
                                key={fsIdx}
                                className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800"
                              >
                                📚 {fs.subjectId?.name || 'N/A'}
                                <br/>
                                <span className="text-[10px]">
                                  {fs.startTime}-{fs.endTime}
                                </span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.keys(groupedByTeacher).length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
              Không có lịch làm việc nào
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Thêm lịch làm việc</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn giáo viên *
                  </label>
                  <select
                    required
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">-- Chọn giáo viên --</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Từ ngày *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => {
                        setFormData({ ...formData, startDate: e.target.value });
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đến ngày *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      min={formData.startDate}
                      onChange={(e) => {
                        setFormData({ ...formData, endDate: e.target.value });
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700">
                      Có thể nhận lớp offset
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isOnLeave"
                      checked={formData.isOnLeave}
                      onChange={(e) => {
                        setFormData({ 
                          ...formData, 
                          isOnLeave: e.target.checked,
                          isAvailable: !e.target.checked // Xin nghỉ thì không rảnh
                        });
                      }}
                      className="w-4 h-4 text-orange-600 rounded"
                    />
                    <label htmlFor="isOnLeave" className="text-sm font-medium text-gray-700">
                      Xin nghỉ (không tính vào giờ dạy)
                    </label>
                  </div>
                </div>

                {dateRange.length > 0 && shifts.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">
                        Chọn ca làm việc * ({Object.values(selectedSlots).filter(Boolean).length} ca đã chọn)
                      </label>
                      <button
                        type="button"
                        onClick={handleSelectAllSlots}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {Object.keys(selectedSlots).length > 0 && Object.values(selectedSlots).every(Boolean) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border p-2 text-left font-medium text-gray-700">Ngày</th>
                            {shifts.map(shift => (
                              <th key={shift._id} className="border p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleSelectShiftColumn(shift._id)}
                                  className="w-full hover:bg-gray-100 rounded p-1"
                                >
                                  <div className="font-medium text-gray-900">{shift.name}</div>
                                  <div className="text-xs text-gray-500">{shift.startTime}-{shift.endTime}</div>
                                </button>
                              </th>
                            ))}
                            <th className="border p-2 text-center font-medium text-gray-700">Chọn tất cả</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dateRange.map(date => {
                            const dateObj = new Date(date);
                            const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                            const dayName = dayNames[dateObj.getDay()];
                            
                            return (
                              <tr key={date} className="hover:bg-gray-50">
                                <td className="border p-2 font-medium text-gray-900">
                                  <div>{date}</div>
                                  <div className="text-xs text-gray-500">{dayName}</div>
                                </td>
                                {shifts.map(shift => {
                                  const key = `${date}_${shift._id}`;
                                  return (
                                    <td key={key} className="border p-2 text-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedSlots[key] || false}
                                        onChange={() => handleSlotToggle(date, shift._id)}
                                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                                      />
                                    </td>
                                  );
                                })}
                                <td className="border p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectDateRow(date)}
                                    className="px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded"
                                  >
                                    Chọn hàng
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {dateRange.length === 0 && formData.startDate && formData.endDate && (
                  <p className="text-sm text-amber-600 text-center py-4">
                    ⚠️ Vui lòng chọn khoảng ngày hợp lệ
                  </p>
                )}

                {shifts.length === 0 && (
                  <p className="text-sm text-amber-600 text-center py-4">
                    ⚠️ Chưa có ca làm việc. Vui lòng chạy seed script.
                  </p>
                )}

                <div className="border-t pt-4">
                  <label className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                      className="w-4 h-4 mt-0.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">Trạng thái rảnh</span>
                      <p className="text-xs text-gray-600 mt-1">
                        ✓ Tích: Giáo viên rảnh, có thể phân công offset<br/>
                        ✗ Không tích: Giáo viên bận (nghỉ phép, họp, công tác...)
                      </p>
                    </div>
                  </label>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ teacherId: '', startDate: '', endDate: '', isAvailable: true });
                    setSelectedSlots({});
                    setDateRange([]);
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300"
                  disabled={Object.values(selectedSlots).filter(Boolean).length === 0}
                >
                  Thêm {Object.values(selectedSlots).filter(Boolean).length > 0 ? `${Object.values(selectedSlots).filter(Boolean).length} ca` : 'lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {showLeaveModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className={`text-xl font-semibold mb-4 ${selectedSchedule.isOnLeave ? 'text-blue-800' : 'text-orange-800'}`}>
              {selectedSchedule.isOnLeave ? '↩️ Phục hồi lịch dạy' : '🏖️ Xác nhận xin nghỉ'}
            </h3>
            
            {/* Schedule Info */}
            <div className={`rounded-lg p-4 border mb-4 ${
              selectedSchedule.isOnLeave ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
            }`}>
              <h4 className={`font-medium mb-2 ${selectedSchedule.isOnLeave ? 'text-blue-900' : 'text-orange-900'}`}>
                Thông tin lớp học:
              </h4>
              <div className={`text-sm space-y-1 ${selectedSchedule.isOnLeave ? 'text-blue-800' : 'text-orange-800'}`}>
                <p>📚 <strong>Môn:</strong> {selectedSchedule.fixedSchedule?.subjectId?.name || 'N/A'}</p>
                <p>👤 <strong>Giáo viên:</strong> {
                  allTeachersDetails.find(t => t._id === selectedSchedule.teacherId)?.name || 'Unknown'
                }</p>
                <p>📅 <strong>Ngày:</strong> {new Date(selectedSchedule.date).toLocaleDateString('vi-VN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p>⏰ <strong>Giờ:</strong> {selectedSchedule.fixedSchedule?.startTime} - {selectedSchedule.fixedSchedule?.endTime}</p>
                <p>🕐 <strong>Ca:</strong> {selectedSchedule.shift?.name} ({selectedSchedule.shift?.startTime}-{selectedSchedule.shift?.endTime})</p>
              </div>
            </div>

            {/* Warning/Info */}
            <div className={`rounded-lg p-3 mb-4 ${
              selectedSchedule.isOnLeave 
                ? 'bg-blue-50 border border-blue-200' 
                : 'bg-orange-50 border border-orange-200'
            }`}>
              <p className={`text-sm ${selectedSchedule.isOnLeave ? 'text-blue-800' : 'text-orange-800'}`}>
                {selectedSchedule.isOnLeave ? (
                  <>✅ Phục hồi lịch dạy này sẽ tính lại vào giờ dạy của bạn.</>
                ) : (
                  <>⚠️ Buổi học này sẽ không được tính vào giờ dạy của bạn. Hệ thống sẽ tự động tìm giáo viên thay thế nếu có.</>
                )}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowLeaveModal(false);
                  setSelectedSchedule(null);
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleLeaveSubmit}
                className={`flex-1 px-4 py-2 text-white rounded-lg ${
                  selectedSchedule.isOnLeave
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {selectedSchedule.isOnLeave ? 'Xác nhận phục hồi' : 'Xác nhận xin nghỉ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Modal */}
      {showQuickCreateModal && quickCreateData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              ➕ Tạo mới lịch dạy
            </h3>
            
            {/* Context Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">👤 Giáo viên:</span>
                  <span className="font-medium text-gray-900 ml-2">{quickCreateData.teacherName}</span>
                </div>
                <div>
                  <span className="text-gray-600">📅 Ngày:</span>
                  <span className="font-medium text-gray-900 ml-2">
                    {new Date(quickCreateData.date).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">🕐 Ca:</span>
                  <span className="font-medium text-gray-900 ml-2">
                    {quickCreateData.shift.name} ({quickCreateData.shift.startTime}-{quickCreateData.shift.endTime})
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                type="button"
                onClick={() => {
                  setShowOffsetClassForm(true);
                  // Pre-fill thời gian từ ca làm
                  setOffsetClassFormData(prev => ({
                    ...prev,
                    startTime: quickCreateData.shift.startTime,
                    endTime: quickCreateData.shift.endTime
                  }));
                }}
                className="p-6 border-2 border-purple-300 rounded-lg hover:bg-purple-50 transition-colors text-left group"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">🔄</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-purple-700">
                      Tạo lớp Offset
                    </h4>
                    <p className="text-sm text-gray-600">
                      Tạo lớp bù/dạy thay cho học sinh
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowFixedScheduleForm(true);
                  // Pre-fill thời gian từ ca làm
                  setFixedScheduleFormData(prev => ({
                    ...prev,
                    startTime: quickCreateData.shift.startTime,
                    endTime: quickCreateData.shift.endTime
                  }));
                }}
                className="p-6 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-left group"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">📚</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-700">
                      Thêm lịch cố định
                    </h4>
                    <p className="text-sm text-gray-600">
                      Thêm lịch dạy thường xuyên
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowQuickCreateModal(false);
                  setQuickCreateData(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Schedule Form Modal */}
      {showFixedScheduleForm && quickCreateData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-blue-900">
              📚 Thêm lịch cố định
            </h3>
            
            {/* Context Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">👤 Giáo viên:</span>
                  <span className="font-medium text-gray-900 ml-2">{quickCreateData.teacherName}</span>
                </div>
                <div>
                  <span className="text-gray-600">📅 Thứ trong tuần:</span>
                  <span className="font-medium text-gray-900 ml-2">
                    {['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][new Date(quickCreateData.date).getDay()]}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleFixedScheduleSubmit}>
              <div className="space-y-4">
                {/* Debug Info */}
                {subjects.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    ⚠️ Không có môn học nào. Vui lòng thêm môn học trước.
                  </div>
                )}
                
                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Môn học <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">({subjects.length} môn)</span>
                  </label>
                  <select
                    required
                    value={fixedScheduleFormData.subjectId}
                    onChange={(e) => setFixedScheduleFormData(prev => ({ ...prev, subjectId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn môn học --</option>
                    {subjects.map(subject => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lớp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 10A1, 11B2, ..."
                    value={fixedScheduleFormData.className}
                    onChange={(e) => setFixedScheduleFormData(prev => ({ ...prev, className: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giờ bắt đầu <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={fixedScheduleFormData.startTime}
                      onChange={(e) => setFixedScheduleFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Chọn giờ --</option>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return [
                          <option key={`${hour}:00`} value={`${hour}:00`}>{hour}:00</option>,
                          <option key={`${hour}:30`} value={`${hour}:30`}>{hour}:30</option>
                        ];
                      }).flat()}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giờ kết thúc <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={fixedScheduleFormData.endTime}
                      onChange={(e) => setFixedScheduleFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Chọn giờ --</option>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return [
                          <option key={`${hour}:00`} value={`${hour}:00`}>{hour}:00</option>,
                          <option key={`${hour}:30`} value={`${hour}:30`}>{hour}:30</option>
                        ];
                      }).flat()}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowFixedScheduleForm(false);
                    setFixedScheduleFormData({
                      subjectId: '',
                      startTime: '',
                      endTime: '',
                      dayOfWeek: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Thêm lịch cố định
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offset Class Form Modal */}
      {showOffsetClassForm && quickCreateData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-purple-900">
              🔄 Tạo lớp Offset
            </h3>
            
            {/* Context Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">👤 Giáo viên:</span>
                  <span className="font-medium text-gray-900 ml-2">{quickCreateData.teacherName}</span>
                </div>
                <div>
                  <span className="text-gray-600">📅 Ngày học:</span>
                  <span className="font-medium text-gray-900 ml-2">
                    {new Date(quickCreateData.date).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">🕐 Ca:</span>
                  <span className="font-medium text-gray-900 ml-2">
                    {quickCreateData.shift.name}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-purple-200">
                <p className="text-xs text-purple-700">
                  ✅ Lớp offset sẽ được phân công trực tiếp cho <strong>{quickCreateData.teacherName}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleOffsetClassSubmit}>
              <div className="space-y-4">
                {/* Debug Info */}
                {subjectLevels.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    ⚠️ Không có học phần nào. Vui lòng thêm môn học và học phần trước.
                  </div>
                )}
                
                {/* Subject Level Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Học phần <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">({subjectLevels.length} học phần)</span>
                  </label>
                  <select
                    required
                    value={offsetClassFormData.subjectLevelId}
                    onChange={(e) => setOffsetClassFormData(prev => ({ ...prev, subjectLevelId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Chọn học phần --</option>
                    {subjectLevels.map(level => (
                      <option key={level._id} value={level._id}>
                        {level.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã lớp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: TE-C-PA-711-2020BLG-0086"
                    value={offsetClassFormData.className}
                    onChange={(e) => setOffsetClassFormData(prev => ({ ...prev, className: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giờ bắt đầu <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={offsetClassFormData.startTime}
                      onChange={(e) => setOffsetClassFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Chọn giờ --</option>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return [
                          <option key={`${hour}:00`} value={`${hour}:00`}>{hour}:00</option>,
                          <option key={`${hour}:30`} value={`${hour}:30`}>{hour}:30</option>
                        ];
                      }).flat()}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giờ kết thúc <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={offsetClassFormData.endTime}
                      onChange={(e) => setOffsetClassFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Chọn giờ --</option>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return [
                          <option key={`${hour}:00`} value={`${hour}:00`}>{hour}:00</option>,
                          <option key={`${hour}:30`} value={`${hour}:30`}>{hour}:30</option>
                        ];
                      }).flat()}
                    </select>
                  </div>
                </div>

                {/* Meeting Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link meeting
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={offsetClassFormData.meetingLink}
                    onChange={(e) => setOffsetClassFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Nội dung cần lưu ý..."
                    value={offsetClassFormData.notes}
                    onChange={(e) => setOffsetClassFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowOffsetClassForm(false);
                    setOffsetClassFormData({
                      subjectLevelId: '',
                      className: '',
                      startTime: '',
                      endTime: '',
                      meetingLink: '',
                      notes: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Tạo lớp offset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
