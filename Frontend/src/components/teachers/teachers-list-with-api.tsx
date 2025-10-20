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
import { MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { TeachersTable } from './teachers-table';
import { useTeachers } from '@/hooks/use-teachers';

export function TeachersListWithAPI() {
  const [searchQuery, setSearchQuery] = useState('');
  const { teachers, loading, error, refetch } = useTeachers();

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (teacher.phone && teacher.phone.toLowerCase().includes(searchQuery.toLowerCase()))
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
              <div>
                <Button
                  startIcon={<Plus fontSize="var(--icon-fontSize-md)" />}
                  variant="contained"
                  disabled={loading}
                >
                  Thêm giáo viên
                </Button>
              </div>
            </Stack>

            {/* Error Alert */}
            {error && (
              <Alert 
                severity="error" 
                onClose={() => refetch()}
                action={
                  <Button color="inherit" size="small" onClick={() => refetch()}>
                    Thử lại
                  </Button>
                }
              >
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
                <Button variant="contained" disabled={loading}>
                  Tìm kiếm
                </Button>
              </Stack>
            </Card>

            {/* Loading State */}
            {loading && (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            )}

            {/* Teachers Table */}
            {!loading && !error && (
              <TeachersTable teachers={filteredTeachers} />
            )}

            {/* Empty State */}
            {!loading && !error && teachers.length === 0 && (
              <Card sx={{ p: 4 }}>
                <Box textAlign="center">
                  <Typography variant="h6" color="text.secondary">
                    Chưa có giáo viên nào
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Nhấn "Thêm giáo viên" để bắt đầu
                  </Typography>
                </Box>
              </Card>
            )}
          </Stack>
        </Container>
      </Box>
    </>
  );
}
