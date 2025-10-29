'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Teach } from '@/types/schedule';
import { useTeaches } from '@/hooks/useTeaches';
import { useTeachers } from '@/hooks/use-teachers';
import { useSubjects } from '@/hooks/use-subjects';

export function TeachesList() {
  const { teaches, loading, error, fetchAll } = useTeaches();
  const { teachers } = useTeachers();
  const { subjects } = useSubjects();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [allSubjects, setAllSubjects] = useState<typeof subjects>([]);
  const [formData, setFormData] = useState<Partial<Teach>>({
    teacherId: '',
    subjectId: '',
    className: '',
    classType: 'fixed',
    dayOfWeek: 'Thứ 2',
    startTime: '08:00',
    endTime: '10:00',
    notes: '',
  });

  // Fetch all subjects on mount
  useEffect(() => {
    const fetchAllSubjects = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const url = apiUrl.endsWith('/api') ? `${apiUrl}/subjects?limit=999` : `${apiUrl}/api/subjects?limit=999`;
        console.log('🔍 Fetching all subjects from:', url);
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Fetched subjects:', {
            count: data.data?.length,
            firstSubject: data.data?.[0],
            lastSubject: data.data?.[data.data.length - 1],
          });
          if (data.success && Array.isArray(data.data)) {
            setAllSubjects(data.data);
          }
        } else {
          console.error('❌ Failed to fetch subjects:', response.status);
        }
      } catch (err) {
        console.error('❌ Failed to fetch all subjects:', err);
      }
    };
    fetchAllSubjects();
  }, []);

  // Filter teaches by selected teacher
  const filteredTeaches = selectedTeacherId 
    ? teaches.filter(t => String(t.teacherId) === selectedTeacherId)
    : teaches;

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleOpen = () => {
    setFormData({
      teacherId: '',
      subjectId: '',
      className: '',
      classType: 'fixed',
      dayOfWeek: 'Thứ 2',
      startTime: '08:00',
      endTime: '10:00',
      notes: '',
    });
    setEditingId(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      // Validation
      if (!formData.teacherId || !formData.subjectId || !formData.className || !formData.dayOfWeek || !formData.startTime || !formData.endTime) {
        setSubmitError('Vui lòng điền tất cả các trường bắt buộc');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const endpoint = apiUrl.endsWith('/api') ? `${apiUrl}/teaches` : `${apiUrl}/api/teaches`;

      console.log('📤 Creating teach with data:', formData);
      console.log('📤 Endpoint:', endpoint);

      // Create
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      console.log('📡 Response status:', response.status);
      
      const responseData = await response.json();
      console.log('📡 Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Lỗi tạo phân công dạy');
      }

      console.log('✅ Teach created successfully');
      await fetchAll();
      handleClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      console.error('❌ Error creating teach:', errorMsg);
      setSubmitError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phân công dạy này?')) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const endpoint = apiUrl.endsWith('/api') ? `${apiUrl}/teaches/${id}` : `${apiUrl}/api/teaches/${id}`;

      console.log('🗑️ Deleting teach with id:', id);
      console.log('🗑️ Endpoint:', endpoint);

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      console.log('📡 Delete response status:', response.status);
      
      const responseData = await response.json();
      console.log('📡 Delete response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Lỗi xóa phân công dạy');
      }

      console.log('✅ Teach deleted successfully');
      await fetchAll();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      console.error('❌ Error deleting teach:', errorMsg);
      alert('Lỗi xóa: ' + errorMsg);
    }
  };

  const classTypeColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    fixed: 'success',
    session: 'info',
  };

  const classTypeLabels: Record<string, string> = {
    fixed: 'Lớp cố định',
    session: 'Lớp ngoài khóa',
  };

  const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'flex-end' }}>
        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel>Lọc theo giáo viên</InputLabel>
          <Select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            label="Lọc theo giáo viên"
          >
            <MenuItem value="">Tất cả giáo viên</MenuItem>
            {teachers.map((teacher) => (
              <MenuItem key={teacher.id} value={String(teacher.id)}>
                {teacher.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          onClick={() => handleOpen()}
        >
          + Thêm phân công dạy
        </Button>
      </Box>

      {teaches.length === 0 ? (
        <Alert severity="info">Chưa có phân công dạy nào</Alert>
      ) : filteredTeaches.length === 0 ? (
        <Alert severity="info">Không tìm thấy phân công dạy cho giáo viên được chọn</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600 }}>Giáo viên</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Môn học</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Lớp</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Loại</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Thứ</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Giờ</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ghi chú</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTeaches.map((teach) => {
                const teacher = teachers.find(t => String(t.id) === String(teach.teacherId));
                const subjectsToUse = allSubjects.length > 0 ? allSubjects : subjects;
                const subject = subjectsToUse.find(s => String(s.id) === String(teach.subjectId));
                
                // Debug - log first record
                if (teach === filteredTeaches[0]) {
                  console.log('🔍 TeachesList DEBUG - First Teach:', teach);
                  console.log('🔍 TeachesList DEBUG - Teach SubjectId:', teach.subjectId);
                  console.log('🔍 TeachesList DEBUG - All Subjects Loaded:', allSubjects.length);
                  console.log('🔍 TeachesList DEBUG - First Subject from API:', allSubjects[0]);
                  console.log('🔍 TeachesList DEBUG - Found Subject Match:', subject);
                  console.log('🔍 TeachesList DEBUG - Subject Hook Length:', subjects.length);
                }

                return (
                  <TableRow key={teach.id} hover>
                    <TableCell>{teacher?.name || 'N/A'}</TableCell>
                    <TableCell>{subject?.name || 'N/A'}</TableCell>
                    <TableCell>{teach.className || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={classTypeLabels[teach.classType] || teach.classType}
                        color={classTypeColors[teach.classType] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{teach.dayOfWeek}</TableCell>
                    <TableCell>{teach.startTime} - {teach.endTime}</TableCell>
                    <TableCell>{teach.notes || '-'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Button
                        size="small"
                        onClick={() => teach.id && handleDelete(teach.id)}
                        color="error"
                      >
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm phân công dạy</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {submitError && <Alert severity="error">{submitError}</Alert>}
          <FormControl fullWidth>
            <InputLabel>Giáo viên</InputLabel>
            <Select
              value={formData.teacherId || ''}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              label="Giáo viên"
            >
              {teachers.map((teacher) => (
                <MenuItem key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Môn học</InputLabel>
            <Select
              value={formData.subjectId || ''}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              label="Môn học"
            >
              {(allSubjects.length > 0 ? allSubjects : subjects).map((subject) => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Loại lớp</InputLabel>
            <Select
              value={formData.classType || 'fixed'}
              onChange={(e) => setFormData({ ...formData, classType: e.target.value as 'fixed' | 'session' })}
              label="Loại lớp"
            >
              <MenuItem value="fixed">Lớp cố định</MenuItem>
              <MenuItem value="session">Lớp ngoài khóa</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Tên lớp"
            value={formData.className || ''}
            onChange={(e) => setFormData({ ...formData, className: e.target.value })}
            placeholder="VD: Lớp 10A"
          />

          <FormControl fullWidth>
            <InputLabel>Thứ trong tuần</InputLabel>
            <Select
              value={formData.dayOfWeek || 'Thứ 2'}
              onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
              label="Thứ trong tuần"
            >
              {daysOfWeek.map((day) => (
                <MenuItem key={day} value={day}>
                  {day}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Giờ bắt đầu"
            type="time"
            value={formData.startTime || '08:00'}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label="Giờ kết thúc"
            type="time"
            value={formData.endTime || '10:00'}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label="Ghi chú"
            multiline
            rows={2}
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Hủy</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Đang xử lý...' : 'Tạo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
