'use client';

import { memo } from 'react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
  Tooltip,
  LinearProgress,
  Paper
} from '@mui/material';
import { Grid } from '@/components/common/grid';
import {
  UsersThree,
  Calendar,
  MapPin,
  BookBookmark,
  Eye,
  PencilSimple,
  Trash
} from '@phosphor-icons/react';
import { Class } from '@/types';

interface ClassCardProps {
  classItem: Class;
  subjectName?: string;
  teacher?: { name: string; avatar?: string } | null;
  onDeleteClick?: (classItem: Class) => void;
}

const statusMap = {
  'pending': { color: 'warning', text: 'Chờ xử lý' },
  'active': { color: 'success', text: 'Đang hoạt động' },
  'completed': { color: 'info', text: 'Đã hoàn thành' }
};

export const ClassCard = memo(function ClassCard({ classItem, subjectName, teacher, onDeleteClick }: ClassCardProps) {
  
  // Tính thời gian đã qua (progress)
  const startDate = new Date(classItem.startDate);
  const endDate = new Date(classItem.endDate);
  const currentDate = new Date();
  let progress = 0;
  
  if (currentDate < startDate) {
    progress = 0;
  } else if (currentDate > endDate) {
    progress = 100;
  } else {
    const total = endDate.getTime() - startDate.getTime();
    const elapsed = currentDate.getTime() - startDate.getTime();
    progress = Math.round((elapsed / total) * 100);
  }
  
  return (
    <Card>
      <CardHeader
        title={classItem.name}
        subheader={`${subjectName || 'Không xác định'} - ${classItem.location}`}
        action={
          <Chip
            color={statusMap[classItem.status].color as 'warning' | 'success' | 'info'}
            label={statusMap[classItem.status].text}
            size="small"
          />
        }
      />
      <Divider />
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="body2">
            {classItem.description}
          </Typography>
          
          <Paper
            variant="outlined"
            sx={{ p: 2 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <BookBookmark fontSize="var(--icon-fontSize-md)" />
                  <Typography variant="body2">
                    {subjectName || 'Không xác định'}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <UsersThree fontSize="var(--icon-fontSize-md)" />
                  <Typography variant="body2">
                    {classItem.studentsCount} học sinh
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Calendar fontSize="var(--icon-fontSize-md)" />
                  <Typography variant="body2">
                    {classItem.startDate} - {classItem.endDate}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MapPin fontSize="var(--icon-fontSize-md)" />
                  <Typography variant="body2">
                    {classItem.location}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
          
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              gutterBottom
            >
              Tiến độ khóa học: {progress}%
            </Typography>
            <LinearProgress
              value={progress}
              variant="determinate"
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          
          {teacher ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle2">
                Giáo viên phụ trách:
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar
                  src={teacher.avatar}
                  sx={{ width: 24, height: 24 }}
                />
                <Typography variant="body2">
                  {teacher.name}
                </Typography>
              </Stack>
            </Stack>
          ) : (
            <Typography 
              variant="body2" 
              color="error"
            >
              Chưa phân công giáo viên
            </Typography>
          )}
        </Stack>
      </CardContent>
      <Divider />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          p: 1
        }}
      >
        <Tooltip title="Xem chi tiết">
          <IconButton>
            <Eye fontSize="var(--icon-fontSize-md)" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Chỉnh sửa">
          <IconButton>
            <PencilSimple fontSize="var(--icon-fontSize-md)" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Xóa">
          <IconButton onClick={() => onDeleteClick?.(classItem)}>
            <Trash fontSize="var(--icon-fontSize-md)" />
          </IconButton>
        </Tooltip>
      </Box>
    </Card>
  );
});