'use client';

import { AppBar, Avatar, Box, IconButton, Stack, Toolbar, Tooltip } from '@mui/material';
import { Bell, Gear } from '@phosphor-icons/react';

export function DashboardNavbar() {
  return (
    <AppBar
      elevation={0}
      sx={{
        backgroundColor: 'background.paper',
        color: 'text.secondary',
        left: {
          lg: 280
        },
        width: {
          lg: 'calc(100% - 280px)'
        },
        boxShadow: 'rgb(50 50 93 / 2%) 0px 2px 5px -1px, rgb(0 0 0 / 5%) 0px 1px 3px -1px'
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: 64,
          px: 3
        }}
      >
        <Box sx={{ flexGrow: 1 }} />
        <Stack
          alignItems="center"
          direction="row"
          spacing={2}
        >
          <Tooltip title="Notifications">
            <IconButton>
              <Bell fontSize="var(--icon-fontSize-md)" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton>
              <Gear fontSize="var(--icon-fontSize-md)" />
            </IconButton>
          </Tooltip>
          <Avatar
            sx={{
              cursor: 'pointer',
              height: 40,
              width: 40
            }}
            src="/assets/avatars/avatar-admin.png"
          />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}