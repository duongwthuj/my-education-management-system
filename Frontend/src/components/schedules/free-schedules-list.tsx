'use client';

import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
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
import { FreeSchedule } from '@/types/schedule';
import { useFreeSchedules } from '@/hooks/useFreeSchedules';
import { useTeachers } from '@/hooks/use-teachers';

export const FreeSchedulesList = forwardRef(function FreeSchedulesListComponent(_props, ref) {
  const { freeSchedules, loading, error, fetchAll, create, update, remove } = useFreeSchedules();
  const { teachers } = useTeachers();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FreeSchedule>>({
    workScheduleId: '',
    teacherId: '',
    dayOfWeek: 'Thứ 2',
    startTime: '12:00',
    endTime: '13:00',
    reason: 'break',
    notes: '',
  });

  // Expose refetch method to parent
  useImperativeHandle(ref, () => ({
    refetch: async () => {
      console.log('🔄 FreeSchedulesList: Refetching from parent trigger...');
      await fetchAll();
    },
  }), [fetchAll]);

  // Filter schedules by selected teacher
  const filteredFreeSchedules = selectedTeacherId 
    ? freeSchedules.filter(fs => String(fs.teacherId) === selectedTeacherId)
    : freeSchedules;

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleOpen = (schedule?: FreeSchedule) => {
    if (schedule) {
      setFormData(schedule);
      setEditingId(schedule.id);
    } else {
      setFormData({
        workScheduleId: '',
        teacherId: '',
        dayOfWeek: 'Thứ 2',
        startTime: '12:00',
        endTime: '13:00',
        reason: 'break',
        notes: '',
      });
      setEditingId(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setSubmitError(null);
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      // Validation
      if (!formData.teacherId || !formData.dayOfWeek || !formData.startTime || !formData.endTime || !formData.reason) {
        setSubmitError('Vui lòng điền tất cả các trường bắt buộc');
        return;
      }

      if (editingId) {
        await update(editingId, formData);
      } else {
        await create(formData as Omit<FreeSchedule, 'id' | 'createdAt' | 'updatedAt'>);
      }
      
      await fetchAll();
      handleClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lịch rảnh này?')) {
      return;
    }
    
    try {
      await remove(id);
      await fetchAll();
    } catch (err) {
      alert('Lỗi xóa: ' + (err instanceof Error ? err.message : 'Có lỗi xảy ra'));
    }
  };

  const reasonLabels: Record<string, string> = {
    break: '☕ Giải lao',
    lunch: '🍽️ Ăn trưa',
    other: '📝 Khác',
  };

  const reasonColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    break: 'info',
    lunch: 'success',
    other: 'warning',
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
        <Button variant="contained" onClick={() => handleOpen()}>
          ➕ Thêm Lịch Rảnh
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Giáo viên</TableCell>
                <TableCell>Ngày</TableCell>
                <TableCell>Thời gian</TableCell>
                <TableCell>Lý do</TableCell>
                <TableCell>Ghi chú</TableCell>
                <TableCell align="right">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFreeSchedules.length > 0 ? (
                filteredFreeSchedules.map((fs) => {
                  return (
                  <TableRow key={fs.id} hover>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{(fs as any).teacherName || 'N/A'}</TableCell>
                    <TableCell>{fs.dayOfWeek}</TableCell>
                    <TableCell>
                      {fs.startTime} - {fs.endTime}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={reasonLabels[fs.reason] || fs.reason}
                        size="small"
                        color={reasonColors[fs.reason]}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{fs.notes}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => handleOpen(fs)}>
                        Sửa
                      </Button>
                      <Button size="small" color="error" onClick={() => handleDelete(fs.id)}>
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ elevation: 8 }}>
        <DialogTitle>{editingId ? '✏️ Sửa Lịch Rảnh' : '➕ Thêm Lịch Rảnh'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {submitError && <Alert severity="error">{submitError}</Alert>}
          
          <FormControl fullWidth size="small">
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

          <FormControl fullWidth size="small">
            <InputLabel>Ngày trong tuần</InputLabel>
            <Select
              value={formData.dayOfWeek || 'Thứ 2'}
              onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
              label="Ngày trong tuần"
            >
              {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'].map((day) => (
                <MenuItem key={day} value={day}>
                  {day}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Giờ bắt đầu"
            type="time"
            value={formData.startTime || '12:00'}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Giờ kết thúc"
            type="time"
            value={formData.endTime || '13:00'}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth size="small">
            <InputLabel>Lý do</InputLabel>
            <Select
              value={formData.reason || 'break'}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value as any })}
              label="Lý do"
            >
              <MenuItem value="break">☕ Giải lao</MenuItem>
              <MenuItem value="lunch">🍽️ Ăn trưa</MenuItem>
              <MenuItem value="other">📝 Khác</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Ghi chú"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            fullWidth
            size="small"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Hủy</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Đang xử lý...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});
