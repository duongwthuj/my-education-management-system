'use client';

import { useState, useRef } from 'react';
import {
  Box,
  Container,
  Stack,
  Typography,
  Card,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
} from '@mui/material';
import { Upload, Sparkle } from '@phosphor-icons/react';
import { useTeaches } from '@/hooks/useTeaches';
import { useTeachers } from '@/hooks/use-teachers';
import { WorkSchedulesList } from '@/components/schedules/work-schedules-list';
import { TeachesList } from '@/components/schedules/teaches-list';
import { FreeSchedulesList } from '@/components/schedules/free-schedules-list';
import { ImportScheduleDialog } from '@/components/schedules/import-schedule-dialog';
import { GenerateSchedulesDialog } from '@/components/schedules/generate-schedules-dialog';

export default function TeacherSchedulePage() {
  const { teaches, loading: teachesLoading, error: teachesError, fetchAll: fetchAllTeaches } = useTeaches();
  const { teachers, loading: teachersLoading, error: teachersError } = useTeachers();
  const [tabValue, setTabValue] = useState(0);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const freeSchedulesListRef = useRef<{ refetch: () => Promise<void> }>(null);

  const loading = teachesLoading || teachersLoading;
  const error = teachesError || teachersError;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`schedule-tabpanel-${index}`}
        aria-labelledby={`schedule-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
      </div>
    );
  }

  const handleGenerateSuccess = async () => {
    console.log('✅ Generate success! Refetching data...');
    fetchAllTeaches();
    // Reload FreeSchedules
    if (freeSchedulesListRef.current?.refetch) {
      console.log('🔄 Calling refetch on FreeSchedulesList...');
      await freeSchedulesListRef.current.refetch();
      console.log('✅ FreeSchedulesList refetch complete');
    }
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
                  Quản lý lịch làm việc, phân công dạy và lịch rảnh
                </Typography>
              </Stack>
              
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  onClick={() => setImportDialogOpen(true)}
                >
                  Import JSON
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Sparkle weight="fill" />}
                  onClick={() => setGenerateDialogOpen(true)}
                >
                  Tạo lịch dạy & lịch trống
                </Button>
              </Stack>
            </Stack>

            <Card>
              <Box sx={{ p: 3 }}>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                      <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="schedule tabs"
                        sx={{
                          '& .MuiTab-root': {
                            minHeight: 48,
                            fontSize: '0.95rem',
                            fontWeight: 500,
                          },
                        }}
                      >
                        <Tab label="🕐 Ca Làm Việc" id="schedule-tab-0" />
                        <Tab label="📚 Phân Công Dạy" id="schedule-tab-1" />
                        <Tab label="☕ Lịch Rảnh" id="schedule-tab-2" />
                      </Tabs>
                    </Box>

                    <TabPanel value={tabValue} index={0}>
                      <WorkSchedulesList />
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                      <TeachesList />
                    </TabPanel>

                    <TabPanel value={tabValue} index={2}>
                      <FreeSchedulesList ref={freeSchedulesListRef} />
                    </TabPanel>
                  </>
                )}
              </Box>
            </Card>
          </Stack>
        </Container>
      </Box>
      
      <ImportScheduleDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onSuccess={() => {
          fetchAllTeaches();
        }}
      />
      
      <GenerateSchedulesDialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        onSuccess={handleGenerateSuccess}
      />
    </>
  );
}