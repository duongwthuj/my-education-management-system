'use client';

import { useState } from 'react';
import NextLink from 'next/link';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert
} from '@mui/material';
import { ArrowsClockwise, Eye, PencilSimple, Trash } from '@phosphor-icons/react';
import { Teacher } from '@/types';
import { teachersService } from '@/services/teachers.service';

const statusMap = {
  'active': { color: 'success', text: 'Đang hoạt động' },
  'on-leave': { color: 'warning', text: 'Tạm nghỉ' },
  'inactive': { color: 'error', text: 'Ngưng hoạt động' }
};

interface TeachersTableProps {
  teachers: Teacher[];
  onRefresh?: () => void;
}

export function TeachersTable({ teachers, onRefresh }: TeachersTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTeacher) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await teachersService.delete(selectedTeacher.id);
      setDeleteDialogOpen(false);
      setSelectedTeacher(null);
      onRefresh?.();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xóa giáo viên');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <Box sx={{ minWidth: 800 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                Giáo viên
              </TableCell>
              <TableCell>
                Email
              </TableCell>
              <TableCell>
                SĐT
              </TableCell>
              <TableCell>
                Ngày tham gia
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
            {teachers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((teacher) => (
                <TableRow
                  hover
                  key={teacher.id}
                >
                  <TableCell>
                    <Box
                      sx={{
                        alignItems: 'center',
                        display: 'flex'
                      }}
                    >
                      <Avatar
                        src={teacher.avatar}
                        sx={{ mr: 2 }}
                      />
                      <Typography variant="subtitle2">
                        <Link
                          component={NextLink}
                          href={`/dashboard/teachers/${teacher.id}`}
                          underline="hover"
                          color="inherit"
                        >
                          {teacher.name}
                        </Link>
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {teacher.email}
                  </TableCell>
                  <TableCell>
                    {teacher.phone}
                  </TableCell>
                  <TableCell>
                    {teacher.joinDate}
                  </TableCell>
                  <TableCell>
                    {teacher.status ? (
                      <Chip
                        color={statusMap[teacher.status]?.color as 'success' | 'warning' | 'error'}
                        label={statusMap[teacher.status]?.text}
                        size="small"
                      />
                    ) : (
                      <Chip
                        color="default"
                        label="Không xác định"
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Xem chi tiết">
                      <IconButton
                        component={NextLink}
                        href={`/dashboard/teachers/${teacher.id}`}
                      >
                        <Eye fontSize="var(--icon-fontSize-md)" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                      <IconButton>
                        <PencilSimple fontSize="var(--icon-fontSize-md)" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton onClick={() => handleDeleteClick(teacher)}>
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
        count={teachers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Số hàng mỗi trang:"
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xóa giáo viên</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
          <Typography>
            Bạn có chắc chắn muốn xóa giáo viên <strong>{selectedTeacher?.name}</strong> không?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
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
    </Card>
  );
}