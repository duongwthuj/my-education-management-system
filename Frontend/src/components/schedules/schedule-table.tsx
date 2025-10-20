'use client';

import NextLink from 'next/link';
import { useState, useMemo } from 'react';
import {
  Avatar,
  Box,
  Card,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  IconButton,
  Tooltip,
  Link
} from '@mui/material';
import { Eye, PencilSimple, Trash } from '@phosphor-icons/react';
import { Schedule } from '@/types';
import { teachers, subjects } from '@/data';

const statusMap = {
  'scheduled': { color: 'info', text: 'Đã lên lịch' },
  'in-progress': { color: 'warning', text: 'Đang diễn ra' },
  'completed': { color: 'success', text: 'Đã hoàn thành' },
  'cancelled': { color: 'error', text: 'Đã hủy' }
};

interface ScheduleTableProps {
  schedules: Schedule[];
}

export function ScheduleTable({ schedules }: ScheduleTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Lấy tên giáo viên và môn học
  const scheduleDetails = useMemo(() => {
    return schedules.map(schedule => {
      const teacher = teachers.find(t => t.id === schedule.teacherId);
      const subject = subjects.find(s => s.id === schedule.subjectId);
      
      return {
        ...schedule,
        teacherName: teacher?.name || 'Chưa phân công',
        teacherAvatar: '', // No avatar field, use blank or default
        subjectName: subject?.name || 'Không xác định',
        subjectCode: subject?.code || ''
      };
    });
  }, [schedules]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                Giáo viên
              </TableCell>
              <TableCell>
                Môn học
              </TableCell>
              <TableCell>
                Thời gian
              </TableCell>
              <TableCell>
                Ngày
              </TableCell>
              <TableCell>
                Phòng
              </TableCell>
              <TableCell>
                Trạng thái
              </TableCell>
              <TableCell align="right">
                Tác vụ
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scheduleDetails
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((schedule) => (
                <TableRow
                  hover
                  key={schedule.id}
                >
                  <TableCell>
                    <Box
                      sx={{
                        alignItems: 'center',
                        display: 'flex'
                      }}
                    >
                      <Avatar sx={{ mr: 2 }} />
                      <Typography variant="subtitle2">
                        {schedule.teacherName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {schedule.subjectName}
                    </Typography>
                    <Typography
                      color="text.secondary"
                      variant="body2"
                    >
                      {schedule.subjectCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {schedule.startTime} - {schedule.endTime}
                  </TableCell>
                  <TableCell>
                    {schedule.dayOfWeek}
                  </TableCell>
                  <TableCell>
                    {schedule.room}
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={statusMap[schedule.status].color as 'success' | 'warning' | 'error' | 'info'}
                      label={statusMap[schedule.status].text}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
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
                      <IconButton>
                        <Trash fontSize="var(--icon-fontSize-md)" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Box>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={schedules.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Số hàng mỗi trang:"
      />
    </Card>
  );
}