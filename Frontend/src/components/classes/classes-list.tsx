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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { Grid } from '@/components/common/grid';
import { MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { ClassCard } from './class-card';
import { classes } from '@/data';
import { Class } from '@/types';

export function ClassesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
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
  
  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
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
                    {classes.length}
                  </Typography>
                </Stack>
              </Stack>
              <div>
                <Button
                  startIcon={<Plus fontSize="var(--icon-fontSize-md)" />}
                  variant="contained"
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
              <Grid container spacing={3}>
                {filteredClasses.map((classItem) => (
                  <Grid
                    key={classItem.id}
                    item
                    md={6}
                    sm={12}
                    xs={12}
                  >

                  </Grid>
                ))}
              </Grid>
              
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
    </>
  );
}