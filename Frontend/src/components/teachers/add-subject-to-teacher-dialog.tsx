'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Stack,
  TextField,
  InputAdornment,
  Typography,
} from '@mui/material';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Subject } from '@/types';
import { teachersService } from '@/services/teachers.service';

interface AddSubjectToTeacherDialogProps {
  open: boolean;
  onClose: () => void;
  teacherId: string;
  availableSubjects: Subject[];
  currentSubjectIds: string[];
  onSuccess: () => void;
}

export function AddSubjectToTeacherDialog({
  open,
  onClose,
  teacherId,
  availableSubjects,
  currentSubjectIds,
  onSuccess,
}: AddSubjectToTeacherDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const handleClose = () => {
    setSelectedSubjectId('');
    setSearchQuery('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedSubjectId) return;

    if (currentSubjectIds.includes(selectedSubjectId)) {
      setError('Môn học này đã được gán cho giáo viên');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newSubjectsArray = [...currentSubjectIds, selectedSubjectId];
      
      const response = await teachersService.update(teacherId, {
        subjects: newSubjectsArray,
      });

      if (!response.success) {
        setError(response.error || 'Có lỗi xảy ra khi cập nhật');
        return;
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = availableSubjects.filter(
    (s) =>
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase())) &&
      !currentSubjectIds.includes(s.id)
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Thêm môn học cho giáo viên
        {currentSubjectIds.length > 0 && (
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
            Đã gán: {currentSubjectIds.length} môn
          </Typography>
        )}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm môn học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MagnifyingGlass size={20} />
                </InputAdornment>
              ),
            }}
          />

          <Stack spacing={1}>
            <label htmlFor="subject-select" style={{ fontWeight: 500, fontSize: '0.875rem' }}>
              Chọn môn học
            </label>
            <select
              id="subject-select"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <option value="">-- Chọn môn học --</option>
              {filteredSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} — {subject.code}
                </option>
              ))}
            </select>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !selectedSubjectId}
        >
          {loading ? <CircularProgress size={24} /> : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
