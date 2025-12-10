import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { scheduleAPI, teachersAPI, fixedScheduleLeaveAPI, offsetClassesAPI, subjectsAPI } from '../services/api';
import Button from '../components/ui/Button';
import ScheduleFilters from '../components/schedule/ScheduleFilters';
import ScheduleCalendar from '../components/schedule/ScheduleCalendar';
import ScheduleList from '../components/schedule/ScheduleList';
import { 
  CreateScheduleModal, 
  LeaveRequestModal, 
  QuickCreateModal, 
  OffsetClassModal, 
  FixedScheduleModal,
  // Import other modals if they were exported separately or handle them here if simple
} from '../components/schedule/ScheduleModals';
import { useNotification } from '../components/ui/NotificationProvider';

  // Helper functions
const toLocalISOString = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 10);
};

const getWeekDates = (startDate) => {
  const dates = [];
  const start = startDate ? new Date(startDate) : new Date();
  // If no startDate provided, find the start of current week (Sunday)
  if (!startDate) {
    const day = start.getDay();
    start.setDate(start.getDate() - day);
  }
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(toLocalISOString(date));
  }
  return dates;
};

const getCurrentWeekRange = () => {
  const curr = new Date();
  // Adjust to get Monday as first day if needed, but keeping existing logic structure
  // correcting timezone output
  const first = curr.getDate() - curr.getDay(); 
  const last = first + 6;

  const firstDay = new Date(curr.setDate(first));
  const lastDay = new Date(curr.setDate(last));

  return {
    start: toLocalISOString(firstDay),
    end: toLocalISOString(lastDay)
  };
};

const getDefaultViewRange = () => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 is Sunday
  
  // Calculate days remaining until Sunday
  // If today is Sunday (0), we want to show just today (dist=0) or maybe full next week?
  // Treat 0 as 7 to ensure we target the *upcoming* Sunday of this week context
  const dayIndex = currentDay === 0 ? 7 : currentDay;
  const daysUntilSunday = 7 - dayIndex;
  
  const end = new Date(today);
  end.setDate(today.getDate() + daysUntilSunday);
  
  return {
    start: toLocalISOString(today),
    end: toLocalISOString(end)
  };
};

const Schedule = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [workShifts, setWorkShifts] = useState([]);
  const [fixedSchedules, setFixedSchedules] = useState([]);
  const [fixedScheduleLeaves, setFixedScheduleLeaves] = useState([]);
  const [offsetClasses, setOffsetClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectLevels, setSubjectLevels] = useState([]);
  const [allTeachersDetails, setAllTeachersDetails] = useState([]);

  // Filter states
  const defaultRange = getDefaultViewRange();
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterStartDate, setFilterStartDate] = useState(defaultRange.start);
  const [filterEndDate, setFilterEndDate] = useState(defaultRange.end);
  const [filterTimePeriod, setFilterTimePeriod] = useState(''); // morning, afternoon, evening, night
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [showOffsetClassForm, setShowOffsetClassForm] = useState(false);
  const [showFixedScheduleForm, setShowFixedScheduleForm] = useState(false);
  const [showCancelOffsetModal, setShowCancelOffsetModal] = useState(false);
  const [showEditOffsetModal, setShowEditOffsetModal] = useState(false);
  const [showDeleteOffsetModal, setShowDeleteOffsetModal] = useState(false);

  // Selection states
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [quickCreateData, setQuickCreateData] = useState(null);
  const [offsetToCancel, setOffsetToCancel] = useState(null);
  const [offsetToEdit, setOffsetToEdit] = useState(null);
  const [offsetToDelete, setOffsetToDelete] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    teacherId: '',
    startDate: '',
    endDate: '',
    isAvailable: true,
    isOnLeave: false
  });
  const [selectedSlots, setSelectedSlots] = useState({});
  const [dateRange, setDateRange] = useState([]);

  const [offsetClassFormData, setOffsetClassFormData] = useState({
    subjectLevelId: '',
    className: '',
    startTime: '',
    endTime: '',
    meetingLink: '',
    notes: '',
  });

  const [fixedScheduleFormData, setFixedScheduleFormData] = useState({
    subjectId: '',
    className: '',
    startTime: '',
    endTime: '',
    dayOfWeek: '',
    startDate: '',
    endDate: '',
  });

  const [editOffsetForm, setEditOffsetForm] = useState({
    assignedTeacherId: '',
    scheduledDate: '',
    startTime: '',
    endTime: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        shiftsRes, 
        teachersRes, 
        workShiftsRes, 
        leavesRes, 
        offsetRes,
        subjectsRes
      ] = await Promise.all([
        scheduleAPI.getAllShifts(),
        teachersAPI.getAll({ limit: 1000 }),
        scheduleAPI.getWorkShifts(),
        fixedScheduleLeaveAPI.getAll(),
        offsetClassesAPI.getAll({ limit: 1000 }),
        subjectsAPI.getAll()
      ]);

      setShifts(shiftsRes.data);
      setTeachers(teachersRes.data);
      setWorkShifts(workShiftsRes.data);
      setFixedScheduleLeaves(leavesRes.data);
      setOffsetClasses(offsetRes.data);
      setSubjects(subjectsRes.data);

      // Fetch full details for teachers to get their fixed schedules
      const teacherDetailsPromises = teachersRes.data.map(t => teachersAPI.getDetails(t._id));
      const teacherDetailsRes = await Promise.all(teacherDetailsPromises);
      setAllTeachersDetails(teacherDetailsRes.map(res => res.data));
      
      // Extract all fixed schedules from teacher details
      const allFixedSchedules = [];
      teacherDetailsRes.forEach(res => {
        const teacher = res.data;
        if (teacher.fixedSchedules && teacher.fixedSchedules.length > 0) {
          console.log(`Teacher ${teacher.name} has ${teacher.fixedSchedules.length} fixed schedules:`, teacher.fixedSchedules);
          teacher.fixedSchedules.forEach(fs => {
            allFixedSchedules.push({
              ...fs,
              teacherId: teacher._id
            });
          });
        }
      });
      console.log('Total fixed schedules extracted:', allFixedSchedules.length, allFixedSchedules);
      setFixedSchedules(allFixedSchedules);

    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Lỗi khi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch subject levels when modal opens
  useEffect(() => {
    const fetchSubjectLevels = async () => {
      try {
        const res = await subjectsAPI.getAllLevels();
        setSubjectLevels(res.data || []);
      } catch (error) {
        console.error('Error fetching subject levels:', error);
      }
    };

    if (showOffsetClassForm) {
      fetchSubjectLevels();
    }
  }, [showOffsetClassForm]);

  // Handle date range calculation for Create Schedule Modal
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const dates = [];
      let curr = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      while (curr <= end) {
        dates.push(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 1);
      }
      setDateRange(dates);
      
      // Reset selected slots when date range changes
      setSelectedSlots({});
    } else {
      setDateRange([]);
    }
  }, [formData.startDate, formData.endDate]);

  // Handlers for selection
  const handleSlotToggle = (date, shiftId) => {
    const key = `${date}_${shiftId}`;
    setSelectedSlots(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectAllSlots = () => {
    const allSelected = Object.values(selectedSlots).length > 0 && Object.values(selectedSlots).every(Boolean);
    const newSlots = {};
    
    dateRange.forEach(date => {
      shifts.forEach(shift => {
        newSlots[`${date}_${shift._id}`] = !allSelected;
      });
    });
    
    setSelectedSlots(newSlots);
  };

  const handleSelectDateRow = (date) => {
    const newSlots = { ...selectedSlots };
    const allInRowSelected = shifts.every(shift => newSlots[`${date}_${shift._id}`]);
    
    shifts.forEach(shift => {
      newSlots[`${date}_${shift._id}`] = !allInRowSelected;
    });
    
    setSelectedSlots(newSlots);
  };

  const handleSelectShiftColumn = (shiftId) => {
    const newSlots = { ...selectedSlots };
    const allInColSelected = dateRange.every(date => newSlots[`${date}_${shiftId}`]);
    
    dateRange.forEach(date => {
      newSlots[`${date}_${shiftId}`] = !allInColSelected;
    });
    
    setSelectedSlots(newSlots);
  };

  // Form Submissions
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedKeys = Object.entries(selectedSlots)
        .filter(([_, isSelected]) => isSelected)
        .map(([key]) => key);

      if (selectedKeys.length === 0) {
        showNotification('Vui lòng chọn ít nhất một ca làm việc', 'warning');
        return;
      }

      const promises = selectedKeys.map(key => {
        const [date, shiftId] = key.split('_');
        return scheduleAPI.createWorkShift({
          teacherId: formData.teacherId,
          date,
          shiftId,
          isAvailable: formData.isAvailable,
          isOnLeave: formData.isOnLeave
        });
      });

      await Promise.all(promises);
      showNotification('Thêm lịch làm việc thành công', 'success');
      setShowModal(false);
      setFormData({ teacherId: '', startDate: '', endDate: '', isAvailable: true, isOnLeave: false });
      setSelectedSlots({});
      loadData();
    } catch (error) {
      console.error('Error creating work shifts:', error);
      showNotification('Lỗi khi thêm lịch làm việc', 'error');
    }
  };

  const handleLeaveSubmit = async (substituteTeacherId = null) => {
    try {
      if (selectedSchedule.isOnLeave) {
        // Restore schedule (delete leave record)
        // Restore schedule (delete leave record)
        const leaveRecord = fixedScheduleLeaves.find(leave => {
          const leaveScheduleId = typeof leave.fixedScheduleId === 'object' ? leave.fixedScheduleId?._id : leave.fixedScheduleId;
          const leaveDate = new Date(leave.date).toISOString().split('T')[0];
          return leaveScheduleId === selectedSchedule.fixedSchedule._id && leaveDate === selectedSchedule.date;
        });

        if (leaveRecord) {
          // Fix: Pass ID directly
          await fixedScheduleLeaveAPI.delete(leaveRecord._id);
          showNotification('Đã phục hồi lịch dạy', 'success');
        } else {
          showNotification('Không tìm thấy dữ liệu nghỉ để phục hồi', 'error');
        }
      } else {
        // Create leave request
        await fixedScheduleLeaveAPI.create({
          teacherId: selectedSchedule.teacherId,
          fixedScheduleId: selectedSchedule.fixedSchedule._id,
          date: selectedSchedule.date,
          reason: 'Giáo viên xin nghỉ',
          substituteTeacherId: substituteTeacherId || null
        });
        showNotification('Đã xác nhận nghỉ', 'success');
      }
      
      setShowLeaveModal(false);
      setSelectedSchedule(null);
      loadData();
    } catch (error) {
      console.error('Error handling leave:', error);
      showNotification('Có lỗi xảy ra', 'error');
    }
  };

  const handleOffsetClassSubmit = async (e) => {
    e.preventDefault();
    try {
      await offsetClassesAPI.create({
        ...offsetClassFormData,
        originalClassId: null, // New class, not replacement
        assignedTeacherId: quickCreateData.teacherId,
        scheduledDate: quickCreateData.date,
        status: 'assigned'
      });
      
      showNotification('Tạo lớp offset thành công', 'success');
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
      loadData();
    } catch (error) {
      console.error('Error creating offset class:', error);
      showNotification('Lỗi khi tạo lớp offset', 'error');
    }
  };

  const handleFixedScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(quickCreateData.date).getDay()];
      
      await teachersAPI.addSchedule(quickCreateData.teacherId, {
        ...fixedScheduleFormData,
        dayOfWeek
      });
      
      showNotification('Thêm lịch cố định thành công', 'success');
      setShowFixedScheduleForm(false);
      setShowQuickCreateModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating fixed schedule:', error);
      showNotification('Lỗi khi thêm lịch cố định', 'error');
    }
  };

  // Data processing for views
  // Generate dates based on the selected date range
  const getDateRange = (startDate, endDate) => {
    const dates = [];
    if (!startDate || !endDate) return dates;
    
    let current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };
  
  const weekDates = getDateRange(filterStartDate, filterEndDate);
  
  // Helper: Check if a time falls within a period
  const isTimeInPeriod = (time, period) => {
    if (!period) return true; // No filter applied
    
    const [hours] = time.split(':').map(Number);
    
    switch (period) {
      case 'morning':
        return hours >= 8 && hours < 12;
      case 'afternoon':
        return hours >= 13 && hours < 17;
      case 'evening':
        return hours >= 17 && hours < 21;
      default:
        return true;
    }
  };
  
  // Filter shifts based on time period
  const shiftsToDisplay = filterTimePeriod 
    ? shifts.filter(shift => isTimeInPeriod(shift.startTime, filterTimePeriod))
    : shifts;
  
  // Filter data
  const filteredWorkShifts = workShifts.filter(ws => {
    const wsDate = new Date(ws.date).toISOString().split('T')[0];
    const inDateRange = (!filterStartDate || wsDate >= filterStartDate) && 
                        (!filterEndDate || wsDate <= filterEndDate);
    const matchTeacher = !filterTeacher || ws.teacherId?._id === filterTeacher || ws.teacherId === filterTeacher;
    
    // Check if work shift's shift matches the time period filter
    const matchTimePeriod = !filterTimePeriod || 
      (ws.shiftId && isTimeInPeriod(ws.shiftId.startTime, filterTimePeriod));
    
    return inDateRange && matchTeacher && matchTimePeriod;
  });

  // Group by teacher
  const groupedByTeacher = {};
  
  // Initialize for filtered teachers
  const teachersToDisplay = filterTeacher 
    ? teachers.filter(t => t._id === filterTeacher)
    : teachers;

  teachersToDisplay.forEach(teacher => {
    groupedByTeacher[teacher._id] = {
      teacher,
      slots: {}
    };
  });

  // Fill slots with work shifts
  filteredWorkShifts.forEach(ws => {
    const teacherId = ws.teacherId?._id || ws.teacherId;
    if (!groupedByTeacher[teacherId]) return;

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

  // Add fixed schedules
  if (filterStartDate && filterEndDate) {
    console.log('Processing fixed schedules for dates:', weekDates);
    console.log('Total fixed schedules available:', fixedSchedules.length);
    
    weekDates.forEach(date => {
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(date).getDay()];
      
      teachersToDisplay.forEach(teacher => {
        // Find fixed schedules for this teacher on this day
        const teacherFixedSchedules = fixedSchedules.filter(fs => 
          (fs.teacherId?._id === teacher._id || fs.teacherId === teacher._id) &&
          fs.dayOfWeek === dayOfWeek &&
          new Date(fs.startDate) <= new Date(date) &&
          (!fs.endDate || new Date(fs.endDate) >= new Date(date))
        );

        if (teacherFixedSchedules.length > 0) {
          console.log(`Found ${teacherFixedSchedules.length} fixed schedules for ${teacher.name} on ${dayOfWeek} (${date}):`, teacherFixedSchedules);
          
          shiftsToDisplay.forEach(shift => {
            const slotKey = `${date}_${shift._id}`;
            
            // Filter schedules that start in this shift (not overlap)
            const schedulesInShift = teacherFixedSchedules.filter(fs => {
              // Convert times to minutes for accurate comparison
              const timeToMinutes = (timeStr) => {
                const [hours, minutes] = timeStr.split(':').map(Number);
                return hours * 60 + minutes;
              };
              
              const fsStartMinutes = timeToMinutes(fs.startTime);
              const shiftStartMinutes = timeToMinutes(shift.startTime);
              const shiftEndMinutes = timeToMinutes(shift.endTime);
              
              // Only check if the schedule STARTS within this shift
              return fsStartMinutes >= shiftStartMinutes && fsStartMinutes < shiftEndMinutes;
            });

            if (schedulesInShift.length > 0) {
              console.log(`Adding ${schedulesInShift.length} schedules to ${teacher.name}'s ${shift.name} shift on ${date}`);
              if (!groupedByTeacher[teacher._id].slots[slotKey]) {
                groupedByTeacher[teacher._id].slots[slotKey] = {
                  date: date,
                  shift: shift,
                  workShift: null,
                  fixedSchedules: []
                };
              }
              // Merge unique fixed schedules
              const existingIds = new Set(groupedByTeacher[teacher._id].slots[slotKey].fixedSchedules.map(fs => fs._id));
              schedulesInShift.forEach(fs => {
                if (!existingIds.has(fs._id)) {
                  groupedByTeacher[teacher._id].slots[slotKey].fixedSchedules.push(fs);
                }
              });
            }
          });
        }
      });
    });
  }

  // Navigation handlers
  const handlePrevWeek = () => {
    const start = new Date(filterStartDate);
    start.setDate(start.getDate() - 7);
    const end = new Date(filterEndDate);
    end.setDate(end.getDate() - 7);
    setFilterStartDate(start.toISOString().split('T')[0]);
    setFilterEndDate(end.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const start = new Date(filterStartDate);
    start.setDate(start.getDate() + 7);
    const end = new Date(filterEndDate);
    end.setDate(end.getDate() + 7);
    setFilterStartDate(start.toISOString().split('T')[0]);
    setFilterEndDate(end.toISOString().split('T')[0]);
  };

  const handleCurrentWeek = () => {
    const week = getDefaultViewRange();
    setFilterStartDate(week.start);
    setFilterEndDate(week.end);
  };

  // Interaction handlers
  const handleSlotClick = (teacherId, teacherName, date, shift) => {
    setQuickCreateData({
      teacherId,
      teacherName,
      date,
      shift
    });
    setShowQuickCreateModal(true);
  };

  const handleScheduleClick = (teacherId, date, shift, fixedSchedule, isOnLeave) => {
    setSelectedSchedule({
      teacherId,
      date,
      shift,
      fixedSchedule,
      isOnLeave
    });
    // Reset substitute teacher selection if any (though usually managed in modal)
    setShowLeaveModal(true);
  };

  // Offset class handlers
  const handleEditOffset = (offset) => {
    setOffsetToEdit(offset);
    setEditOffsetForm({
      assignedTeacherId: typeof offset.assignedTeacherId === 'object' ? offset.assignedTeacherId._id : offset.assignedTeacherId,
      scheduledDate: new Date(offset.scheduledDate).toISOString().split('T')[0],
      startTime: offset.startTime,
      endTime: offset.endTime
    });
    setShowEditOffsetModal(true);
  };

  const handleCancelOffset = (offset) => {
    setOffsetToCancel(offset);
    setShowCancelOffsetModal(true);
  };

  const handleDeleteOffset = (offset) => {
    setOffsetToDelete(offset);
    setShowDeleteOffsetModal(true);
  };

  const handleCancelOffsetSubmit = async () => {
    try {
      await offsetClassesAPI.cancel(offsetToCancel._id, { reason: cancelReason });
      showNotification('Đã hủy lớp offset', 'success');
      setShowCancelOffsetModal(false);
      setOffsetToCancel(null);
      setCancelReason('');
      loadData();
    } catch (error) {
      console.error('Error cancelling offset:', error);
      showNotification('Lỗi khi hủy lớp offset', 'error');
    }
  };

  const handleEditOffsetSubmit = async (e) => {
    e.preventDefault();
    try {
      const updates = {};
      if (editOffsetForm.assignedTeacherId) updates.assignedTeacherId = editOffsetForm.assignedTeacherId;
      if (editOffsetForm.scheduledDate) updates.scheduledDate = editOffsetForm.scheduledDate;
      if (editOffsetForm.startTime) updates.startTime = editOffsetForm.startTime;
      if (editOffsetForm.endTime) updates.endTime = editOffsetForm.endTime;

      await offsetClassesAPI.update(offsetToEdit._id, updates);
      showNotification('Cập nhật lớp offset thành công', 'success');
      setShowEditOffsetModal(false);
      setOffsetToEdit(null);
      loadData();
    } catch (error) {
      console.error('Error updating offset:', error);
      showNotification('Lỗi khi cập nhật lớp offset', 'error');
    }
  };

  const handleDeleteOffsetSubmit = async () => {
    try {
      await offsetClassesAPI.delete(offsetToDelete._id);
      showNotification('Đã xóa lớp offset', 'success');
      setShowDeleteOffsetModal(false);
      setOffsetToDelete(null);
      loadData();
    } catch (error) {
      console.error('Error deleting offset:', error);
      showNotification('Lỗi khi xóa lớp offset', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Quản lý Lịch làm việc</h1>
          <p className="text-secondary-500 mt-1">Quản lý lịch dạy, lịch cố định và phân công giáo viên</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Thêm lịch làm việc
        </Button>
      </div>

      <ScheduleFilters
        filterTeacher={filterTeacher}
        setFilterTeacher={setFilterTeacher}
        teachers={teachers}
        filterStartDate={filterStartDate}
        setFilterStartDate={setFilterStartDate}
        filterEndDate={filterEndDate}
        setFilterEndDate={setFilterEndDate}
        filterTimePeriod={filterTimePeriod}
        setFilterTimePeriod={setFilterTimePeriod}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onCurrentWeekClick={handleCurrentWeek}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
      />

      {viewMode === 'calendar' && (
        <ScheduleCalendar
          weekDates={weekDates}
          shifts={shiftsToDisplay}
          groupedByTeacher={groupedByTeacher}
          offsetClasses={offsetClasses}
          fixedScheduleLeaves={fixedScheduleLeaves}
          allTeachersDetails={allTeachersDetails}
          onSlotClick={handleSlotClick}
          onScheduleClick={handleScheduleClick}
          onEditOffset={handleEditOffset}
          onCancelOffset={handleCancelOffset}
          onDeleteOffset={handleDeleteOffset}
        />
      )}

      {viewMode === 'list' && (
        <ScheduleList groupedByTeacher={groupedByTeacher} />
      )}

      {/* Modals */}
      <CreateScheduleModal
        show={showModal}
        onClose={() => setShowModal(false)}
        formData={formData}
        setFormData={setFormData}
        teachers={teachers}
        dateRange={dateRange}
        shifts={shifts}
        selectedSlots={selectedSlots}
        handleSlotToggle={handleSlotToggle}
        handleSelectAllSlots={handleSelectAllSlots}
        handleSelectDateRow={handleSelectDateRow}
        handleSelectShiftColumn={handleSelectShiftColumn}
        handleSubmit={handleSubmit}
      />

      <LeaveRequestModal
        show={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        selectedSchedule={selectedSchedule}
        handleLeaveSubmit={handleLeaveSubmit}
        teachers={teachers}
      />

      <QuickCreateModal
        show={showQuickCreateModal}
        onClose={() => setShowQuickCreateModal(false)}
        data={quickCreateData}
        onOpenOffsetForm={() => setShowOffsetClassForm(true)}
        onOpenFixedForm={() => setShowFixedScheduleForm(true)}
      />

      <OffsetClassModal
        show={showOffsetClassForm}
        onClose={() => setShowOffsetClassForm(false)}
        formData={offsetClassFormData}
        setFormData={setOffsetClassFormData}
        subjectLevels={subjectLevels}
        handleSubmit={handleOffsetClassSubmit}
        quickCreateData={quickCreateData}
      />

      <FixedScheduleModal
        show={showFixedScheduleForm}
        onClose={() => setShowFixedScheduleForm(false)}
        formData={fixedScheduleFormData}
        setFormData={setFixedScheduleFormData}
        subjects={subjects}
        handleSubmit={handleFixedScheduleSubmit}
        quickCreateData={quickCreateData}
      />

      {/* Cancel Offset Modal (Simple, so keeping inline or could move to ScheduleModals if reused) */}
      {showCancelOffsetModal && (
        <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md animate-scale-up">
            <h3 className="text-xl font-bold mb-4 text-warning-600">Hủy lớp offset</h3>
            <div className="space-y-4">
              <p className="text-secondary-700">Bạn có chắc chắn muốn hủy lớp offset này không?</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy..."
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-warning-500/20 focus:border-warning-500"
                rows={3}
                required
              />
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowCancelOffsetModal(false)} className="flex-1">Hủy</Button>
                <Button onClick={handleCancelOffsetSubmit} className="flex-1 bg-warning-600 hover:bg-warning-700 border-transparent text-white">Xác nhận hủy</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Offset Modal */}
      {showDeleteOffsetModal && (
        <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md animate-scale-up">
            <h3 className="text-xl font-bold mb-4 text-danger-600">Xóa lớp offset</h3>
            <p className="text-secondary-700 mb-6">Bạn có chắc chắn muốn xóa lớp offset này không? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteOffsetModal(false)} className="flex-1">Hủy</Button>
              <Button onClick={handleDeleteOffsetSubmit} className="flex-1 bg-danger-600 hover:bg-danger-700 border-transparent text-white">Xóa vĩnh viễn</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Offset Modal - Simplified for brevity, ideally move to ScheduleModals */}
      {showEditOffsetModal && (
        <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md animate-scale-up">
            <h3 className="text-xl font-bold mb-4 text-primary-600">Chỉnh sửa lớp offset</h3>
            <form onSubmit={handleEditOffsetSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Giáo viên</label>
                <select
                  value={editOffsetForm.assignedTeacherId}
                  onChange={(e) => setEditOffsetForm({ ...editOffsetForm, assignedTeacherId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- Giữ nguyên --</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Ngày</label>
                <input
                  type="date"
                  value={editOffsetForm.scheduledDate}
                  onChange={(e) => setEditOffsetForm({ ...editOffsetForm, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Bắt đầu</label>
                  <input
                    type="time"
                    value={editOffsetForm.startTime}
                    onChange={(e) => setEditOffsetForm({ ...editOffsetForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Kết thúc</label>
                  <input
                    type="time"
                    value={editOffsetForm.endTime}
                    onChange={(e) => setEditOffsetForm({ ...editOffsetForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowEditOffsetModal(false)} className="flex-1">Hủy</Button>
                <Button type="submit" className="flex-1">Cập nhật</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Schedule;
