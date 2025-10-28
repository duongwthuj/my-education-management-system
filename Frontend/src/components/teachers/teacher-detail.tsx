'use client';

import { useState, useEffect } from 'react';
import NextLink from 'next/link';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert
} from '@mui/material';
import { Grid } from '@/components/common/grid';
import {
  Phone,
  EnvelopeSimple,
  MapPin,
  GraduationCap,
  BookBookmark,
  PencilSimple,
  ArrowLeft,
  Clock
} from '@phosphor-icons/react';
import { Teacher, Subject } from '@/types';
import { useTeacher } from '@/hooks/use-teachers';
import { useSubjects } from '@/hooks/use-subjects';
import { useTeaches } from '@/hooks/useTeaches';
import { EditTeacherDialog } from './edit-teacher-dialog';
import { AddSubjectToTeacherDialog } from './add-subject-to-teacher-dialog';

interface TeacherDetailProps {
  teacherId: string;
}

export function TeacherDetail({ teacherId }: TeacherDetailProps) {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [teacherSubjects, setTeacherSubjects] = useState<Subject[]>([]);
  const [teacherTeaches, setTeacherTeaches] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addSubjectDialogOpen, setAddSubjectDialogOpen] = useState(false);
  const { teacher: teacherData, loading, error, refetch } = useTeacher(teacherId);
  const { subjects, loading: loadingSubjects } = useSubjects();
  const { teaches, loading: loadingTeaches } = useTeaches();

  useEffect(() => {
    if (teacherData) {
      setTeacher(teacherData);
      const foundSubjects = subjects.filter((s) => teacherData.subjects.includes(s.id));
      setTeacherSubjects(foundSubjects);
    }
  }, [teacherData, subjects]);

  useEffect(() => {
    if (teacher && teaches.length > 0) {
      const filtered = teaches.filter(t => String(t.teacherId) === String(teacher.id));
      setTeacherTeaches(filtered);
    }
  }, [teacher, teaches]);

  if (loading || loadingSubjects || loadingTeaches) {
    return (
      <Box sx={{ flexGrow: 1, py: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ flexGrow: 1, py: 8 }}>
        <Alert severity="error" onClose={refetch}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!teacher) {
    return (
      <Box sx={{ flexGrow: 1, py: 8 }}>
        <Typography>Không tìm thấy giáo viên</Typography>
      </Box>
    );
  }

  const teachesByDay = teacherTeaches.reduce((acc: any, teach) => {
    if (!acc[teach.dayOfWeek]) acc[teach.dayOfWeek] = [];
    acc[teach.dayOfWeek].push(teach);
    return acc;
  }, {});

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        height: 'calc(100vh - 64px)', // trừ chiều cao header nếu có
        overflow: 'hidden',
        px: 3,
        py: 3,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Stack spacing={3} sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack spacing={1}>
            <Button component={NextLink} href="/dashboard/teachers" startIcon={<ArrowLeft />} sx={{ ml: -1 }}>
              Quay lại
            </Button>
            <Typography variant="h4">Hồ sơ giáo viên</Typography>
            <Typography color="text.secondary" variant="subtitle2">
              Thông tin chi tiết và lịch dạy
            </Typography>
          </Stack>
          <Button onClick={() => setEditDialogOpen(true)} variant="contained" startIcon={<PencilSimple />}>
            Chỉnh sửa
          </Button>
        </Stack>

        {/* Layout Flex cho toàn bộ nội dung */}
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          {/* Cột trái (thông tin cá nhân) */}
          <Box sx={{ flexBasis: 320, flexShrink: 0, mr: 3 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Avatar
                    src={teacher.avatar}
                    sx={{ height: 100, width: 100, mb: 2, border: '4px solid', borderColor: 'primary.lighter' }}
                  />
                  <Typography variant="h5" sx={{ mb: 1 }}>{teacher.name}</Typography>
                  <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                    {teacher.education}
                  </Typography>
                  <Chip
                    label={teacher.status === 'active' ? 'Đang hoạt động' : teacher.status === 'on-leave' ? 'Tạm nghỉ' : 'Ngưng'}
                    color={teacher.status === 'active' ? 'success' : teacher.status === 'on-leave' ? 'warning' : 'error'}
                  />
                </Box>
              </CardContent>
              <Divider />
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Liên hệ</Typography>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      <Stack direction="row" spacing={1}><Phone /> <Typography>{teacher.phone}</Typography></Stack>
                      <Stack direction="row" spacing={1}><EnvelopeSimple /> <Typography>{teacher.email}</Typography></Stack>
                      <Stack direction="row" spacing={1}><MapPin /> <Typography>{teacher.address}</Typography></Stack>
                    </Stack>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Thông tin</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>Ngày vào: {teacher.joinDate}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Cột phải (fill toàn bộ phần còn lại) */}
          <Box sx={{ flexGrow: 1, minWidth: 0, overflow: 'hidden' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
                <Tab label="Mô tả" />
                <Tab label="Môn học" icon={<BookBookmark />} iconPosition="start" />
                <Tab label="Lịch dạy" icon={<Clock />} iconPosition="start" />
              </Tabs>
              <Divider />
              <CardContent sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {/* Tab 0: Mô tả */}
                {tabValue === 0 && (
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="h6" sx={{ mb: 1 }}>Giới thiệu</Typography>
                      <Typography variant="body2" color="text.secondary">{teacher.bio || 'Chưa có thông tin'}</Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="h6" sx={{ mb: 1 }}>Bằng cấp</Typography>
                      <Stack direction="row" spacing={1}>
                        <GraduationCap fontSize="var(--icon-fontSize-md)" />
                        <Typography variant="body2">{teacher.education}</Typography>
                      </Stack>
                    </Box>
                  </Stack>
                )}

                {/* Tab 1: Môn học có thể dạy */}
                {tabValue === 1 && (
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Danh sách môn học</Typography>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => setAddSubjectDialogOpen(true)}
                      >
                        + Thêm môn
                      </Button>
                    </Stack>
                    {teacherSubjects.length > 0 ? (
                      <List>
                        {teacherSubjects.map((s, i) => (
                          <Box key={s.id}>
                            <ListItem sx={{ py: 3 }}>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
                                  <BookBookmark />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={s.name}
                                secondary={`${s.code} — ${s.category}`}
                              />
                              <Chip
                                label={s.level === 'beginner' ? 'Cơ bản' : s.level === 'intermediate' ? 'Trung cấp' : 'Nâng cao'}
                                color={s.level === 'beginner' ? 'info' : s.level === 'intermediate' ? 'warning' : 'error'}
                                size="small"
                              />
                            </ListItem>
                            {i < teacherSubjects.length - 1 && <Divider />}
                          </Box>
                        ))}
                      </List>
                    ) : (
                      <Typography color="text.secondary">Chưa được gán môn học nào</Typography>
                    )}
                  </Stack>
                )}

                {/* Tab 2: Lịch dạy */}
                {tabValue === 2 && (
                  <>
                    {Object.keys(teachesByDay).length > 0 ? (
                      <Stack spacing={3}>
                        {Object.keys(teachesByDay).map((day) => (
                          <Box key={day}>
                            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'primary.main' }}>
                              {day}
                            </Typography>
                            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell sx={{ fontWeight: 600 }}>Thời gian</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Môn</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Lớp</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {teachesByDay[day].map((teach: any, idx: number) => {
                                    const sub = subjects.find(s => String(s.id) === String(teach.subjectId));
                                    return (
                                      <TableRow key={idx} hover sx={{ height: '72px' }}>
                                        <TableCell>
                                          <Typography variant="body2" fontWeight={500}>
                                            {teach.startTime} - {teach.endTime}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>{sub?.name || 'N/A'}</TableCell>
                                        <TableCell>
                                          <Chip label={teach.className || 'N/A'} size="small" variant="outlined" />
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography color="text.secondary">Chưa có lịch dạy</Typography>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Stack>

      <EditTeacherDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        teacher={teacher}
        onSuccess={refetch}
      />

      <AddSubjectToTeacherDialog
        open={addSubjectDialogOpen}
        onClose={() => setAddSubjectDialogOpen(false)}
        teacherId={teacher?.id || ''}
        availableSubjects={subjects}
        currentSubjectIds={
          Array.isArray(teacher?.subjects)
            ? teacher.subjects.map((s: any) => typeof s === 'string' ? s : (s._id || s.id))
            : []
        }
        onSuccess={refetch}
      />
    </Box>
  );
}
