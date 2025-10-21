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
  CircularProgress,
  MenuItem
} from '@mui/material';
import { subjectsService } from '@/services/subjects.service';

interface AddSubjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LEVELS = [
  { value: 'beginner', label: 'Cơ bản' },
  { value: 'intermediate', label: 'Trung cấp' },
  { value: 'advanced', label: 'Nâng cao' }
];

export function AddSubjectDialog({ open, onClose, onSuccess }: AddSubjectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    level: 'beginner',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      setError('Vui lòng nhập tên và mã môn học');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await subjectsService.create(formData);
      setFormData({
        name: '',
        code: '',
        category: '',
        level: 'beginner',
        description: ''
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
        code: '',
        category: '',
        level: 'beginner',
        description: ''
      });
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Thêm môn học mới</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Tên môn học"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <TextField
            fullWidth
            label="Mã môn học"
            name="code"
            value={formData.code}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <TextField
            fullWidth
            label="Loại môn học"
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={loading}
            placeholder="VD: Toán, Lý, Hóa..."
          />
          <TextField
            fullWidth
            select
            label="Cấp độ"
            name="level"
            value={formData.level}
            onChange={handleChange}
            disabled={loading}
          >
            {LEVELS.map(level => (
              <MenuItem key={level.value} value={level.value}>
                {level.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Mô tả"
            name="description"
            value={formData.description}
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
          {loading ? <CircularProgress size={24} /> : 'Thêm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
