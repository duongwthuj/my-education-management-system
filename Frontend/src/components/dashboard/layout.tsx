'use client';

import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
// Import from relative path without extension
import { DashboardNavbar } from './navbar';
import { DashboardSidebar } from './sidebar';

const LayoutRoot = styled('div')(({ theme }) => ({
  display: 'flex',
  flex: '1 1 auto',
  maxWidth: '100%',
  [theme.breakpoints.up('lg')]: {
    paddingLeft: 280
  }
}));

const LayoutContainer = styled('div')({
  display: 'flex',
  flex: '1 1 auto',
  flexDirection: 'column',
  width: '100%'
});

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LayoutRoot>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            py: 8,
            px: 4
          }}
        >
          <LayoutContainer>{children}</LayoutContainer>
        </Box>
      </LayoutRoot>
      <DashboardNavbar />
      <DashboardSidebar />
    </>
  );
}