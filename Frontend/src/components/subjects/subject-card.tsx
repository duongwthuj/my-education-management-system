'use client';

import { useState, memo } from 'react';
import NextLink from 'next/link';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
  Tooltip
} from '@mui/material';
import {
  Eye,
  PencilSimple,
  Trash,
  BookBookmark,
  UsersThree,
  ClockAfternoon
} from '@phosphor-icons/react';
import { Subject } from '@/types';

interface SubjectCardProps {
  subject: Subject;
  onDeleteClick?: (subject: Subject) => void;
}

const levelMap = {
  'beginner': { color: 'info', text: 'Cơ bản', progress: 33 },
  'intermediate': { color: 'warning', text: 'Trung cấp', progress: 66 },
  'advanced': { color: 'error', text: 'Nâng cao', progress: 100 }
};

export const SubjectCard = memo(function SubjectCard({ subject, onDeleteClick }: SubjectCardProps) {
  const teachersCount = Array.isArray(subject.teachers) ? subject.teachers.length : 0;
  const [elevated, setElevated] = useState(false);
  
  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6
        }
      }}
      onMouseEnter={() => setElevated(true)}
      onMouseLeave={() => setElevated(false)}
      elevation={elevated ? 3 : 1}
    >
      <Box sx={{ position: 'relative', p: 2, pb: 0 }}>
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <Chip
            color={levelMap[subject.level].color as 'info' | 'warning' | 'error'}
            label={levelMap[subject.level].text}
            size="small"
          />
        </Box>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar
            sx={{
              backgroundColor: 'primary.lighter',
              color: 'primary.main',
              width: 48,
              height: 48
            }}
          >
            <BookBookmark fontSize="var(--icon-fontSize-lg)" />
          </Avatar>
          <Box>
            <Typography variant="h6" noWrap title={subject.name}>
              {subject.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subject.code} • {subject.category}
            </Typography>
          </Box>
        </Stack>
        
        <LinearProgress 
          variant="determinate" 
          value={levelMap[subject.level].progress} 
          color={levelMap[subject.level].color as 'info' | 'warning' | 'error'} 
          sx={{ mb: 2, height: 4, borderRadius: 1 }}
        />
      </Box>

      <CardContent sx={{ flexGrow: 1, pt: 1 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ 
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            height: '4.5em'
          }}
        >
          {subject.description}
        </Typography>
        
        <Stack spacing={1.5}>
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
          >
            <UsersThree fontSize="var(--icon-fontSize-md)" />
            <Typography
              color="text.secondary"
              display="inline"
              variant="body2"
            >
              {teachersCount} giáo viên có thể dạy
            </Typography>
          </Stack>
          
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
          >
            <ClockAfternoon fontSize="var(--icon-fontSize-md)" />
            <Typography
              color="text.secondary"
              display="inline"
              variant="body2"
            >
              12 buổi học
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Xem chi tiết">
            <IconButton 
              size="small"
              component={NextLink}
              href={`/dashboard/subjects/${subject.id}`}
            >
              <Eye fontSize="var(--icon-fontSize-md)" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <IconButton size="small">
              <PencilSimple fontSize="var(--icon-fontSize-md)" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa">
            <IconButton 
              size="small" 
              color="error"
              onClick={() => onDeleteClick?.(subject)}
            >
              <Trash fontSize="var(--icon-fontSize-md)" />
            </IconButton>
          </Tooltip>
        </Stack>
        
        <Button
          component={NextLink}
          href={`/dashboard/subjects/${subject.id}`}
          variant="outlined"
          size="small"
          startIcon={<Eye fontSize="var(--icon-fontSize-sm)" />}
        >
          Chi tiết
        </Button>
      </CardActions>
    </Card>
  );
});