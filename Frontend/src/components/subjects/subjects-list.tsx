'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  InputAdornment,
  Stack,
  SvgIcon,
  TextField,
  Typography,
  Tab,
  Tabs
} from '@mui/material';
import { MagnifyingGlass, Plus, FunnelSimple } from '@phosphor-icons/react';
import { SubjectCard } from './subject-card';
import { subjects } from '@/data';

export function SubjectsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  
  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(subjects.map(subject => subject.category))];
    return ['all', ...uniqueCategories];
  }, []);

  // Filter subjects based on search query, category and level
  const filteredSubjects = useMemo(() => {
    return subjects.filter(subject => {
      const matchesSearch = 
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.category.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesCategory = selectedCategory === 'all' || subject.category === selectedCategory;
      const matchesLevel = selectedLevel === 'all' || subject.level === selectedLevel;
      
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [searchQuery, selectedCategory, selectedLevel]);

  // Count statistics
  const stats = useMemo(() => ({
    total: subjects.length,
    filtered: filteredSubjects.length,
    levelCount: {
      beginner: subjects.filter(s => s.level === 'beginner').length,
      intermediate: subjects.filter(s => s.level === 'intermediate').length,
      advanced: subjects.filter(s => s.level === 'advanced').length
    },
    categoryCount: categories.filter(c => c !== 'all').reduce((acc, category) => {
      acc[category] = subjects.filter(s => s.category === category).length;
      return acc;
    }, {} as Record<string, number>)
  }), [subjects, filteredSubjects, categories]);

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
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={2}
            >
              <Stack spacing={1}>
                <Typography variant="h4">
                  Quản lý môn học
                </Typography>
                <Typography
                  color="text.secondary"
                  variant="subtitle2"
                >
                  Quản lý danh sách và thông tin các môn học
                </Typography>
              </Stack>
              <Button
                startIcon={<Plus fontSize="var(--icon-fontSize-md)" />}
                variant="contained"
              >
                Thêm môn học
              </Button>
            </Stack>

            {/* Thống kê */}
            <Card sx={{ p: 3 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                <Stack spacing={1}>
                  <Typography variant="h6">Tổng quan</Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ p: 1.5, bgcolor: 'primary.lighter', borderRadius: 1 }}>
                      <Typography variant="h4" color="primary.main">{stats.total}</Typography>
                    </Box>
                    <Typography variant="body1">môn học</Typography>
                  </Stack>
                </Stack>
                
                <Stack spacing={1}>
                  <Typography variant="h6">Theo cấp độ</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip 
                      label={`Cơ bản (${stats.levelCount.beginner})`} 
                      color="info" 
                      variant={selectedLevel === 'beginner' ? 'filled' : 'outlined'}
                      onClick={() => setSelectedLevel(selectedLevel === 'beginner' ? 'all' : 'beginner')}
                    />
                    <Chip 
                      label={`Trung cấp (${stats.levelCount.intermediate})`} 
                      color="warning" 
                      variant={selectedLevel === 'intermediate' ? 'filled' : 'outlined'}
                      onClick={() => setSelectedLevel(selectedLevel === 'intermediate' ? 'all' : 'intermediate')}
                    />
                    <Chip 
                      label={`Nâng cao (${stats.levelCount.advanced})`} 
                      color="error" 
                      variant={selectedLevel === 'advanced' ? 'filled' : 'outlined'}
                      onClick={() => setSelectedLevel(selectedLevel === 'advanced' ? 'all' : 'advanced')}
                    />
                  </Stack>
                </Stack>
                
                <Stack spacing={1}>
                  <Typography variant="h6">Kết quả tìm kiếm</Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h4" color="text.primary">{stats.filtered}</Typography>
                    <Typography variant="body2" color="text.secondary">/ {stats.total} môn học</Typography>
                  </Stack>
                </Stack>
              </Box>
            </Card>

            {/* Bộ lọc và tìm kiếm */}
            <Card>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={selectedCategory === 'all' ? 0 : categories.indexOf(selectedCategory)}
                  onChange={(_, value) => setSelectedCategory(categories[value])}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {categories.map((category, index) => (
                    <Tab 
                      key={index} 
                      label={category === 'all' ? 'Tất cả' : `${category} (${stats.categoryCount[category] || 0})`}
                    />
                  ))}
                </Tabs>
              </Box>
              <Box sx={{ p: 2 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ p: 1 }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm theo tên, mã hoặc loại môn học"
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
                  <Button 
                    variant="contained"
                    startIcon={<FunnelSimple fontSize="var(--icon-fontSize-md)" />}
                  >
                    Lọc nâng cao
                  </Button>
                </Stack>
              </Box>
            </Card>

            <Box sx={{ pt: 3 }}>
              {filteredSubjects.length === 0 ? (
                <Card sx={{ p: 6, textAlign: 'center' }}>
                  <Typography variant="h6">
                    Không tìm thấy môn học nào
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Vui lòng thử với tiêu chí tìm kiếm khác hoặc xóa bộ lọc hiện tại
                  </Typography>
                </Card>
              ) : (
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)'
                  },
                  gap: 3
                }}>
                  {filteredSubjects.map((subject) => (
                    <Box key={subject.id}>
                      <SubjectCard subject={subject} />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
            
            {filteredSubjects.length > 0 && (
              <Card sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <Stack spacing={2} direction="row" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Hiển thị {filteredSubjects.length} / {stats.total} môn học
                  </Typography>
                  <Button variant="outlined" size="small">
                    Xem thêm
                  </Button>
                </Stack>
              </Card>
            )}
          </Stack>
        </Container>
      </Box>
    </>
  );
}