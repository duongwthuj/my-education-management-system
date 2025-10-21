'use client';

import { useState } from 'react';
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
import { teachersService } from '@/services/teachers.service';

interface AddTeacherDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTeacherDialog({ open, onClose, onSuccess }: AddTeacherDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('Vui lòng nhập tên và số điện thoại');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await teachersService.create({
        ...formData,
        subjects: []
      });
      setFormData({
        name: '',
        phone: ''
      });
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
      setFormData({
        name: '',
        phone: ''
      });
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Thêm giáo viên mới</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Tên giáo viên"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <TextField
            fullWidth
            label="Số điện thoại"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
            required
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
          {loading ? <CircularProgress size={24} /> : 'Thêm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
