'use client';

import { usePathname } from 'next/navigation';
import { 
  Box, 
  Drawer, 
  Stack, 
  Typography 
} from '@mui/material';
import { 
  Chalkboard, 
  Books, 
  Calendar, 
  ChalkboardTeacher, 
  UsersThree, 
  Gear,
  House
} from '@phosphor-icons/react';
// Import from relative path without extension
import { SidebarNavItem } from './sidebar-nav-item';
import { SidebarNavSection } from './sidebar-nav-section';

const items = [
  {
    title: 'Tổng quan',
    path: '/dashboard',
    icon: <House fontSize="inherit" />
  },
  {
    title: 'Quản lý giáo viên',
    path: '/dashboard/teachers',
    icon: <UsersThree fontSize="inherit" />
  },
  {
    title: 'Quản lý môn học',
    path: '/dashboard/subjects',
    icon: <Books fontSize="inherit" />
  },

  {
    title: 'Lịch giáo viên',
    path: '/dashboard/teacher-schedules',
    icon: <ChalkboardTeacher fontSize="inherit" />
  },
  {
    title: 'Lớp học mới',
    path: '/dashboard/classes',
    icon: <Chalkboard fontSize="inherit" />
  }
];

export function DashboardSidebar() {
  const pathname = usePathname();
  
  return (
    <Drawer
      anchor="left"
      open
      PaperProps={{
        sx: {
          backgroundColor: '#111927',
          color: 'common.white',
          width: 280,
          borderRight: 'none'
        }
      }}
      variant="permanent"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box 
          sx={{ 
            p: 3, 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center' 
          }}
        >
          <Typography
            color="inherit"
            variant="h5"
            fontWeight={700}
          >
            QUẢN LÝ GIÁO VIÊN
          </Typography>
        </Box>
        
        <Box
          component="nav"
          sx={{
            flexGrow: 1,
            px: 2,
            py: 3
          }}
        >
          <Stack
            component="ul"
            spacing={1}
            sx={{
              listStyle: 'none',
              m: 0,
              p: 0
            }}
          >
            {items.map((item) => (
              <SidebarNavItem
                key={item.path}
                icon={item.icon}
                path={item.path}
                title={item.title}
                active={item.path ? (pathname === item.path) : false}
              />
            ))}
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}