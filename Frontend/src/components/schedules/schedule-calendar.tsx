'use client';

import { useMemo, Fragment, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  Tooltip,
  Avatar,
  ButtonGroup,
  Button,
  IconButton,
  useTheme,
  alpha,
  useMediaQuery
} from '@mui/material';
import { Grid } from '@/components/common/grid';
import { Schedule } from '@/types';
import { ArrowLeft, ArrowRight, Clock, MapPin, Info } from '@phosphor-icons/react';

const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const timeSlots = [
  { start: '07:00', end: '09:00' },
  { start: '09:00', end: '11:00' },
  { start: '13:00', end: '15:00' },
  { start: '15:00', end: '17:00' },
  { start: '17:30', end: '19:30' }
];

const statusMap = {
  'scheduled': { color: 'info', label: 'Đã lên lịch' },
  'in-progress': { color: 'warning', label: 'Đang diễn ra' },
  'completed': { color: 'success', label: 'Đã hoàn thành' },
  'cancelled': { color: 'error', label: 'Đã hủy' }
};

// Tạo bảng màu cho các môn học
const generateSubjectColor = (id: string) => {
  const colors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', 
    '#3F51B5', '#E91E63', '#009688', '#673AB7',
    '#00BCD4', '#FFC107', '#795548', '#607D8B'
  ];
  
  // Dùng id để lấy một màu cố định cho từng môn học
  const colorIndex = parseInt(id.replace(/[^0-9]/g, ''), 10) % colors.length;
  return colors[colorIndex];
};

interface ScheduleCalendarProps {
  schedules: Schedule[];
  teacherMap?: Record<string, { name: string; avatar?: string }>;
  subjectMap?: Record<string, { name: string; code?: string }>;
}

export function ScheduleCalendar({ schedules, teacherMap = {}, subjectMap = {} }: ScheduleCalendarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentWeek, setCurrentWeek] = useState(0); // 0 = tuần hiện tại
  
  // Lấy chi tiết lịch dạy với thông tin màu sắc
  const scheduleDetails = useMemo(() => {
    return schedules.map(schedule => {
      const teacher = teacherMap[schedule.teacherId];
      const subject = subjectMap[schedule.subjectId];
      const subjectColor = subject ? generateSubjectColor(schedule.subjectId) : theme.palette.grey[500];
      
      return {
        ...schedule,
        teacherName: teacher?.name || 'Chưa phân công',
        subjectName: subject?.name || 'Không xác định',
        subjectCode: subject?.code || '',
        color: subjectColor
      };
    });
  }, [schedules, theme.palette.grey]);

  // Xử lý chuyển tuần
  const handlePreviousWeek = () => setCurrentWeek(prev => prev - 1);
  const handleNextWeek = () => setCurrentWeek(prev => prev + 1);
  const handleCurrentWeek = () => setCurrentWeek(0);
  
  // Hiển thị thông tin tuần
  const weekDisplay = useMemo(() => {
    if (currentWeek === 0) return 'Tuần hiện tại';
    if (currentWeek < 0) return `${Math.abs(currentWeek)} tuần trước`;
    return `${currentWeek} tuần tới`;
  }, [currentWeek]);

  // Render từng ô lịch
  const renderScheduleItem = (day: string, timeSlot: { start: string, end: string }) => {
    const matchingSchedules = scheduleDetails.filter(schedule => 
      schedule.dayOfWeek === day && 
      schedule.startTime === timeSlot.start && 
      schedule.endTime === timeSlot.end
    );

    if (matchingSchedules.length === 0) {
      return (
        <Box 
          sx={{ 
            height: '100%', 
            minHeight: 80,
            borderRadius: 1,
            border: '1px dashed',
            borderColor: 'divider',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'action.hover',
              cursor: 'pointer'
            }
          }} 
        />
      );
    }

    return (
      <>
        {matchingSchedules.map(schedule => (
          <Tooltip
            key={schedule.id}
            title={
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {schedule.subjectName} ({schedule.subjectCode})
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 20, height: 20 }} />
                    <Typography variant="body2">{schedule.teacherName}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Clock size={16} />
                    <Typography variant="body2">
                      {schedule.startTime} - {schedule.endTime}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <MapPin size={16} />
                    <Typography variant="body2">Phòng {schedule.room}</Typography>
                  </Stack>
                  <Chip
                    label={statusMap[schedule.status].label}
                    color={statusMap[schedule.status].color as 'success' | 'warning' | 'error' | 'info'}
                    size="small"
                  />
                </Stack>
              </Box>
            }
            arrow
            placement="top"
          >
            <Paper
              sx={{
                p: 1,
                mb: matchingSchedules.length > 1 ? 1 : 0,
                bgcolor: schedule.status === 'cancelled' 
                  ? alpha(theme.palette.error.light, 0.8)
                  : alpha(schedule.color, 0.15),
                borderLeft: `4px solid ${schedule.color}`,
                boxShadow: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: 2,
                  bgcolor: schedule.status === 'cancelled' 
                    ? alpha(theme.palette.error.light, 0.9)
                    : alpha(schedule.color, 0.25),
                  transform: 'translateY(-2px)',
                  cursor: 'pointer'
                }
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 0.5 }}
              >
                <Avatar sx={{ width: 24, height: 24 }} />
                <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
                  {schedule.teacherName}
                </Typography>
                {!isMobile && (
                  <Chip
                    label={statusMap[schedule.status].label}
                    color={statusMap[schedule.status].color as 'success' | 'warning' | 'error' | 'info'}
                    size="small"
                    sx={{ height: 20, fontSize: '0.6rem' }}
                  />
                )}
              </Stack>
              <Typography 
                variant="body2" 
                fontWeight="bold" 
                noWrap 
                sx={{ 
                  color: alpha(schedule.color, 0.9),
                  mb: 0.5
                }}
              >
                {schedule.subjectName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Phòng: {schedule.room}
              </Typography>
            </Paper>
          </Tooltip>
        ))}
      </>
    );
  };

  return (
    <Box>
      {/* Phần điều hướng tuần */}
      <Stack 
        direction="row" 
        justifyContent="space-between" 
        alignItems="center" 
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Info size={16} />
          <Typography variant="body2" color="text.secondary">
            {weekDisplay}
          </Typography>
        </Stack>
        
        <ButtonGroup size="small" variant="outlined">
          <Button onClick={handlePreviousWeek} startIcon={<ArrowLeft />}>
            Trước
          </Button>
          <Button onClick={handleCurrentWeek}>
            Hiện tại
          </Button>
          <Button onClick={handleNextWeek} endIcon={<ArrowRight />}>
            Tiếp
          </Button>
        </ButtonGroup>
      </Stack>

      {/* Hiển thị lịch */}
      <Box 
        sx={{ 
          width: '100%', 
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'action.hover',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'primary.light',
            borderRadius: 1,
          }
        }}
      >
        <Box sx={{ minWidth: isMobile ? 800 : 'auto' }}>
          <Grid container spacing={1}>
            {/* Header Row - Days of week */}
            <Grid item xs={2}>
              <Paper
                elevation={0}
                sx={{
                  bgcolor: 'transparent',
                  p: 1.5,
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}
              >
                <Typography variant="subtitle2">
                  Thời gian
                </Typography>
              </Paper>
            </Grid>
            
            {days.map((day, index) => {
              const isToday = index === new Date().getDay() - 1 && currentWeek === 0;
              return (
                <Grid item xs={10/7} key={day}>
                  <Paper
                    sx={{
                      bgcolor: isToday ? 'primary.main' : 'grey.800',
                      color: 'white',
                      p: 1.5,
                      textAlign: 'center',
                      fontWeight: 'bold',
                      borderRadius: 1,
                      boxShadow: isToday ? 2 : 0
                    }}
                  >
                    <Typography variant="subtitle2">{day}</Typography>
                  </Paper>
                </Grid>
              );
            })}

            {/* Time slots */}
            {timeSlots.map((slot, index) => (
              <Fragment key={`time-${index}`}>
                {/* Time column */}
                <Grid item xs={2}>
                  <Paper
                    sx={{
                      p: 1.5,
                      textAlign: 'center',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                      borderRadius: 1
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Clock size={16} weight="bold" />
                      <Typography variant="body2" fontWeight="medium">
                        {slot.start} - {slot.end}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
                
                {/* Schedule cells */}
                {days.map((day, dayIndex) => {
                  const isToday = dayIndex === new Date().getDay() - 1 && currentWeek === 0;
                  return (
                    <Grid item xs={10/7} key={`${day}-${index}`}>
                      <Box 
                        sx={{ 
                          p: 0.5, 
                          height: '100%',
                          bgcolor: isToday ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                          borderRadius: 1
                        }}
                      >
                        {renderScheduleItem(day, slot)}
                      </Box>
                    </Grid>
                  );
                })}
              </Fragment>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* Phần chú thích trạng thái */}
      <Stack 
        direction="row" 
        spacing={2} 
        flexWrap="wrap" 
        justifyContent="center"
        sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
      >
        {Object.entries(statusMap).map(([key, value]) => (
          <Chip
            key={key}
            label={value.label}
            color={value.color as 'success' | 'warning' | 'error' | 'info'}
            size="small"
            sx={{ mb: 1 }}
          />
        ))}
      </Stack>
    </Box>
  );
}