'use client';

import { useState, useEffect } from 'react';
import NextLink from 'next/link';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowLeft,
  BookBookmark,
  PencilSimple,
  Trash,
  Users,
} from '@phosphor-icons/react';
import { Subject } from '@/types';
import { subjectsService } from '@/services/subjects.service';
import { useSubject } from '@/hooks/use-subjects';
import { useTeachers } from '@/hooks/use-teachers';
import { EditSubjectDialog } from './edit-subject-dialog';

interface SubjectDetailProps {
  subjectId: string;
  onBack: () => void;
}

export function SubjectDetail({ subjectId, onBack }: SubjectDetailProps) {
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { subject, loading, error, refetch: refetchSubject } = useSubject(subjectId);
  const { teachers } = useTeachers();

  const handleDeleteClick = () => {
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!subject) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const response = await subjectsService.delete(subject.id);

      if (!response.success) {
        setDeleteError(response.error || 'Có lỗi xảy ra khi xóa');
        return;
      }

      // Xóa thành công
      onBack();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setDeleting(false);
    }
  };

  const subjectTeachers = subject?.teachers
    ? teachers.filter((t) => subject.teachers.includes(t.id))
    : [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
        <Button onClick={refetchSubject} sx={{ ml: 2 }}>
          Thử lại
        </Button>
      </Alert>
    );
  }

  if (!subject) {
    return <Alert severity="error">Không tìm thấy môn học</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Stack spacing={1}>
          <Button
            component={NextLink}
            href="/dashboard/subjects"
            startIcon={<ArrowLeft />}
            sx={{ ml: -1 }}
          >
            Quay lại
          </Button>
          <Typography variant="h4">{subject.name}</Typography>
          <Typography color="text.secondary" variant="subtitle2">
            {subject.code} • {subject.category}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            onClick={() => setEditDialogOpen(true)}
            variant="contained"
            startIcon={<PencilSimple />}
          >
            Chỉnh sửa
          </Button>
          <Button
            onClick={handleDeleteClick}
            variant="outlined"
            color="error"
            startIcon={<Trash />}
          >
            Xóa
          </Button>
        </Stack>
      </Stack>

      {/* Content */}
      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Left: Info Card */}
        <Box sx={{ flexBasis: 320, flexShrink: 0 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: 'primary.main',
                      margin: '0 auto',
                      mb: 2,
                    }}
                  >
                    <BookBookmark fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {subject.name}
                  </Typography>
                  <Chip
                    label={subject.code}
                    size="small"
                    sx={{ mb: 2 }}
                  />
                  <Chip
                    label={
                      subject.level === 'beginner'
                        ? 'Cơ bản'
                        : subject.level === 'intermediate'
                        ? 'Trung cấp'
                        : 'Nâng cao'
                    }
                    color={
                      subject.level === 'beginner'
                        ? 'info'
                        : subject.level === 'intermediate'
                        ? 'warning'
                        : 'error'
                    }
                    sx={{ ml: 1 }}
                  />
                </Box>

                <Divider />

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                    Thông tin
                  </Typography>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Danh mục:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {subject.category}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Cấp độ:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {subject.level === 'beginner'
                          ? 'Cơ bản'
                          : subject.level === 'intermediate'
                          ? 'Trung cấp'
                          : 'Nâng cao'}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Giáo viên:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {subjectTeachers.length}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Right: Details */}
        <Box sx={{ flexGrow: 1 }}>
          <Card sx={{ height: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Mô tả" />
              <Tab label="Giáo viên" icon={<Users />} iconPosition="start" />
            </Tabs>
            <Divider />
            <CardContent sx={{ minHeight: 300 }}>
              {/* Tab 0: Description */}
              {tabValue === 0 && (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Mô tả chi tiết
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {subject.description || 'Chưa có mô tả'}
                    </Typography>
                  </Box>
                </Stack>
              )}

              {/* Tab 1: Teachers */}
              {tabValue === 1 && (
                <Stack spacing={2}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Danh sách giáo viên ({subjectTeachers.length})
                  </Typography>
                  {subjectTeachers.length > 0 ? (
                    <List>
                      {subjectTeachers.map((teacher, index) => (
                        <Box key={teacher.id}>
                          <ListItem sx={{ py: 2 }}>
                            <ListItemAvatar>
                              <Avatar src={teacher.avatar} />
                            </ListItemAvatar>
                            <ListItemText
                              primary={teacher.name}
                              secondary={teacher.education}
                            />
                            <Chip
                              label={
                                teacher.status === 'active'
                                  ? 'Đang hoạt động'
                                  : teacher.status === 'on-leave'
                                  ? 'Tạm nghỉ'
                                  : 'Ngưng'
                              }
                              color={
                                teacher.status === 'active'
                                  ? 'success'
                                  : teacher.status === 'on-leave'
                                  ? 'warning'
                                  : 'error'
                              }
                              size="small"
                            />
                          </ListItem>
                          {index < subjectTeachers.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">Chưa có giáo viên nào dạy môn này</Typography>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Edit Dialog */}
      <EditSubjectDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        subject={subject}
        onSuccess={() => {
          setEditDialogOpen(false);
          refetchSubject();
        }}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xóa môn học</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          <Typography>
            Bạn chắc chắn muốn xóa môn học <strong>{subject.name}</strong>? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
