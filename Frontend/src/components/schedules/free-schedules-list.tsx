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
import { FreeSchedule } from '@/types/schedule';
import { useFreeSchedules } from '@/hooks/useFreeSchedules';

export function FreeSchedulesList() {
  const { freeSchedules, loading, error, fetchAll, create, update, remove } = useFreeSchedules();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FreeSchedule>>({
    workScheduleId: '',
    teacherId: '',
    dayOfWeek: 'Thứ 2',
    startTime: '12:00',
    endTime: '13:00',
    reason: 'break',
    notes: '',
  });

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
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await update(editingId, formData);
      } else {
        await create(formData as Omit<FreeSchedule, 'id' | 'createdAt' | 'updatedAt'>);
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

      <Button variant="contained" onClick={() => handleOpen()} sx={{ mb: 2 }}>
        ➕ Thêm Lịch Rảnh
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
                <TableCell>Ngày</TableCell>
                <TableCell>Thời gian</TableCell>
                <TableCell>Lý do</TableCell>
                <TableCell>Ghi chú</TableCell>
                <TableCell align="right">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {freeSchedules.length > 0 ? (
                freeSchedules.map((fs) => (
                  <TableRow key={fs.id} hover>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{fs.teacherId}</TableCell>
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
                ))
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

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? '✏️ Sửa Lịch Rảnh' : '➕ Thêm Lịch Rảnh'}</DialogTitle>
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
          <Button onClick={handleSave} variant="contained">
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
