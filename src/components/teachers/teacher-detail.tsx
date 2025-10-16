'use client';

import { useState, useEffect } from 'react';
import NextLink from 'next/link';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Stack,
  Typography,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip
} from '@mui/material';
import { Grid } from '@/components/common/grid';
import {
  Phone,
  EnvelopeSimple,
  MapPin,
  Calendar,
  GraduationCap,
  BookBookmark
} from '@phosphor-icons/react';
import { teachers, subjects } from '@/data';
import { Teacher, Subject } from '@/types';

interface TeacherDetailProps {
  teacherId: string;
}

export function TeacherDetail({ teacherId }: TeacherDetailProps) {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [teacherSubjects, setTeacherSubjects] = useState<Subject[]>([]);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    // Tìm thông tin giáo viên từ ID
    const foundTeacher = teachers.find(t => t.id === teacherId);
    setTeacher(foundTeacher || null);

    // Tìm các môn học mà giáo viên có thể dạy
    if (foundTeacher) {
      const foundSubjects = subjects.filter(subject => 
        foundTeacher.subjects.includes(subject.id)
      );
      setTeacherSubjects(foundSubjects);
    }
  }, [teacherId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!teacher) {
    return <Typography>Không tìm thấy thông tin giáo viên</Typography>;
  }

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 8
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <div>
            <Typography variant="h4">
              Hồ sơ giáo viên
            </Typography>
          </div>
          <div>
            <Grid
              container
              spacing={3}
            >
              {/* @ts-ignore - MUI v7 Grid type issues */}
              {/* @ts-ignore - MUI v7 Grid type issues */}
              <Grid
                item
                xs={12}
                md={6}
                lg={8}
              >
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        alignItems: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        textAlign: 'center'
                      }}
                    >
                      <Avatar
                        src={teacher.avatar}
                        sx={{
                          height: 80,
                          width: 80,
                          mb: 2
                        }}
                      />
                      <Typography
                        gutterBottom
                        variant="h5"
                      >
                        {teacher.name}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        variant="body2"
                      >
                        {teacher.education}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Chip
                          label={
                            teacher.status === 'active' ? 'Đang hoạt động' :
                            teacher.status === 'on-leave' ? 'Tạm nghỉ' : 
                            'Ngưng hoạt động'
                          }
                          color={
                            teacher.status === 'active' ? 'success' :
                            teacher.status === 'on-leave' ? 'warning' : 
                            'error'
                          }
                        />
                      </Box>
                    </Box>
                  </CardContent>
                  <Divider />
                  <CardContent>
                    <Stack
                      spacing={2}
                      sx={{ mt: 1 }}
                    >
                      <Stack
                        alignItems="flex-start"
                        direction="row"
                        spacing={1}
                      >
                        <Phone fontSize="var(--icon-fontSize-md)" />
                        <Typography variant="body2">
                          {teacher.phone}
                        </Typography>
                      </Stack>
                      <Stack
                        alignItems="flex-start"
                        direction="row"
                        spacing={1}
                      >
                        <EnvelopeSimple fontSize="var(--icon-fontSize-md)" />
                        <Typography variant="body2">
                          {teacher.email}
                        </Typography>
                      </Stack>
                      <Stack
                        alignItems="flex-start"
                        direction="row"
                        spacing={1}
                      >
                        <MapPin fontSize="var(--icon-fontSize-md)" />
                        <Typography variant="body2">
                          {teacher.address}
                        </Typography>
                      </Stack>
                      <Stack
                        alignItems="flex-start"
                        direction="row"
                        spacing={1}
                      >
                        <Calendar fontSize="var(--icon-fontSize-md)" />
                        <Typography variant="body2">
                          Ngày vào: {teacher.joinDate}
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardContent>
                  <Divider />
                  <Stack
                    alignItems="center"
                    direction="row"
                    justifyContent="space-between"
                    spacing={2}
                    sx={{ p: 2 }}
                  >
                    <Button
                      component={NextLink}
                      href="/dashboard/teachers"
                      color="inherit"
                    >
                      Quay lại
                    </Button>
                    <Button variant="contained">
                      Chỉnh sửa
                    </Button>
                  </Stack>
                </Card>
              </Grid>
              <Grid
                item
                xs={12}
                md={8}
                lg={8}
              >
                <Card>
                  <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                  >
                    <Tab label="Thông tin" />
                    <Tab label="Môn học" />
                    <Tab label="Lịch dạy" />
                  </Tabs>
                  <Divider />
                  <CardContent>
                    {tabValue === 0 && (
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{ mb: 2 }}
                        >
                          Thông tin chi tiết
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ mb: 3 }}
                        >
                          {teacher.bio}
                        </Typography>
                        
                        <Typography
                          variant="h6"
                          sx={{ mb: 2 }}
                        >
                          Bằng cấp và chuyên môn
                        </Typography>
                        <Stack
                          alignItems="flex-start"
                          direction="row"
                          spacing={1}
                          sx={{ mb: 2 }}
                        >
                          <GraduationCap fontSize="var(--icon-fontSize-md)" />
                          <Typography variant="body1">
                            {teacher.education}
                          </Typography>
                        </Stack>
                      </Box>
                    )}
                    {tabValue === 1 && (
                      <List>
                        {teacherSubjects.map(subject => (
                          <ListItem key={subject.id} divider>
                            <ListItemAvatar>
                              <Avatar>
                                <BookBookmark />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={subject.name}
                              secondary={
                                <>
                                  <Typography component="span" variant="body2" color="text.primary">
                                    {subject.code}
                                  </Typography>
                                  {` — ${subject.description}`}
                                </>
                              }
                            />
                            <Chip
                              label={
                                subject.level === 'beginner' ? 'Cơ bản' :
                                subject.level === 'intermediate' ? 'Trung cấp' :
                                'Nâng cao'
                              }
                              color={
                                subject.level === 'beginner' ? 'info' :
                                subject.level === 'intermediate' ? 'warning' :
                                'error'
                              }
                              size="small"
                              sx={{ ml: 2 }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                    {tabValue === 2 && (
                      <Typography
                        variant="body1"
                      >
                        Không có lịch dạy
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </div>
        </Stack>
      </Container>
    </Box>
  );
}