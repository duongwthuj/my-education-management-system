'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Stack,
  SvgIcon,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert
} from '@mui/material';
import { Grid } from '@/components/common/grid';
import { MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { ClassCard } from './class-card';
import { Class } from '@/types';
import { useClasses } from '@/hooks/use-classes';
import { useSubjects } from '@/hooks/use-subjects';
import { useTeachers } from '@/hooks/use-teachers';
import { classesService } from '@/services/classes.service';
import { CircularProgress } from '@mui/material';

export function ClassesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { classes, loading, error, refetch } = useClasses();
  const { subjects } = useSubjects();
  const { teachers } = useTeachers();
  
  // Lọc các lớp theo trạng thái và từ khóa tìm kiếm
  const filteredClasses = classes.filter(cls => {
    // Lọc theo trạng thái
    if (statusFilter !== 'all' && cls.status !== statusFilter) {
      return false;
    }
    
    // Lọc theo từ khóa tìm kiếm
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return cls.name.toLowerCase().includes(query)
    }
    
    return true;
  });
  
  // Đếm số lượng lớp theo trạng thái
  const statusCounts = {
    pending: classes.filter(c => c.status === 'pending').length,
    active: classes.filter(c => c.status === 'active').length,
    completed: classes.filter(c => c.status === 'completed').length,
  };

  // Build lookup maps
  const subjectMap = subjects.reduce<Record<string, { name: string }>>((acc, s) => {
    acc[s.id] = { name: s.name };
    return acc;
  }, {});
  const teacherMap = teachers.reduce<Record<string, { name: string; avatar?: string }>>((acc, t) => {
    acc[t.id] = { name: t.name, avatar: t.avatar };
    return acc;
  }, {});
  
  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
  };

  const handleDeleteClick = (classItem: Class) => {
    setSelectedClass(classItem);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedClass) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await classesService.delete(selectedClass.id);
      setDeleteDialogOpen(false);
      setSelectedClass(null);
      refetch();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={3}>
            {error && (
              <Alert severity="error" onClose={refetch}>
                {error}
              </Alert>
            )}
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={4}
            >
              <Stack spacing={1}>
                <Typography variant="h4">
                  Lớp học mới
                </Typography>
                <Stack
                  alignItems="center"
                  direction="row"
                  spacing={1}
                >
                  <Typography
                    color="text.secondary"
                    variant="subtitle2"
                  >
                    Tổng số lớp:
                  </Typography>
                  <Typography
                    color="text.primary"
                    variant="subtitle1"
                  >
                    {loading ? '...' : classes.length}
                  </Typography>
                </Stack>
              </Stack>
              <div>
                <Button
                  startIcon={<Plus fontSize="var(--icon-fontSize-md)" />}
                  variant="contained"
                  disabled={loading}
                >
                  Thêm lớp mới
                </Button>
              </div>
            </Stack>
            
            <Card sx={{ p: 2 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ p: 1 }}
                alignItems="center"
              >
                <TextField
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm lớp học"
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SvgIcon fontSize="small">
                          <MagnifyingGlass />
                        </SvgIcon>
                      </InputAdornment>
                    )
                  }}
                  sx={{ flexGrow: 1 }}
                />
                
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Trạng thái"
                    onChange={handleStatusChange}
                  >
                    <MenuItem value="all">Tất cả trạng thái</MenuItem>
                    <MenuItem value="pending">Chờ xử lý ({statusCounts.pending})</MenuItem>
                    <MenuItem value="active">Đang hoạt động ({statusCounts.active})</MenuItem>
                    <MenuItem value="completed">Đã hoàn thành ({statusCounts.completed})</MenuItem>
                  </Select>
                </FormControl>
                
                <Button variant="contained">
                  Tìm kiếm
                </Button>
              </Stack>
            </Card>

            <Box sx={{ pt: 3 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {filteredClasses.map((classItem) => (
                    <Grid
                      key={classItem.id}
                      item
                      md={6}
                      sm={12}
                      xs={12}
                    >
                      <ClassCard 
                        classItem={classItem}
                        subjectName={subjectMap[classItem.subjectId]?.name}
                        teacher={classItem.teacherId ? teacherMap[classItem.teacherId] : null}
                        onDeleteClick={handleDeleteClick}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
              
              {filteredClasses.length === 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    p: 3
                  }}
                >
                  <Typography
                    color="text.secondary"
                    variant="body1"
                  >
                    Không tìm thấy lớp học nào
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </Container>
      </Box>
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xóa lớp học</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
          <Typography>
            Bạn có chắc chắn muốn xóa lớp <strong>{selectedClass?.name}</strong> không?
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
    </>
  );
}