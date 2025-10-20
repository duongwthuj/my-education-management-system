'use client';

import {
  Box,
  Container,
  Stack,
  Typography,
  Card,
  Tab,
  Tabs
} from '@mui/material';
import { useState } from 'react';
import { TeacherScheduleCalendar } from '@/components/schedules/teacher-schedule-calendar';
import { teacherScheduleData } from '@/data';

export default function TeacherSchedulePage() {
  const [view, setView] = useState(0);

  const handleViewChange = (event: React.SyntheticEvent, newValue: number) => {
    setView(newValue);
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
                  Lịch làm việc giáo viên
                </Typography>
                <Typography
                  color="text.secondary"
                  variant="subtitle2"
                >
                  Xem và quản lý lịch làm việc của giáo viên
                </Typography>
              </Stack>
            </Stack>

            <Card>
              <Box sx={{ p: 3 }}>
                <TeacherScheduleCalendar scheduleData={teacherScheduleData} />
              </Box>
            </Card>
          </Stack>
        </Container>
      </Box>
    </>
  );
}