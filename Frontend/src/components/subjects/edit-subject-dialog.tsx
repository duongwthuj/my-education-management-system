'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Subject } from '@/types';
import { subjectsService } from '@/services/subjects.service';

interface EditSubjectDialogProps {
  open: boolean;
  onClose: () => void;
  subject: Subject;
  onSuccess: () => void;
}

export function EditSubjectDialog({
  open,
  onClose,
  subject,
  onSuccess,
}: EditSubjectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: subject.name,
    code: subject.code,
    description: subject.description,
    category: subject.category,
    level: subject.level,
  });

  useEffect(() => {
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description,
      category: subject.category,
      level: subject.level,
    });
  }, [subject, open]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Tên môn học là bắt buộc');
      return;
    }
    if (!formData.code.trim()) {
      setError('Mã môn học là bắt buộc');
      return;
    }
    if (!formData.description.trim()) {
      setError('Mô tả là bắt buộc');
      return;
    }
    if (!formData.category.trim()) {
      setError('Danh mục là bắt buộc');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await subjectsService.update(subject.id, formData);

      if (!response.success) {
        setError(response.error || 'Có lỗi xảy ra');
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Chỉnh sửa môn học</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

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
            label="Mã môn"
            name="code"
            value={formData.code}
            onChange={handleChange}
            disabled={loading}
            required
            inputProps={{ style: { textTransform: 'uppercase' } }}
          />

          <TextField
            fullWidth
            label="Mô tả"
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={loading}
            required
            multiline
            rows={3}
          />

          <TextField
            fullWidth
            label="Danh mục"
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={loading}
            required
          />

          <FormControl fullWidth disabled={loading}>
            <InputLabel>Cấp độ</InputLabel>
            <Select
              name="level"
              value={formData.level}
              onChange={handleChange}
              label="Cấp độ"
            >
              <MenuItem value="beginner">Cơ bản</MenuItem>
              <MenuItem value="intermediate">Trung cấp</MenuItem>
              <MenuItem value="advanced">Nâng cao</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
