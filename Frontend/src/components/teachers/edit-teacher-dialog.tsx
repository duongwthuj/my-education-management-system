'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress
} from '@mui/material';
import { Teacher } from '@/types';
import { teachersService } from '@/services/teachers.service';

interface EditTeacherDialogProps {
  open: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  onSuccess: () => void;
}

export function EditTeacherDialog({ open, onClose, teacher, onSuccess }: EditTeacherDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: teacher?.name || '',
    email: teacher?.email || '',
    phone: teacher?.phone || '',
    address: teacher?.address || '',
    education: teacher?.education || '',
    bio: teacher?.bio || ''
  });

  // Update form data when teacher changes
  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name || '',
        email: teacher.email || '',
        phone: teacher.phone || '',
        address: teacher.address || '',
        education: teacher.education || '',
        bio: teacher.bio || ''
      });
      setError(null);
    }
  }, [teacher]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('Vui lòng nhập tên, email và điện thoại');
      return;
    }

    if (!teacher) return;
    setLoading(true);
    setError(null);

    try {
      const response = await teachersService.update(teacher.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        education: formData.education.trim(),
        bio: formData.bio.trim()
      });

      if (!response.success) {
        setError(response.error || 'Có lỗi xảy ra khi cập nhật');
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Chỉnh sửa giáo viên</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Tên"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <TextField
            fullWidth
            label="Điện thoại"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <TextField
            fullWidth
            label="Địa chỉ"
            name="address"
            value={formData.address}
            onChange={handleChange}
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Bằng cấp"
            name="education"
            value={formData.education}
            onChange={handleChange}
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Mô tả"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            disabled={loading}
            multiline
            rows={3}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Hủy</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
