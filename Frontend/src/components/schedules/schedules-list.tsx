'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Container,
  Stack,
  Typography,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent
} from '@mui/material';
import { Plus } from '@phosphor-icons/react';
import { ScheduleCalendar } from './schedule-calendar';
import { ScheduleTable } from './schedule-table';
import { Schedule } from '@/types';
import { useSchedules } from '@/hooks/use-schedules';
import { useTeachers } from '@/hooks/use-teachers';
import { useSubjects } from '@/hooks/use-subjects';
import { CircularProgress, Alert } from '@mui/material';

const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

export function SchedulesList() {
  const [view, setView] = useState(0);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const { schedules, loading, error, refetch } = useSchedules();
  const { teachers } = useTeachers();
  const { subjects } = useSubjects();
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);

  // Xử lý lọc lịch dạy
  useEffect(() => {
    let filtered = [...schedules];
    
    // Lọc theo giáo viên
    if (selectedTeacher !== 'all') {
      filtered = filtered.filter(schedule => schedule.teacherId === selectedTeacher);
    }
    
    // Lọc theo ngày
    if (selectedDay !== 'all') {
      filtered = filtered.filter(schedule => schedule.dayOfWeek === selectedDay);
    }
    
    setFilteredSchedules(filtered);
  }, [selectedTeacher, selectedDay, schedules]);

  const handleViewChange = (event: React.SyntheticEvent, newValue: number) => {
    setView(newValue);
  };

  const handleTeacherChange = (event: SelectChangeEvent) => {
    setSelectedTeacher(event.target.value);
  };

  const handleDayChange = (event: SelectChangeEvent) => {
    setSelectedDay(event.target.value);
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
            {error && (
              <Alert severity="error" onClose={refetch}>{error}</Alert>
            )}
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={4}
            >
              <Stack spacing={1}>
                <Typography variant="h4">
                  Lịch làm việc
                </Typography>
                <Stack
                  alignItems="center"
                  direction="row"
                  spacing={1}
                >
                  <Typography
                    color="text.secondary"
                    variant="subtitle2"
                  >
                    Tổng số lịch:
                  </Typography>
                  <Typography
                    color="text.primary"
                    variant="subtitle1"
                  >
                    {loading ? '...' : filteredSchedules.length}
                  </Typography>
                </Stack>
              </Stack>
              <div>
                <Button
                  startIcon={<Plus fontSize="var(--icon-fontSize-md)" />}
                  variant="contained"
                  disabled={loading}
                >
                  Thêm lịch
                </Button>
              </div>
            </Stack>

            <Card>
              <Tabs
                value={view}
                onChange={handleViewChange}
                sx={{ px: 3, pt: 2 }}
              >
                <Tab label="Dạng bảng" />
                <Tab label="Dạng lịch" />
              </Tabs>

              <Box sx={{ p: 3 }}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                  mb={3}
                >
                  <FormControl fullWidth sx={{ maxWidth: { md: 240 } }}>
                    <InputLabel>Giáo viên</InputLabel>
                    <Select
                      value={selectedTeacher}
                      label="Giáo viên"
                      onChange={handleTeacherChange}
                    >
                      <MenuItem value="all">Tất cả giáo viên</MenuItem>
                      {teachers.map((teacher) => (
                        <MenuItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth sx={{ maxWidth: { md: 240 } }}>
                    <InputLabel>Ngày trong tuần</InputLabel>
                    <Select
                      value={selectedDay}
                      label="Ngày trong tuần"
                      onChange={handleDayChange}
                    >
                      <MenuItem value="all">Tất cả các ngày</MenuItem>
                      {days.map((day) => (
                        <MenuItem key={day} value={day}>
                          {day}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                  </Box>
                ) : view === 0 ? (
                  <ScheduleTable 
                    schedules={filteredSchedules}
                    teacherMap={teachers.reduce((acc, t) => { acc[t.id] = { name: t.name, avatar: t.avatar }; return acc; }, {} as Record<string, { name: string; avatar?: string }>)}
                    subjectMap={subjects.reduce((acc, s) => { acc[s.id] = { name: s.name, code: s.code }; return acc; }, {} as Record<string, { name: string; code?: string }>)}
                  />
                ) : (
                  <ScheduleCalendar schedules={filteredSchedules} />
                )}
              </Box>
            </Card>
          </Stack>
        </Container>
      </Box>
    </>
  );
}