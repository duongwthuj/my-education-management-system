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
import { TeachingSchedule } from '@/types/schedule';
import { useTeachingSchedules } from '@/hooks/useTeachingSchedules';

export function TeachingSchedulesList() {
  const { teachingSchedules, loading, error, fetchAll, create, update, remove } = useTeachingSchedules();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<TeachingSchedule>>({
    workScheduleId: '',
    teacherId: '',
    subjectId: '',
    classId: '',
    dayOfWeek: 'Thứ 2',
    startTime: '08:00',
    endTime: '10:00',
    room: 'A101',
    status: 'scheduled',
    description: '',
  });

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleOpen = (schedule?: TeachingSchedule) => {
    if (schedule) {
      setFormData(schedule);
      setEditingId(schedule.id);
    } else {
      setFormData({
        workScheduleId: '',
        teacherId: '',
        subjectId: '',
        classId: '',
        dayOfWeek: 'Thứ 2',
        startTime: '08:00',
        endTime: '10:00',
        room: 'A101',
        status: 'scheduled',
        description: '',
      });
      setEditingId(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await update(editingId, formData);
      } else {
        await create(formData as Omit<TeachingSchedule, 'id' | 'createdAt' | 'updatedAt'>);
      }
      handleClose();
    } catch (err) {
      console.error('Lỗi lưu:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn chắc chắn muốn xóa?')) {
      await remove(id);
    }
  };

  const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    scheduled: 'default',
    'in-progress': 'info',
    completed: 'success',
    cancelled: 'error',
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Button variant="contained" onClick={() => handleOpen()} sx={{ mb: 2 }}>
        ➕ Thêm Lịch Giảng
      </Button>

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
                <TableCell>Môn học</TableCell>
                <TableCell>Lớp</TableCell>
                <TableCell>Phòng</TableCell>
                <TableCell>Thời gian</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teachingSchedules.length > 0 ? (
                teachingSchedules.map((ts) => (
                  <TableRow key={ts.id} hover>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{ts.teacherId}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{ts.subjectId}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{ts.classId}</TableCell>
                    <TableCell>{ts.room}</TableCell>
                    <TableCell>
                      {ts.startTime} - {ts.endTime}
                    </TableCell>
                    <TableCell>
                      <Chip label={ts.status} size="small" color={statusColors[ts.status]} />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => handleOpen(ts)}>
                        Sửa
                      </Button>
                      <Button size="small" color="error" onClick={() => handleDelete(ts.id)}>
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? '✏️ Sửa Lịch Giảng' : '➕ Thêm Lịch Giảng'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Work Schedule ID"
            value={formData.workScheduleId || ''}
            onChange={(e) => setFormData({ ...formData, workScheduleId: e.target.value })}
            fullWidth
            size="small"
          />

          <TextField
            label="Teacher ID"
            value={formData.teacherId || ''}
            onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
            fullWidth
            size="small"
          />

          <TextField
            label="Subject ID"
            value={formData.subjectId || ''}
            onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
            fullWidth
            size="small"
          />

          <TextField
            label="Class ID"
            value={formData.classId || ''}
            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
            fullWidth
            size="small"
          />

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
            value={formData.startTime || '08:00'}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Giờ kết thúc"
            type="time"
            value={formData.endTime || '10:00'}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Phòng học"
            value={formData.room || ''}
            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
            fullWidth
            size="small"
          />

          <FormControl fullWidth size="small">
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={formData.status || 'scheduled'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              label="Trạng thái"
            >
              {['scheduled', 'in-progress', 'completed', 'cancelled'].map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Mô tả"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            size="small"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Hủy</Button>
          <Button onClick={handleSave} variant="contained">
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
