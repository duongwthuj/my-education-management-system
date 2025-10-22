'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  Tooltip,
  Avatar,
  useTheme,
  alpha,
  useMediaQuery,
  Card,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  CircularProgress,
  Divider,
  IconButton
} from '@mui/material';
import { Grid } from '@/components/common/grid';
import { TeacherSchedule, TeacherTimeSlot } from '@/types';
import { CaretDown, Clock, MapPin, Info, Calendar } from '@phosphor-icons/react';
import { format, parseISO, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale/vi';

// Color definitions for status
const STATUS_COLORS = {
  'available': '#4caf50',  // Green
  'teaching': '#f44336',   // Red
  'unavailable': '#9e9e9e' // Grey
};

const STATUS_LABELS = {
  'available': 'Có thể dạy',
  'teaching': 'Đang dạy',
  'unavailable': 'Không khả dụng'
};

const PERIOD_LABELS = {
  'morning': 'Sáng',
  'afternoon': 'Chiều',
  'evening': 'Tối'
};

// Mã màu cho các buổi học
const PERIOD_COLORS = {
  'morning': '#3f51b5',   // Xanh dương
  'afternoon': '#ff9800', // Cam
  'evening': '#9c27b0'    // Tím
};

interface TeacherScheduleCalendarProps {
  scheduleData: TeacherSchedule;
}

export function TeacherScheduleCalendar({ scheduleData }: TeacherScheduleCalendarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [viewAllTeachers, setViewAllTeachers] = useState<boolean>(false);
  
  // Lấy danh sách giáo viên
  const teacherList = useMemo(() => Object.keys(scheduleData), [scheduleData]);
  
  // Thiết lập giáo viên mặc định nếu chưa chọn
  useEffect(() => {
    // If showing all teachers (multiple teachers in data), set viewAllTeachers = true
    if (teacherList.length > 1) {
      setViewAllTeachers(true);
      setSelectedTeacher(null);
    } else if (teacherList.length === 1) {
      setViewAllTeachers(false);
      setSelectedTeacher(teacherList[0]);
    }
  }, [teacherList]);
  
  // Lấy ngày hiện tại
  const currentDate = new Date();
  
  // Xử lý đóng/mở accordion
  const handleAccordionChange = (dayDate: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedDay(isExpanded ? dayDate : null);
  };

  // Lấy dữ liệu lịch của giáo viên đã chọn hoặc tất cả giáo viên
  const teacherData = useMemo(() => {
    // Nếu chọn xem tất cả giáo viên
    if (viewAllTeachers) {
      // Tạo Map để nhóm lịch làm việc theo ngày
      const dateMap: Record<string, { 
        date: string, 
        weekday: string, 
        teachers: Record<string, TeacherTimeSlot[]>
      }> = {};
      
      // Duyệt qua tất cả giáo viên và lịch làm việc của họ
      Object.entries(scheduleData).forEach(([teacherName, days]) => {
        days.forEach(day => {
          // Nếu ngày này chưa có trong Map, thêm vào
          if (!dateMap[day.date]) {
            dateMap[day.date] = {
              date: day.date,
              weekday: day.weekday,
              teachers: {}
            };
          }
          
          // Thêm thông tin slots của giáo viên cho ngày này
          dateMap[day.date].teachers[teacherName] = day.slots;
        });
      });
      
      // Chuyển đổi Map thành mảng và sắp xếp theo ngày
      return Object.values(dateMap).sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateA.getTime() - dateB.getTime();
      });
    } 
    // Nếu chọn xem một giáo viên cụ thể
    else if (selectedTeacher) {
      const data = scheduleData[selectedTeacher] || [];
      return data.sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateA.getTime() - dateB.getTime();
      });
    } 
    // Nếu chưa chọn giáo viên nào
    else {
      return [];
    }
  }, [scheduleData, selectedTeacher, viewAllTeachers]);
  
  // Tính toán thống kê
  const stats = useMemo(() => {
    if (!teacherData.length) {
      return {
        totalSlots: 0,
        teaching: 0,
        available: 0,
        unavailable: 0,
        byDay: {},
        byPeriod: { morning: 0, afternoon: 0, evening: 0 },
        teacherCount: 0
      };
    }
    
    let teaching = 0;
    let available = 0;
    let unavailable = 0;
    const byDay: Record<string, { total: number, teaching: number, available: number }> = {};
    const byPeriod = { morning: 0, afternoon: 0, evening: 0 };
    let teacherCount = viewAllTeachers ? teacherList.length : 1;
    
    if (viewAllTeachers) {
      // Thống kê cho tất cả giáo viên
      teacherData.forEach(day => {
        byDay[day.date] = { total: 0, teaching: 0, available: 0 };
        
        // Duyệt qua từng giáo viên trong ngày
        Object.entries(day.teachers).forEach(([_, slots]) => {
          (slots as TeacherTimeSlot[]).forEach(slot => {
            if (slot.status === 'teaching') {
              teaching++;
              byDay[day.date].teaching++;
            } else if (slot.status === 'available') {
              available++;
              byDay[day.date].available++;
            } else {
              unavailable++;
            }
            
            byDay[day.date].total++;
            byPeriod[slot.period]++;
          });
        });
      });
    } else {
      // Thống kê cho một giáo viên
      teacherData.forEach(day => {
        byDay[day.date] = { total: 0, teaching: 0, available: 0 };
        
        day.slots.forEach(slot => {
          if (slot.status === 'teaching') {
            teaching++;
            byDay[day.date].teaching++;
          } else if (slot.status === 'available') {
            available++;
            byDay[day.date].available++;
          } else {
            unavailable++;
          }
          
          byDay[day.date].total++;
          byPeriod[slot.period]++;
        });
      });
    }
    
    return {
      totalSlots: teaching + available + unavailable,
      teaching,
      available,
      unavailable,
      byDay,
      byPeriod,
      teacherCount
    };
  }, [teacherData, selectedTeacher, viewAllTeachers, teacherList]);

  // Kiểm tra xem một ngày có phải là ngày hiện tại không
  const isToday = (dateString: string) => {
    return isSameDay(parseISO(dateString), currentDate);
  };

  // Hiển thị dạng danh sách
  const renderListView = () => {
    if (!teacherData.length) return (
      <Box sx={{ textAlign: 'center', py: 5 }}>
        <Typography color="text.secondary">Không có dữ liệu lịch</Typography>
      </Box>
    );
    
    return (
      <Stack spacing={3}>
        {teacherData.map((day) => {
          // Kiểm tra xem ngày này có phải là hôm nay không
          const todayCheck = isToday(day.date);
          
          // Biến để lưu thông tin hiển thị
          let teachingCount = 0;
          let availableCount = 0;
          let totalSlots = 0;
          
          // Nếu xem tất cả giáo viên, tính tổng số buổi học, khung trống của mỗi giáo viên
          if (viewAllTeachers) {
            Object.entries(day.teachers).forEach(([_, slots]) => {
              const typedSlots = slots as TeacherTimeSlot[];
              teachingCount += typedSlots.filter(slot => slot.status === 'teaching').length;
              availableCount += typedSlots.filter(slot => slot.status === 'available').length;
              totalSlots += typedSlots.length;
            });
            
            // Tiếp tục xử lý cho viewAllTeachers
          } else {
            // Nếu xem một giáo viên cụ thể, lấy thông tin trực tiếp từ day.slots
            teachingCount = day.slots.filter(slot => slot.status === 'teaching').length;
            availableCount = day.slots.filter(slot => slot.status === 'available').length;
            totalSlots = day.slots.length;
          }
          
          // Hiển thị thông tin cho cả hai trường hợp
          return (
            <Accordion 
              key={day.date} 
              disableGutters 
              expanded={expandedDay === day.date}
              onChange={handleAccordionChange(day.date)}
              sx={{ 
                boxShadow: todayCheck ? 2 : 1,
                border: todayCheck ? `1px solid ${theme.palette.primary.main}` : 'none',
              }}
              >
              <AccordionSummary 
                expandIcon={<CaretDown />}
                sx={{ 
                  backgroundColor: todayCheck 
                    ? alpha(theme.palette.primary.main, 0.1)
                    : alpha(theme.palette.background.default, 0.6),
                  '&:hover': {
                    backgroundColor: todayCheck 
                      ? alpha(theme.palette.primary.main, 0.15)
                      : alpha(theme.palette.background.default, 0.8)
                  }
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Badge
                        color="primary"
                        variant="dot"
                        invisible={!todayCheck}
                      >
                        <Avatar 
                          sx={{ 
                            bgcolor: todayCheck ? 'primary.main' : 'grey.200',
                            color: todayCheck ? 'white' : 'text.primary',
                          }}
                        >
                          {format(parseISO(day.date), 'dd')}
                        </Avatar>
                      </Badge>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {day.weekday}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(parseISO(day.date), 'dd/MM/yyyy')}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  
                  <Grid item xs={12} sm={8}>
                    <Stack 
                      direction="row" 
                      spacing={1} 
                      justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
                      flexWrap="wrap"
                      sx={{ mt: { xs: 1, sm: 0 } }}
                    >
                      {viewAllTeachers ? (
                        <>
                          {teachingCount > 0 && (
                            <Chip 
                              size="small" 
                              color="error"
                              label={`${teachingCount} buổi dạy`} 
                              sx={{ mb: { xs: 0.5, md: 0 } }}
                            />
                          )}
                          {availableCount > 0 && (
                            <Chip 
                              size="small" 
                              color="success"
                              label={`${availableCount} khung trống`} 
                              sx={{ mb: { xs: 0.5, md: 0 } }}
                            />
                          )}
                          <Chip 
                            size="small" 
                            color="default"
                            variant="outlined"
                            label={`${totalSlots} tổng số`} 
                            sx={{ mb: { xs: 0.5, md: 0 } }}
                          />
                        </>
                      ) : (
                        <>
                          {day.slots.filter(slot => slot.status === 'teaching').length > 0 && (
                            <Chip 
                              size="small" 
                              color="error"
                              label={`${day.slots.filter(slot => slot.status === 'teaching').length} buổi dạy`} 
                              sx={{ mb: { xs: 0.5, md: 0 } }}
                            />
                          )}
                          {day.slots.filter(slot => slot.status === 'available').length > 0 && (
                            <Chip 
                              size="small" 
                              color="success"
                              label={`${day.slots.filter(slot => slot.status === 'available').length} khung trống`} 
                              sx={{ mb: { xs: 0.5, md: 0 } }}
                            />
                          )}
                          <Chip 
                            size="small" 
                            color="default"
                            variant="outlined"
                            label={`${day.slots.length} tổng số`} 
                            sx={{ mb: { xs: 0.5, md: 0 } }}
                          />
                        </>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </AccordionSummary>
              
              <AccordionDetails sx={{ pt: 1, pb: 2 }}>
                <Divider sx={{ mb: 2, mt: 0 }} />
                
                <Stack spacing={2.5}>
                  {viewAllTeachers ? (
                    // Hiển thị lịch theo từng giáo viên
                    Object.entries(day.teachers).map(([teacherName, slots]) => (
                      <Box key={teacherName} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                          Giáo viên: {teacherName}
                        </Typography>
                        
                        {['morning', 'afternoon', 'evening'].map((period) => {
                          const periodSlots = (slots as TeacherTimeSlot[]).filter(slot => slot.period === period);
                          if (periodSlots.length === 0) return null;
                          
                          return (
                            <Box key={period} sx={{ mb: 1.5 }}>
                              <Stack 
                                direction="row" 
                                alignItems="center" 
                                spacing={1} 
                                sx={{ mb: 1.5 }}
                              >
                                <Box 
                                  sx={{ 
                                    width: 4, 
                                    height: 20, 
                                    borderRadius: 1,
                                    bgcolor: PERIOD_COLORS[period as keyof typeof PERIOD_COLORS] 
                                  }} 
                                />
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {PERIOD_LABELS[period as keyof typeof PERIOD_LABELS]}
                                </Typography>
                              </Stack>
                              
                              <Grid container spacing={1.5}>
                                {periodSlots.map((slot, slotIndex) => (
                                  <Grid item xs={12} sm={6} md={4} key={slotIndex}>
                                    <Paper
                                      elevation={2}
                                      sx={{
                                        p: 1.5,
                                        borderLeft: `4px solid ${STATUS_COLORS[slot.status]}`,
                                        backgroundColor: alpha(STATUS_COLORS[slot.status], 0.05),
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                          backgroundColor: alpha(STATUS_COLORS[slot.status], 0.1),
                                          transform: 'translateY(-2px)',
                                        }
                                      }}
                                    >
                                      <Stack spacing={1}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                          <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <Clock size={16} weight="bold" />
                                            <Typography variant="body2" fontWeight="medium">
                                              {slot.time}
                                            </Typography>
                                          </Stack>
                                          <Chip 
                                            size="small" 
                                            label={STATUS_LABELS[slot.status]} 
                                            sx={{
                                              backgroundColor: alpha(STATUS_COLORS[slot.status], 0.2),
                                              color: STATUS_COLORS[slot.status],
                                              fontWeight: 'bold',
                                              fontSize: '0.7rem',
                                              height: 22
                                            }}
                                          />
                                        </Stack>
                                        
                                        {slot.status === 'teaching' && (
                                          <Tooltip title="Chi tiết buổi học" arrow>
                                            <IconButton 
                                              size="small" 
                                              color="primary"
                                              sx={{ alignSelf: 'flex-end', mt: -1 }}
                                            >
                                              <Info size={16} />
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                      </Stack>
                                    </Paper>
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          );
                        })}
                      </Box>
                    ))
                  ) : (
                    // Hiển thị lịch cho một giáo viên
                    ['morning', 'afternoon', 'evening'].map((period) => {
                      const slots = day.slots.filter(slot => slot.period === period);
                      if (slots.length === 0) return null;
                      
                      return (
                        <Box key={period} sx={{ mb: 1 }}>
                          <Stack 
                            direction="row" 
                            alignItems="center" 
                            spacing={1} 
                            sx={{ mb: 1.5 }}
                          >
                            <Box 
                              sx={{ 
                                width: 4, 
                                height: 20, 
                                borderRadius: 1,
                                bgcolor: PERIOD_COLORS[period as keyof typeof PERIOD_COLORS] 
                              }} 
                            />
                            <Typography variant="subtitle2" fontWeight="bold">
                              {PERIOD_LABELS[period as keyof typeof PERIOD_LABELS]}
                            </Typography>
                          </Stack>
                          
                          <Grid container spacing={1.5}>
                            {slots.map((slot, slotIndex) => (
                              <Grid item xs={12} sm={6} md={4} key={slotIndex}>
                                <Paper
                                  elevation={2}
                                  sx={{
                                    p: 1.5,
                                    borderLeft: `4px solid ${STATUS_COLORS[slot.status]}`,
                                    backgroundColor: alpha(STATUS_COLORS[slot.status], 0.05),
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      backgroundColor: alpha(STATUS_COLORS[slot.status], 0.1),
                                      transform: 'translateY(-2px)',
                                    }
                                  }}
                                >
                                  <Stack spacing={1}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                      <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <Clock size={16} weight="bold" />
                                        <Typography variant="body2" fontWeight="medium">
                                          {slot.time}
                                        </Typography>
                                      </Stack>
                                      <Chip 
                                        size="small" 
                                        label={STATUS_LABELS[slot.status]} 
                                        sx={{
                                          backgroundColor: alpha(STATUS_COLORS[slot.status], 0.2),
                                          color: STATUS_COLORS[slot.status],
                                          fontWeight: 'bold',
                                          fontSize: '0.7rem',
                                          height: 22
                                        }}
                                      />
                                    </Stack>
                                    
                                    {slot.status === 'teaching' && (
                                      <Tooltip title="Chi tiết buổi học" arrow>
                                        <IconButton 
                                          size="small" 
                                          color="primary"
                                          sx={{ alignSelf: 'flex-end', mt: -1 }}
                                        >
                                          <Info size={16} />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Stack>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      );
                    })
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    );
  };

  // Hiển thị thống kê tổng quan
  const renderStats = () => {
    if (!teacherData.length) return null;
    
    return (
      <Card sx={{ mb: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Tổng quan lịch làm việc
            {viewAllTeachers && stats.teacherCount > 0 && (
              <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
                ({stats.teacherCount} giáo viên)
              </Typography>
            )}
          </Typography>
        </Box>
        
        <Grid container>
          <Grid item xs={12} md={4} sx={{ 
            p: 2, 
            borderRight: { xs: 0, md: 1 }, 
            borderBottom: { xs: 1, md: 0 }, 
            borderColor: 'divider' 
          }}>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">Tổng số khung giờ</Typography>
              <Typography variant="h4">{stats.totalSlots}</Typography>
              
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Chip 
                  label={`${stats.teaching} đang dạy`} 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha(STATUS_COLORS.teaching, 0.2),
                    color: STATUS_COLORS.teaching,
                    fontWeight: 'bold'
                  }} 
                />
                <Chip 
                  label={`${stats.available} khả dụng`} 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha(STATUS_COLORS.available, 0.2),
                    color: STATUS_COLORS.available,
                    fontWeight: 'bold'
                  }} 
                />
              </Stack>
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ 
            p: 2, 
            borderRight: { xs: 0, md: 1 }, 
            borderBottom: { xs: 1, md: 0 }, 
            borderColor: 'divider'
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Phân bổ theo thời gian</Typography>
            
            <Stack spacing={1}>
              {Object.entries(PERIOD_LABELS).map(([period, label]) => (
                <Stack key={period} direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%',
                        bgcolor: PERIOD_COLORS[period as keyof typeof PERIOD_COLORS]
                      }} 
                    />
                    <Typography variant="body2">{label}</Typography>
                  </Stack>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {stats.byPeriod[period as keyof typeof stats.byPeriod]} khung
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ p: 2 }}>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">Ngày bận nhất</Typography>
              
              {Object.entries(stats.byDay)
                .sort((a, b) => b[1].teaching - a[1].teaching)
                .slice(0, 3)
                .map(([date, data]) => {
                  const dayData = teacherData.find(day => day.date === date);
                  
                  return (
                    <Paper 
                      key={date} 
                      sx={{ 
                        p: 1, 
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Calendar size={16} />
                        <Typography variant="body2">
                          {dayData?.weekday} ({format(parseISO(date), 'dd/MM')})
                        </Typography>
                      </Stack>
                      <Chip 
                        size="small" 
                        color="error"
                        label={`${data.teaching} buổi dạy`} 
                      />
                    </Paper>
                  );
              })}
            </Stack>
          </Grid>
        </Grid>
      </Card>
    );
  };

  return (
    <Box>
      {/* Hiển thị lịch */}

      {/* Hiển thị thống kê */}
      {renderStats()}

      {/* Hiển thị chú thích */}
      <Stack 
        direction="row" 
        spacing={2}
        sx={{ mb: 2 }}
        justifyContent="center" 
        alignItems="center"
        flexWrap="wrap"
      >
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <Stack key={status} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                bgcolor: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
                borderRadius: '50%'
              }} 
            />
            <Typography variant="caption">{label}</Typography>
          </Stack>
        ))}
      </Stack>

      {/* Hiển thị loading */}
      {loading ? (
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          flexDirection: 'column',
          gap: 2
        }}>
          <CircularProgress size={40} />
          <Typography color="text.secondary">Đang tải dữ liệu...</Typography>
        </Box>
      ) : (
        /* Hiển thị dạng danh sách */
        renderListView()
      )}
    </Box>
  );
}