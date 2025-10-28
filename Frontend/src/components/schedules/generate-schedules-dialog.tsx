'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Typography,
  Stack,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { Sparkle } from '@phosphor-icons/react';
import { useTeachers } from '@/hooks/use-teachers';

interface GenerateSchedulesDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface GenerateResult {
  workSchedulesProcessed: number;
  teachingSchedulesGenerated: number;
  freeSchedulesGenerated: number;
}

export function GenerateSchedulesDialog({ open, onClose, onSuccess }: GenerateSchedulesDialogProps) {
  const { teachers } = useTeachers();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setResult(null);
    setGenerating(true);

    try {
      const body = selectedTeacherId === 'all' ? {} : { teacherId: selectedTeacherId };
      
      const response = await fetch('http://localhost:5000/api/import-schedules/generate-teaching-and-free', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else {
        setError(data.error || 'Tạo lịch thất bại');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setSelectedTeacherId('all');
    setError(null);
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <Sparkle size={24} weight="fill" />
          <Typography variant="h6">Tạo Lịch Dạy & Lịch Trống</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {result && (
            <Alert severity="success">
              <Typography variant="subtitle2" gutterBottom>
                ✅ Tạo lịch thành công!
              </Typography>
              <Typography variant="body2">
                • {result.workSchedulesProcessed} ca làm việc đã xử lý
              </Typography>
              <Typography variant="body2">
                • {result.teachingSchedulesGenerated} lịch dạy
              </Typography>
              <Typography variant="body2">
                • {result.freeSchedulesGenerated} lịch trống được tạo
              </Typography>
            </Alert>
          )}

          <Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Chức năng này sẽ tự động tạo lịch dạy và lịch trống cho giáo viên dựa trên:
            </Typography>
            <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 2 }}>
              <li>Lịch làm việc (WorkSchedule) đã có trong database</li>
              <li>Lịch dạy (TeachingSchedule) hiện có</li>
              <li>Tính toán các khoảng thời gian trống → tạo FreeSchedule</li>
            </Typography>
          </Box>

          <FormControl fullWidth>
            <InputLabel>Chọn giáo viên</InputLabel>
            <Select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              disabled={generating}
            >
              <MenuItem value="all">
                <em>Tất cả giáo viên</em>
              </MenuItem>
              {teachers.map((teacher) => (
                <MenuItem key={teacher.id} value={teacher.id}>
                  {teacher.name} - {teacher.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Alert severity="warning">
            <Typography variant="caption">
              ⚠️ Lưu ý: Các lịch trống cũ sẽ bị xóa và tạo lại mới
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={generating}>
          Hủy
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          disabled={generating}
          startIcon={generating ? <CircularProgress size={16} /> : <Sparkle weight="fill" />}
        >
          {generating ? 'Đang tạo...' : 'Tạo lịch'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
