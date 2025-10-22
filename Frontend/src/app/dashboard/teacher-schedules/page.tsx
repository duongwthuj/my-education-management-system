'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Stack,
  Typography,
  Card,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Divider
} from '@mui/material';
import { TeacherScheduleCalendar } from '@/components/schedules/teacher-schedule-calendar';
import { useSchedules } from '@/hooks/use-schedules';
import { useTeachers } from '@/hooks/use-teachers';
import { TeacherSchedule } from '@/types';

export default function TeacherSchedulePage() {
  const { schedules, loading: schedulesLoading, error: schedulesError } = useSchedules();
  const { teachers, loading: teachersLoading, error: teachersError } = useTeachers();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

  // Debug logging
  useMemo(() => {
    console.log('👨‍🏫 Teachers loaded:', teachers.length);
    teachers.forEach(t => console.log(`  - ${t.name}: ${t.id}`));
    console.log('📅 Schedules loaded:', schedules.length);
  }, [teachers, schedules]);

  const teacherScheduleData = useMemo(() => {
    if (!schedules.length || !teachers.length) {
      return {};
    }

    const teacherMap = new Map(teachers.map(t => [String(t.id), t]));
    const data: TeacherSchedule = {};

    let matchCount = 0;
    schedules.forEach((schedule) => {
      // Ensure teacherId is string
      const scheduleTeacherId = String(schedule.teacherId);
      const teacher = teacherMap.get(scheduleTeacherId);
      if (!teacher) return;
      
      matchCount++;
      const teacherName = teacher.name;
      if (!data[teacherName]) {
        data[teacherName] = [];
      }

      // Parse time slots
      const startTimeParts = schedule.startTime.split(':');
      const endTimeParts = schedule.endTime.split(':');
      const startHours = parseInt(startTimeParts[0], 10);
      const endHours = parseInt(endTimeParts[0], 10);

      // Determine period
      let period: 'morning' | 'afternoon' | 'evening' = 'morning';
      if (startHours >= 17) period = 'evening';
      else if (startHours >= 13) period = 'afternoon';

      // Create a unique date key from dayOfWeek
      const today = new Date();
      const dayMap: { [key: string]: number } = {
        'Chủ Nhật': 0,
        'Thứ 2': 1,
        'Thứ Ba': 2,
        'Thứ Tư': 3,
        'Thứ Năm': 4,
        'Thứ 6': 5,
        'Thứ Bảy': 6
      };
      
      const targetDay = dayMap[schedule.dayOfWeek] ?? 1;
      const currentDay = today.getDay();
      const diff = targetDay - currentDay;
      const date = new Date(today);
      date.setDate(date.getDate() + diff);
      const dateStr = date.toISOString().split('T')[0];

      // Find or create day entry
      let dayEntry = data[teacherName].find(d => d.date === dateStr);
      if (!dayEntry) {
        dayEntry = {
          date: dateStr,
          weekday: schedule.dayOfWeek,
          slots: []
        };
        data[teacherName].push(dayEntry);
      }

      dayEntry.slots.push({
        time: `${schedule.startTime} - ${schedule.endTime}`,
        status: 'available',
        period
      });
    });

    // Sort days by date and slots by time
    Object.values(data).forEach(days => {
      days.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      days.forEach(day => {
        day.slots.sort((a, b) => a.time.localeCompare(b.time));
      });
    });

    console.log(`✅ Matched ${matchCount} schedules to teachers. Result:`, Object.keys(data));
    return data;
  }, [schedules, teachers]);

  // Get filtered data for selected teacher (or all teachers if "all" is selected)
  const filteredData = useMemo(() => {
    if (!teachers.length) return {};
    
    // If "all" is selected or no selection, show all teachers
    if (!selectedTeacherId || selectedTeacherId === 'all') {
      return teacherScheduleData;
    }
    
    // Otherwise show only selected teacher
    const teacher = teachers.find(t => t.id === selectedTeacherId);
    if (!teacher) return {};

    return {
      [teacher.name]: teacherScheduleData[teacher.name] || []
    };
  }, [selectedTeacherId, teachers, teacherScheduleData]);

  const loading = schedulesLoading || teachersLoading;
  const error = schedulesError || teachersError;

  // Set default to show all teachers on first load
  useMemo(() => {
    if (!selectedTeacherId && teachers.length > 0) {
      setSelectedTeacherId('all');
    }
  }, [teachers, selectedTeacherId]);

  const handleTeacherChange = (event: SelectChangeEvent<string>) => {
    setSelectedTeacherId(event.target.value);
  };

  return (
    <>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={4}
            >
              <Stack spacing={1}>
                <Typography variant="h4">
                  Lịch làm việc giáo viên
                </Typography>
                <Typography
                  color="text.secondary"
                  variant="subtitle2"
                >
                  Xem lịch làm việc của từng giáo viên
                </Typography>
              </Stack>
            </Stack>

            <Card>
              <Box sx={{ p: 3 }}>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {/* Teacher Selection - Single Dropdown */}
                    <FormControl sx={{ mb: 3, minWidth: 300 }}>
                      <InputLabel>Chọn giáo viên</InputLabel>
                      <Select
                        value={selectedTeacherId}
                        onChange={handleTeacherChange}
                        label="Chọn giáo viên"
                      >
                        <MenuItem value="all">
                          <strong>📋 Tất cả giáo viên</strong>
                        </MenuItem>
                        {teachers.map((teacher) => (
                          <MenuItem key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Divider sx={{ my: 2 }} />

                    {/* Display schedules */}
                    {Object.keys(filteredData).length > 0 ? (
                      <TeacherScheduleCalendar scheduleData={filteredData} />
                    ) : (
                      <Alert severity="info">
                        Không có lịch làm việc nào
                      </Alert>
                    )}
                  </>
                )}
              </Box>
            </Card>
          </Stack>
        </Container>
      </Box>
    </>
  );
}