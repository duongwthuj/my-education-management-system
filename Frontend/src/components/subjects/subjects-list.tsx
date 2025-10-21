'use client';

import { useState, useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  InputAdornment,
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

export function SubjectsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const { subjects, loading, error, refetch } = useSubjects();

  const categories = useMemo(() => {
    const unique = Array.from(new Set(subjects.map((s) => s.category)));
    return ['all', ...unique];
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return subjects.filter((subject) => {
      const matchesSearch =
        subject.name.toLowerCase().includes(query) ||
        subject.code.toLowerCase().includes(query) ||
        subject.category.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === 'all' || subject.category === selectedCategory;
      const matchesLevel = selectedLevel === 'all' || subject.level === selectedLevel;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [subjects, searchQuery, selectedCategory, selectedLevel]);

  const stats = useMemo(() => {
    const levelCount = {
      beginner: subjects.filter((s) => s.level === 'beginner').length,
      intermediate: subjects.filter((s) => s.level === 'intermediate').length,
      advanced: subjects.filter((s) => s.level === 'advanced').length,
    };
    const categoryCount = categories
      .filter((c) => c !== 'all')
      .reduce((acc, c) => {
        acc[c] = subjects.filter((s) => s.category === c).length;
        return acc;
      }, {} as Record<string, number>);
    return { total: subjects.length, filtered: filteredSubjects.length, levelCount, categoryCount };
  }, [subjects, filteredSubjects, categories]);

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
              <Alert severity="error" onClose={refetch} sx={{ mb: 2 }}>
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
                  <Chip label={`Cơ bản (${stats.levelCount.beginner})`} color="info" variant={selectedLevel === 'beginner' ? 'filled' : 'outlined'} onClick={() => setSelectedLevel(selectedLevel === 'beginner' ? 'all' : 'beginner')} />
                  <Chip label={`Trung cấp (${stats.levelCount.intermediate})`} color="warning" variant={selectedLevel === 'intermediate' ? 'filled' : 'outlined'} onClick={() => setSelectedLevel(selectedLevel === 'intermediate' ? 'all' : 'intermediate')} />
                  <Chip label={`Nâng cao (${stats.levelCount.advanced})`} color="error" variant={selectedLevel === 'advanced' ? 'filled' : 'outlined'} onClick={() => setSelectedLevel(selectedLevel === 'advanced' ? 'all' : 'advanced')} />
                </Stack>
              </Stack>

              <Stack spacing={1}>
                <Typography variant="h6">Kết quả tìm kiếm</Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="h4" color="text.primary">{stats.filtered}</Typography>
                  <Typography variant="body2" color="text.secondary">/ {stats.total} môn học</Typography>
                </Stack>
              </Stack>
            </Box>
          </Card>

          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={selectedCategory === 'all' ? 0 : Math.max(0, categories.indexOf(selectedCategory))} onChange={(_, value) => setSelectedCategory(categories[value])} variant="scrollable" scrollButtons="auto">
                {categories.map((category, index) => (
                  <Tab key={index} label={category === 'all' ? 'Tất cả' : `${category} (${stats.categoryCount[category] || 0})`} />
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
                    <SubjectCard subject={subject} />
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {filteredSubjects.length > 0 && !loading && (
            <Card sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
              <Stack spacing={2} direction="row" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Hiển thị {filteredSubjects.length} / {stats.total} môn học
                </Typography>
                <Button variant="outlined" size="small">Xem thêm</Button>
              </Stack>
            </Card>
          )}
        </Stack>
      </Container>
      <AddSubjectDialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        onSuccess={refetch}
      />
    </Box>
  );
}