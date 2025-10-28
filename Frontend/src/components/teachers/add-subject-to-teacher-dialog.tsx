'use client';

import { useState, useEffect } from 'react';
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
  Autocomplete,
  Typography,
} from '@mui/material';
import { Subject } from '@/types';
import { teachersService } from '@/services/teachers.service';
import { subjectsService } from '@/services/subjects.service';

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
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch tất cả subjects khi dialog mở
  useEffect(() => {
    if (!open) return;

    const fetchAllSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const response = await subjectsService.getAll({ limit: 999 });
        if (response.success && response.data) {
          // Extract học phần từ tên môn (VD: "Bé làm game - học phần 1" → 1)
          const extractSemester = (name: string): number => {
            const match = name.match(/học phần\s*(\d+)/i);
            return match ? parseInt(match[1], 10) : 999; // 999 cho những môn không có học phần
          };
          
          // Sort theo học phần trước, rồi sắp xếp theo tên
          const sorted = [...response.data].sort((a, b) => {
            const semesterA = extractSemester(a.name);
            const semesterB = extractSemester(b.name);
            
            if (semesterA !== semesterB) {
              return semesterA - semesterB; // Sort theo học phần (tăng dần)
            }
            // Nếu cùng học phần, sort theo tên (A-Z)
            return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
          });
          setAllSubjects(sorted);
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchAllSubjects();
  }, [open]);

  const handleClose = () => {
    setSelectedSubjects([]);
    setSearchQuery('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (selectedSubjects.length === 0) {
      setError('Vui lòng chọn ít nhất một môn học');
      return;
    }

    // Kiểm tra có môn nào đã được gán không
    const alreadyAssigned = selectedSubjects.filter(s => 
      currentSubjectIds.includes(s.id)
    );
    
    if (alreadyAssigned.length > 0) {
      setError(`Các môn này đã được gán: ${alreadyAssigned.map(s => s.name).join(', ')}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newSubjectIds = selectedSubjects.map(s => s.id);
      const newSubjectsArray = [...currentSubjectIds, ...newSubjectIds];
      
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

  // Filter out already assigned subjects và apply search
  const availableSubjectsToAdd = allSubjects
    .filter((s) => !currentSubjectIds.includes(s.id))
    .filter((s) => {
      const query = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query);
    });

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
          {/* Search field */}
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm kiếm theo tên hoặc mã môn học (VD: Toán, MATH)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loadingSubjects}
            sx={{ mb: 1 }}
          />

          {loadingSubjects ? (
            <Stack alignItems="center" sx={{ py: 3 }}>
              <CircularProgress size={32} />
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                Đang tải tất cả {allSubjects.length} môn học...
              </Typography>
            </Stack>
          ) : (
            <>
              <Typography variant="caption" color="text.secondary">
                Có {availableSubjectsToAdd.length} môn học có thể thêm {selectedSubjects.length > 0 && `(đã chọn: ${selectedSubjects.length})`}
              </Typography>
              <Autocomplete
                fullWidth
                multiple
                options={availableSubjectsToAdd}
                getOptionLabel={(option) => `${option.name} — ${option.code}`}
                value={selectedSubjects}
                onChange={(_event, newValue) => setSelectedSubjects(newValue)}
                disabled={loading || loadingSubjects}
                loading={loading}
                noOptionsText={searchQuery ? 'Không tìm thấy môn học phù hợp' : 'Tất cả môn đều đã gán'}
                loadingText="Đang tải..."
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Chọn một hoặc nhiều môn học"
                    placeholder="Chọn môn..."
                  />
                )}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
              />
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || selectedSubjects.length === 0}
        >
          {loading ? <CircularProgress size={24} /> : `Lưu (${selectedSubjects.length} môn)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
