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
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
  Clock,
  Trash
} from '@phosphor-icons/react';
import { Teacher, Subject } from '@/types';
import { useTeacher } from '@/hooks/use-teachers';
import { useSubjects } from '@/hooks/use-subjects';
import { useTeaches } from '@/hooks/useTeaches';
import { teachersService } from '@/services/teachers.service';
import { subjectsService } from '@/services/subjects.service';
import { EditTeacherDialog } from './edit-teacher-dialog';
import { AddSubjectToTeacherDialog } from './add-subject-to-teacher-dialog';

interface TeacherDetailProps {
  teacherId: string;
}

export function TeacherDetail({ teacherId }: TeacherDetailProps) {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [teacherSubjects, setTeacherSubjects] = useState<Subject[]>([]);
  const [allSubjectsLoaded, setAllSubjectsLoaded] = useState<Subject[]>([]);
  const [teacherTeaches, setTeacherTeaches] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [subjectsViewMode, setSubjectsViewMode] = useState<'grid' | 'list'>('grid');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addSubjectDialogOpen, setAddSubjectDialogOpen] = useState(false);
  const [deleteSubjectConfirmOpen, setDeleteSubjectConfirmOpen] = useState(false);
  const [editTeachDialogOpen, setEditTeachDialogOpen] = useState(false);
  const [editingTeach, setEditingTeach] = useState<any>(null);
  const [editTeachForm, setEditTeachForm] = useState<any>(null);
  const [editingTeachError, setEditingTeachError] = useState<string | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editDialogAllSubjects, setEditDialogAllSubjects] = useState<Subject[]>([]);
  const [loadingEditDialogSubjects, setLoadingEditDialogSubjects] = useState(false);
  const { teacher: teacherData, loading, error, refetch } = useTeacher(teacherId);
  const { subjects, loading: loadingSubjects } = useSubjects();
  const { teaches, loading: loadingTeaches, fetchByTeacher, fetchAll: fetchAllTeaches } = useTeaches();

  // Fetch tất cả subjects khi component mount
  useEffect(() => {
    const fetchAllSubjects = async () => {
      try {
        const response = await subjectsService.getAll({ limit: 999 });
        if (response.success && response.data) {
          setAllSubjectsLoaded(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch all subjects:', err);
      }
    };
    fetchAllSubjects();
  }, []);

  useEffect(() => {
    if (teacherData) {
      setTeacher(teacherData);
      // Dùng allSubjectsLoaded nếu có, không thì fallback vào subjects từ hook
      const subjectsToUse = allSubjectsLoaded.length > 0 ? allSubjectsLoaded : subjects;
      const foundSubjects = subjectsToUse.filter((s) => teacherData.subjects.includes(s.id));
      
      // Extract học phần từ tên môn (VD: "Bé làm game - học phần 1" → 1)
      const extractSemester = (name: string): number => {
        const match = name.match(/học phần\s*(\d+)/i);
        return match ? parseInt(match[1], 10) : 999; // 999 cho những môn không có học phần
      };
      
      // Sort theo học phần trước, rồi sắp xếp theo tên
      const sorted = foundSubjects.sort((a, b) => {
        const semesterA = extractSemester(a.name);
        const semesterB = extractSemester(b.name);
        
        if (semesterA !== semesterB) {
          return semesterA - semesterB; // Sort theo học phần (tăng dần)
        }
        // Nếu cùng học phần, sort theo tên (A-Z)
        return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
      });
      setTeacherSubjects(sorted);
    }
  }, [teacherData, subjects, allSubjectsLoaded]);

  useEffect(() => {
    if (teacher && teaches.length > 0) {
      const filtered = teaches.filter(t => String(t.teacherId) === String(teacher.id));
      setTeacherTeaches(filtered);
    }
  }, [teacher, teaches]);

  // Fetch tất cả subjects khi edit dialog mở
  useEffect(() => {
    if (!editTeachDialogOpen) return;

    const fetchAllSubjects = async () => {
      setLoadingEditDialogSubjects(true);
      try {
        const response = await subjectsService.getAll({ limit: 999 });
        if (response.success && response.data) {
          // Extract học phần từ tên môn (VD: "Bé làm game - học phần 1" → 1)
          const extractSemester = (name: string): number => {
            const match = name.match(/học phần\s*(\d+)/i);
            return match ? parseInt(match[1], 10) : 999;
          };
          
          // Sort theo học phần trước, rồi sắp xếp theo tên
          const sorted = [...response.data].sort((a, b) => {
            const semesterA = extractSemester(a.name);
            const semesterB = extractSemester(b.name);
            
            if (semesterA !== semesterB) {
              return semesterA - semesterB;
            }
            return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
          });
          setEditDialogAllSubjects(sorted);
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
      } finally {
        setLoadingEditDialogSubjects(false);
      }
    };

    fetchAllSubjects();
  }, [editTeachDialogOpen]);

  const handleDeleteSubjectClick = (subject: Subject) => {
    setSubjectToDelete(subject);
    setDeleteError(null);
    setDeleteSubjectConfirmOpen(true);
  };

  const handleConfirmDeleteSubject = async () => {
    if (!teacher || !subjectToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      // Lọc ra các môn không phải môn đang xóa
      const newSubjectsArray = teacher.subjects.filter(id => id !== subjectToDelete.id);
      
      const response = await teachersService.update(teacher.id, {
        subjects: newSubjectsArray,
      });

      if (!response.success) {
        setDeleteError(response.error || 'Có lỗi xảy ra khi xóa môn');
        return;
      }

      // Cập nhật state local
      setTeacherSubjects(prev => prev.filter(s => s.id !== subjectToDelete.id));
      setDeleteSubjectConfirmOpen(false);
      setSubjectToDelete(null);

      // Refetch để cập nhật dữ liệu
      refetch();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setDeleting(false);
    }
  };

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
              <CardContent sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
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
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Danh sách môn học ({teacherSubjects.length} môn)
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Tabs 
                          value={subjectsViewMode === 'grid' ? 0 : 1}
                          onChange={(_, val) => setSubjectsViewMode(val === 0 ? 'grid' : 'list')}
                          sx={{ minHeight: 0, '& .MuiTabs-indicator': { height: 3 } }}
                        >
                          <Tab label="Danh mục" sx={{ minHeight: 32, py: 1 }} />
                          <Tab label="Danh sách" sx={{ minHeight: 32, py: 1 }} />
                        </Tabs>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => setAddSubjectDialogOpen(true)}
                        >
                          + Thêm môn
                        </Button>
                      </Stack>
                    </Stack>

                    {teacherSubjects.length > 0 ? (
                      <Stack spacing={2} sx={{ overflow: 'auto' }}>
                        {/* Debug Info */}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {subjectsViewMode === 'grid' ? '👁️ Danh mục view' : '📋 Danh sách view'} — Hiển thị: {teacherSubjects.length} môn
                        </Typography>
                        
                        {/* Grid View */}
                        {subjectsViewMode === 'grid' && (
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, width: '100%', pr: 1 }}>
                            {teacherSubjects.map((s) => (
                              <Card key={s.id} sx={{ display: 'flex', flexDirection: 'column', position: 'relative', '&:hover': { boxShadow: 4 }, minHeight: 200 }}>
                                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                                  <Stack spacing={1.5}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                      <Stack spacing={0.5} sx={{ flex: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, pr: 1 }}>
                                          {s.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          Mã: {s.code}
                                        </Typography>
                                      </Stack>
                                      <Tooltip title="Xóa môn này">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleDeleteSubjectClick(s)}
                                          sx={{ color: 'error.main' }}
                                        >
                                          <Trash fontSize="var(--icon-fontSize-md)" />
                                        </IconButton>
                                      </Tooltip>
                                    </Stack>

                                    <Divider />

                                    <Stack spacing={1}>
                                      <Stack direction="row" spacing={0.5} alignItems="center">
                                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 70 }}>
                                          Danh mục:
                                        </Typography>
                                        <Chip label={s.category} size="small" variant="outlined" />
                                      </Stack>

                                      <Stack direction="row" spacing={0.5} alignItems="center">
                                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 70 }}>
                                          Cấp độ:
                                        </Typography>
                                        <Chip 
                                          label={s.level === 'beginner' ? 'Cơ bản' : s.level === 'intermediate' ? 'Trung cấp' : 'Nâng cao'}
                                          size="small"
                                          color={s.level === 'beginner' ? 'info' : s.level === 'intermediate' ? 'warning' : 'error'}
                                          variant="filled"
                                        />
                                      </Stack>
                                    </Stack>
                                  </Stack>
                                </CardContent>
                              </Card>
                            ))}
                          </Box>
                        )}

                        {/* List View */}
                        {subjectsViewMode === 'list' && (
                          <List>
                            {teacherSubjects.map((s, i) => (
                              <Box key={s.id}>
                                <ListItem 
                                  sx={{ py: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                  secondaryAction={
                                    <Tooltip title="Xóa môn này">
                                      <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        onClick={() => handleDeleteSubjectClick(s)}
                                        size="small"
                                      >
                                        <Trash fontSize="var(--icon-fontSize-md)" />
                                      </IconButton>
                                    </Tooltip>
                                  }
                                >
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
                                    sx={{ ml: 1 }}
                                  />
                                </ListItem>
                                {i < teacherSubjects.length - 1 && <Divider />}
                              </Box>
                            ))}
                          </List>
                        )}
                      </Stack>
                    ) : (
                      <Typography color="text.secondary">Chưa được gán môn học nào</Typography>
                    )}
                  </Stack>
                )}

                {/* Tab 2: Lịch dạy */}
                {tabValue === 2 && (
                  <>
                    {Object.keys(teachesByDay).length > 0 ? (
                      <Stack spacing={2} sx={{ overflowY: 'auto', maxHeight: '100%' }}>
                        {Object.keys(teachesByDay).map((day) => (
                          <Box key={day}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>
                              {day}
                            </Typography>
                            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, maxWidth: '100%' }}>
                              <Table size="small" sx={{ tableLayout: 'fixed' }}>
                                <TableHead>
                                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell sx={{ fontWeight: 600, width: '15%' }}>Thời gian</TableCell>
                                    <TableCell sx={{ fontWeight: 600, width: '40%' }}>Môn</TableCell>
                                    <TableCell sx={{ fontWeight: 600, width: '25%' }}>Lớp</TableCell>
                                    <TableCell sx={{ fontWeight: 600, width: '20%', textAlign: 'center' }}>Hành động</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {teachesByDay[day].map((teach: any, idx: number) => {
                                    const subjectsToUse = allSubjectsLoaded.length > 0 ? allSubjectsLoaded : subjects;
                                    const sub = subjectsToUse.find(s => String(s.id) === String(teach.subjectId));
                                    return (
                                      <TableRow key={idx} hover sx={{ height: 'auto' }}>
                                        <TableCell sx={{ width: '15%' }}>
                                          <Typography variant="body2" fontWeight={500} sx={{ whiteSpace: 'nowrap' }}>
                                            {teach.startTime} - {teach.endTime}
                                          </Typography>
                                        </TableCell>
                                        <TableCell sx={{ width: '40%', wordBreak: 'break-word' }}>
                                          <Typography variant="body2">{sub?.name || 'N/A'}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ width: '25%' }}>
                                          <Chip label={teach.className || 'N/A'} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell sx={{ width: '20%', textAlign: 'center' }}>
                                          <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ flexWrap: 'wrap' }}>
                                            <Tooltip title="Sửa lịch dạy">
                                              <IconButton
                                                size="small"
                                                onClick={() => {
                                                  setEditingTeach(teach);
                                                  setEditTeachForm({
                                                    subjectId: teach.subjectId,
                                                    className: teach.className,
                                                    startTime: teach.startTime,
                                                    endTime: teach.endTime,
                                                    dayOfWeek: teach.dayOfWeek,
                                                    classType: teach.classType || 'fixed',
                                                    notes: teach.notes || '',
                                                  });
                                                  setEditingTeachError(null);
                                                  setEditTeachDialogOpen(true);
                                                }}
                                              >
                                                <PencilSimple fontSize="var(--icon-fontSize-md)" />
                                              </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Xóa lịch dạy">
                                              <IconButton
                                                size="small"
                                                onClick={async () => {
                                                  if (!confirm('Bạn có chắc chắn muốn xóa lịch dạy này?')) return;
                                                  try {
                                                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                                                    const endpoint = apiUrl.endsWith('/api') ? `${apiUrl}/teaches/${teach.id}` : `${apiUrl}/api/teaches/${teach.id}`;
                                                    const response = await fetch(endpoint, {
                                                      method: 'DELETE',
                                                    });
                                                    if (response.ok) {
                                                      // Refetch teaches for this teacher
                                                      if (teacher?.id) {
                                                        await fetchByTeacher(teacher.id);
                                                      }
                                                    } else {
                                                      alert('Xóa thất bại');
                                                    }
                                                  } catch (err) {
                                                    alert('Lỗi: ' + (err instanceof Error ? err.message : 'Unknown'));
                                                  }
                                                }}
                                              >
                                                <Trash fontSize="var(--icon-fontSize-md)" />
                                              </IconButton>
                                            </Tooltip>
                                          </Stack>
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

      {/* Delete Subject Confirmation Dialog */}
      <Dialog 
        open={deleteSubjectConfirmOpen} 
        onClose={() => setDeleteSubjectConfirmOpen(false)}
        maxWidth="xs"
      >
        <DialogTitle>Xóa môn học</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          <Typography>
            Bạn có chắc chắn muốn xóa môn <strong>{subjectToDelete?.name}</strong> khỏi danh sách giáo viên này không?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Hành động này sẽ cập nhật thông tin giáo viên nhưng không xóa môn học khỏi hệ thống.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteSubjectConfirmOpen(false)} disabled={deleting}>
            Hủy
          </Button>
          <Button 
            onClick={handleConfirmDeleteSubject} 
            variant="contained" 
            color="error" 
            disabled={deleting}
          >
            {deleting ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Teaching Schedule Dialog */}
      <Dialog 
        open={editTeachDialogOpen} 
        onClose={() => {
          setEditTeachDialogOpen(false);
          setEditingTeach(null);
          setEditTeachForm(null);
          setEditingTeachError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Sửa lịch dạy</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {editingTeachError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editingTeachError}
            </Alert>
          )}
          {editTeachForm && (
            <Stack spacing={2}>
              {/* Subject Select */}
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Môn học</Typography>
                {loadingEditDialogSubjects ? (
                  <CircularProgress size={20} />
                ) : (
                  <select
                    value={editTeachForm.subjectId || ''}
                    onChange={(e) => setEditTeachForm({ ...editTeachForm, subjectId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      fontFamily: 'inherit',
                    }}
                  >
                    <option value="">Chọn môn học</option>
                    {editDialogAllSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </Box>

              {/* Class Name */}
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Tên lớp</Typography>
                <input
                  type="text"
                  value={editTeachForm.className || ''}
                  onChange={(e) => setEditTeachForm({ ...editTeachForm, className: e.target.value })}
                  placeholder="VD: K61CT1"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </Box>

              {/* Day of Week */}
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Ngày trong tuần</Typography>
                <select
                  value={editTeachForm.dayOfWeek || ''}
                  onChange={(e) => setEditTeachForm({ ...editTeachForm, dayOfWeek: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="">Chọn ngày</option>
                  <option value="Thứ 2">Thứ 2</option>
                  <option value="Thứ 3">Thứ 3</option>
                  <option value="Thứ 4">Thứ 4</option>
                  <option value="Thứ 5">Thứ 5</option>
                  <option value="Thứ 6">Thứ 6</option>
                  <option value="Thứ 7">Thứ 7</option>
                  <option value="Chủ nhật">Chủ nhật</option>
                </select>
              </Box>

              {/* Start Time */}
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Giờ bắt đầu</Typography>
                <input
                  type="time"
                  value={editTeachForm.startTime || ''}
                  onChange={(e) => setEditTeachForm({ ...editTeachForm, startTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </Box>

              {/* End Time */}
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Giờ kết thúc</Typography>
                <input
                  type="time"
                  value={editTeachForm.endTime || ''}
                  onChange={(e) => setEditTeachForm({ ...editTeachForm, endTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </Box>

              {/* Class Type */}
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Loại lớp</Typography>
                <select
                  value={editTeachForm.classType || 'fixed'}
                  onChange={(e) => setEditTeachForm({ ...editTeachForm, classType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="fixed">Cố định</option>
                  <option value="shifting">Ca học</option>
                </select>
              </Box>

              {/* Notes */}
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Ghi chú</Typography>
                <textarea
                  value={editTeachForm.notes || ''}
                  onChange={(e) => setEditTeachForm({ ...editTeachForm, notes: e.target.value })}
                  placeholder="Ghi chú thêm..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditTeachDialogOpen(false);
            setEditingTeach(null);
            setEditTeachForm(null);
            setEditingTeachError(null);
          }}>
            Hủy
          </Button>
          <Button 
            onClick={async () => {
              console.log('🔘 Save button clicked', { editTeachForm, editingTeach });
              if (!editTeachForm.subjectId || !editTeachForm.className || !editTeachForm.startTime || !editTeachForm.endTime || !editTeachForm.dayOfWeek) {
                setEditingTeachError('Vui lòng điền đầy đủ thông tin (bao gồm ngày trong tuần)');
                return;
              }
              try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const endpoint = apiUrl.endsWith('/api') ? `${apiUrl}/teaches/${editingTeach.id}` : `${apiUrl}/api/teaches/${editingTeach.id}`;
                
                // Chuẩn bị data đầy đủ
                const updateData = {
                  subjectId: editTeachForm.subjectId,
                  className: editTeachForm.className,
                  startTime: editTeachForm.startTime,
                  endTime: editTeachForm.endTime,
                  dayOfWeek: editTeachForm.dayOfWeek,
                  classType: editTeachForm.classType || 'fixed',
                  notes: editTeachForm.notes || '',
                };
                
                console.log('📤 Saving teach schedule:', { endpoint, data: updateData });
                const response = await fetch(endpoint, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updateData),
                });
                console.log('📡 Response status:', response.status);
                if (response.ok) {
                  const data = await response.json();
                  console.log('✅ Teach schedule saved:', data);
                  setEditTeachDialogOpen(false);
                  setEditingTeach(null);
                  setEditTeachForm(null);
                  setEditingTeachError(null);
                  // Refetch teaches for this teacher
                  if (teacher?.id) {
                    await fetchByTeacher(teacher.id);
                  }
                } else {
                  const errorData = await response.json();
                  console.error('❌ Save failed:', errorData);
                  setEditingTeachError(errorData.message || errorData.error || 'Cập nhật thất bại');
                }
              } catch (err) {
                console.error('❌ Error saving:', err);
                setEditingTeachError('Lỗi: ' + (err instanceof Error ? err.message : 'Unknown'));
              }
            }} 
            variant="contained"
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
