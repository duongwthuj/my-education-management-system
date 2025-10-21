'use client';

import {
  Box,
  Container,
  Stack,
  Typography,
  Card,
  CircularProgress,
  Alert
} from '@mui/material';
import { useMemo } from 'react';
import { TeacherScheduleCalendar } from '@/components/schedules/teacher-schedule-calendar';
import { useSchedules } from '@/hooks/use-schedules';
import { useTeachers } from '@/hooks/use-teachers';
import { TeacherSchedule } from '@/types';

export default function TeacherSchedulePage() {
  const { schedules, loading: schedulesLoading, error: schedulesError } = useSchedules();
  const { teachers, loading: teachersLoading, error: teachersError } = useTeachers();

  const teacherScheduleData = useMemo(() => {
    if (!schedules.length || !teachers.length) return {};

    const teacherMap = new Map(teachers.map(t => [t.id, t]));
    const data: TeacherSchedule = {};

    schedules.forEach((schedule) => {
      const teacher = teacherMap.get(schedule.teacherId);
      if (!teacher) return;

      const teacherName = teacher.name;
      if (!data[teacherName]) {
        data[teacherName] = [];
      }

      // Parse date and create day entry
      const date = new Date(schedule.startTime);
      const dateStr = date.toISOString().split('T')[0];
      const weekdayNum = date.getDay();
      const weekdayLabels = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const weekday = weekdayLabels[weekdayNum];

      // Find or create day entry
      let dayEntry = data[teacherName].find(d => d.date === dateStr);
      if (!dayEntry) {
        dayEntry = {
          date: dateStr,
          weekday,
          slots: []
        };
        data[teacherName].push(dayEntry);
      }

      // Add time slot
      const startTime = new Date(schedule.startTime);
      const endTime = new Date(schedule.endTime);
      const startHours = startTime.getHours();
      const endHours = endTime.getHours();

      let period = 'morning';
      if (startHours >= 17) period = 'evening';
      else if (startHours >= 13) period = 'afternoon';

      dayEntry.slots.push({
        time: `${String(startHours).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')} - ${String(endHours).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`,
        status: 'available',
        period: 'afternoon'
      });
    });

    // Sort days by date and slots by time
    Object.values(data).forEach(days => {
      days.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      days.forEach(day => {
        day.slots.sort((a, b) => a.time.localeCompare(b.time));
      });
    });

    return data;
  }, [schedules, teachers]);

  const loading = schedulesLoading || teachersLoading;
  const error = schedulesError || teachersError;

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
                  Xem và quản lý lịch làm việc của giáo viên
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
                  <TeacherScheduleCalendar scheduleData={teacherScheduleData} />
                )}
              </Box>
            </Card>
          </Stack>
        </Container>
      </Box>
    </>
  );
}