'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Container,
  InputAdornment,
  Stack,
  SvgIcon,
  TextField,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { MagnifyingGlass, Plus, Upload } from '@phosphor-icons/react';
import { TeachersTable } from './teachers-table';
import { useTeachers } from '@/hooks/use-teachers';
import { AddTeacherDialog } from './add-teacher-dialog';
import { ImportTeachDialog } from './import-teach-dialog';

export function TeachersList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const { teachers, loading, error, refetch } = useTeachers();

  const filteredTeachers = teachers.filter((teacher) =>
    (teacher.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (teacher.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={4}
            >
              <Stack spacing={1}>
                <Typography variant="h4">
                  Giáo viên
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
                    Tổng số giáo viên:
                  </Typography>
                  <Typography
                    color="text.primary"
                    variant="subtitle1"
                  >
                    {loading ? '...' : teachers.length}
                  </Typography>
                </Stack>
              </Stack>
              <Stack direction="row" spacing={2}>
                <Button
                  startIcon={<Upload fontSize="var(--icon-fontSize-md)" />}
                  variant="outlined"
                  disabled={loading}
                  onClick={() => setImportDialogOpen(true)}
                >
                  Import Lớp Cố Định
                </Button>
                <Button
                  startIcon={<Plus fontSize="var(--icon-fontSize-md)" />}
                  variant="contained"
                  disabled={loading}
                  onClick={() => setOpenDialog(true)}
                >
                  Thêm giáo viên
                </Button>
              </Stack>
            </Stack>
            {error && (
              <Alert severity="error" onClose={refetch}>
                {error}
              </Alert>
            )}
            <Card sx={{ p: 2 }}>
              <Stack
                direction="row"
                spacing={2}
                sx={{ p: 1 }}
              >
                <TextField
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm giáo viên"
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
                />
                <Button variant="contained" disabled={loading} onClick={() => refetch()}>
                  Tìm kiếm
                </Button>
              </Stack>
            </Card>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <TeachersTable teachers={filteredTeachers} onRefresh={refetch} />
            )}
          </Stack>
        </Container>
      </Box>
      <AddTeacherDialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        onSuccess={refetch}
      />
      <ImportTeachDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onSuccess={refetch}
      />
    </>
  );
}