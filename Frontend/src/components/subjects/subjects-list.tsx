'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Pagination,
  Stack,
  SvgIcon,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { MagnifyingGlass, Plus, FunnelSimple } from '@phosphor-icons/react';
import { SubjectCard } from './subject-card';
import { useSubjects } from '@/hooks/use-subjects';
import { AddSubjectDialog } from './add-subject-dialog';
import { subjectsService } from '@/services/subjects.service';
import { Subject } from '@/types';

export function SubjectsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>(['all']);
  const { subjects, loading, error, pagination, refetch, onPageChange } = useSubjects();

  // Tạo filters object từ state
  const currentFilters = useMemo(() => {
    const filters: { category?: string; level?: string; search?: string } = {};
    if (selectedCategory !== 'all') filters.category = selectedCategory;
    if (selectedLevel !== 'all') filters.level = selectedLevel;
    if (searchQuery) filters.search = searchQuery;
    return filters;
  }, [selectedCategory, selectedLevel, searchQuery]);

  // Fetch categories từ backend để hiển thị tabs
  useEffect(() => {
    const fetchCategories = async () => {
      const response = await subjectsService.getAll({ limit: 1000 }); // Lấy nhiều để có đủ categories
      if (response.success && response.data) {
        const unique = Array.from(new Set(response.data.map((s) => s.category)));
        setAllCategories(['all', ...unique]);
      }
    };
    fetchCategories();
  }, []);

  // Refetch khi filters thay đổi
  useEffect(() => {
    refetch(1, 12, currentFilters);
  }, [currentFilters]);

  // Không cần filter ở client nữa vì đã filter ở backend
  const filteredSubjects = subjects;

  const stats = useMemo(() => {
    // Level count và category count giờ dựa trên pagination.total vì đã filter ở backend
    return { 
      total: pagination.total, 
      filtered: pagination.total, // Số lượng đã được filter ở backend
      levelCount: {
        beginner: 0, // Có thể thêm API riêng để lấy stats nếu cần
        intermediate: 0,
        advanced: 0,
      },
      categoryCount: {} as Record<string, number>,
      currentPage: pagination.page,
      totalPages: pagination.totalPages,
    };
  }, [pagination]);

  const handleDeleteClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSubject) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await subjectsService.delete(selectedSubject.id);
      setDeleteDialogOpen(false);
      setSelectedSubject(null);
      refetch(pagination.page, pagination.limit, currentFilters);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setDeleting(false);
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    onPageChange(page, currentFilters);
  };

  const handleRefetch = () => {
    refetch(1, 12, currentFilters);
  };

  return (
    <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
            <Stack spacing={1}>
              <Typography variant="h4">Quản lý môn học</Typography>
              <Typography color="text.secondary" variant="subtitle2">
                Quản lý danh sách và thông tin các môn học
              </Typography>
            </Stack>
            <Button startIcon={<Plus fontSize="var(--icon-fontSize-md)" />} variant="contained" disabled={loading} onClick={() => setOpenDialog(true)}>
              Thêm môn học
            </Button>
          </Stack>

          <Card sx={{ p: 3 }}>
            {error && (
              <Alert severity="error" onClose={handleRefetch} sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
              <Stack spacing={1}>
                <Typography variant="h6">Tổng quan</Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ p: 1.5, bgcolor: 'primary.lighter', borderRadius: 1 }}>
                    <Typography variant="h4" color="primary.main">{loading ? '...' : stats.total}</Typography>
                  </Box>
                  <Typography variant="body1">môn học</Typography>
                </Stack>
              </Stack>

              <Stack spacing={1}>
                <Typography variant="h6">Theo cấp độ</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip 
                    label={selectedLevel === 'beginner' ? 'Cơ bản (đang lọc)' : 'Cơ bản'} 
                    color="info" 
                    variant={selectedLevel === 'beginner' ? 'filled' : 'outlined'} 
                    onClick={() => setSelectedLevel(selectedLevel === 'beginner' ? 'all' : 'beginner')} 
                  />
                  <Chip 
                    label={selectedLevel === 'intermediate' ? 'Trung cấp (đang lọc)' : 'Trung cấp'} 
                    color="warning" 
                    variant={selectedLevel === 'intermediate' ? 'filled' : 'outlined'} 
                    onClick={() => setSelectedLevel(selectedLevel === 'intermediate' ? 'all' : 'intermediate')} 
                  />
                  <Chip 
                    label={selectedLevel === 'advanced' ? 'Nâng cao (đang lọc)' : 'Nâng cao'} 
                    color="error" 
                    variant={selectedLevel === 'advanced' ? 'filled' : 'outlined'} 
                    onClick={() => setSelectedLevel(selectedLevel === 'advanced' ? 'all' : 'advanced')} 
                  />
                </Stack>
              </Stack>

              <Stack spacing={1}>
                <Typography variant="h6">Kết quả {currentFilters.category || currentFilters.level || currentFilters.search ? 'lọc' : ''}</Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="h4" color="text.primary">{loading ? '...' : stats.filtered}</Typography>
                  <Typography variant="body2" color="text.secondary">môn học</Typography>
                </Stack>
              </Stack>
            </Box>
          </Card>

          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={selectedCategory === 'all' ? 0 : Math.max(0, allCategories.indexOf(selectedCategory))} 
                onChange={(_, value) => setSelectedCategory(allCategories[value])} 
                variant="scrollable" 
                scrollButtons="auto"
              >
                {allCategories.map((category, index) => (
                  <Tab key={index} label={category === 'all' ? 'Tất cả' : category} />
                ))}
              </Tabs>
            </Box>
            <Box sx={{ p: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ p: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên, mã hoặc loại môn học"
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SvgIcon fontSize="small">
                          <MagnifyingGlass />
                        </SvgIcon>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button variant="contained" startIcon={<FunnelSimple fontSize="var(--icon-fontSize-md)" />} disabled={loading}>
                  Lọc nâng cao
                </Button>
              </Stack>
            </Box>
          </Card>

          <Box sx={{ pt: 3 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : filteredSubjects.length === 0 ? (
              <Card sx={{ p: 6, textAlign: 'center' }}>
                <Typography variant="h6">Không tìm thấy môn học nào</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Vui lòng thử với tiêu chí tìm kiếm khác hoặc xóa bộ lọc hiện tại
                </Typography>
              </Card>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                {filteredSubjects.map((subject) => (
                  <Box key={subject.id}>
                    <SubjectCard subject={subject} onDeleteClick={handleDeleteClick} />
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {filteredSubjects.length > 0 && !loading && (
            <Card sx={{ p: 2 }}>
              <Stack spacing={2} alignItems="center">
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Hiển thị {(stats.currentPage - 1) * pagination.limit + 1} - {Math.min(stats.currentPage * pagination.limit, stats.total)} / {stats.total} môn học
                  </Typography>
                </Stack>
                <Pagination 
                  count={stats.totalPages} 
                  page={stats.currentPage} 
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </Stack>
            </Card>
          )}
        </Stack>
      </Container>
      <AddSubjectDialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        onSuccess={() => refetch(1, pagination.limit, currentFilters)}
      />
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xóa môn học</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
          <Typography>
            Bạn có chắc chắn muốn xóa môn học <strong>{selectedSubject?.name}</strong> không?
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Hủy</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deleting}>
            {deleting ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}