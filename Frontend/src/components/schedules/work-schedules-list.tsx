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
import { WorkSchedule } from '@/types/schedule';
import { useWorkSchedules } from '@/hooks/useWorkSchedules';

export function WorkSchedulesList() {
  const { workSchedules, loading, error, fetchAll, create, update, remove } = useWorkSchedules();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<WorkSchedule>>({
    teacherId: '',
    dayOfWeek: 'Thứ 2',
    shift: 'Sáng',
    startTime: '08:00',
    endTime: '12:00',
    duration: 4,
    status: 'scheduled',
    notes: '',
  });

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleOpen = (schedule?: WorkSchedule) => {
    if (schedule) {
      setFormData(schedule);
      setEditingId(schedule.id);
    } else {
      setFormData({
        teacherId: '',
        dayOfWeek: 'Thứ 2',
        shift: 'Sáng',
        startTime: '08:00',
        endTime: '12:00',
        duration: 4,
        status: 'scheduled',
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
        await create(formData as Omit<WorkSchedule, 'id' | 'createdAt' | 'updatedAt'>);
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
    active: 'success',
    completed: 'info',
    cancelled: 'error',
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Button variant="contained" onClick={() => handleOpen()} sx={{ mb: 2 }}>
        ➕ Thêm Ca Làm
      </Button>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Giáo viên</TableCell>
                <TableCell>Ngày</TableCell>
                <TableCell>Ca</TableCell>
                <TableCell>Thời gian</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workSchedules.length > 0 ? (
                workSchedules.map((ws) => (
                  <TableRow key={ws.id} hover>
                    <TableCell sx={{ fontSize: '0.9rem' }}>{ws.teacherId}</TableCell>
                    <TableCell>{ws.dayOfWeek}</TableCell>
                    <TableCell>
                      <Chip
                        label={ws.shift}
                        color={ws.shift === 'Sáng' ? 'primary' : ws.shift === 'Chiều' ? 'warning' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {ws.startTime} - {ws.endTime}
                    </TableCell>
                    <TableCell>{ws.duration}h</TableCell>
                    <TableCell>
                      <Chip label={ws.status} size="small" color={statusColors[ws.status]} />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => handleOpen(ws)}>
                        Sửa
                      </Button>
                      <Button size="small" color="error" onClick={() => handleDelete(ws.id)}>
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
        <DialogTitle>{editingId ? '✏️ Sửa Ca Làm' : '➕ Thêm Ca Làm'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
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

          <FormControl fullWidth size="small">
            <InputLabel>Ca làm</InputLabel>
            <Select
              value={formData.shift || 'Sáng'}
              onChange={(e) => setFormData({ ...formData, shift: e.target.value as any })}
              label="Ca làm"
            >
              {['Sáng', 'Chiều', 'Tối'].map((shift) => (
                <MenuItem key={shift} value={shift}>
                  {shift}
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
            value={formData.endTime || '12:00'}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Thời lượng (giờ)"
            type="number"
            value={formData.duration || 4}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
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
              {['scheduled', 'active', 'completed', 'cancelled'].map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
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
