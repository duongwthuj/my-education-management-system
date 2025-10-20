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
  Typography
} from '@mui/material';
import { MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { TeachersTable } from './teachers-table';
import { teachers } from '@/data';

export function TeachersList() {
  const [searchQuery, setSearchQuery] = useState('');
  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
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
                    {teachers.length}
                  </Typography>
                </Stack>
              </Stack>
              <div>
                <Button
                  startIcon={<Plus fontSize="var(--icon-fontSize-md)" />}
                  variant="contained"
                >
                  Thêm giáo viên
                </Button>
              </div>
            </Stack>
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
                <Button variant="contained">
                  Tìm kiếm
                </Button>
              </Stack>
            </Card>
            <TeachersTable teachers={filteredTeachers} />
          </Stack>
        </Container>
      </Box>
    </>
  );
}