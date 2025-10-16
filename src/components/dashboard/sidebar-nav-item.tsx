import NextLink from 'next/link';
import { Box, ButtonBase } from '@mui/material';
import { alpha } from '@mui/material/styles';

interface SidebarNavItemProps {
  active?: boolean;
  icon?: React.ReactNode;
  path?: string;
  title: string;
}

export function SidebarNavItem({
  active = false,
  icon,
  path,
  title
}: SidebarNavItemProps) {
  return (
    <li>
      <ButtonBase
        component={path ? NextLink : 'div'}
        href={path}
        sx={{
          alignItems: 'center',
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'flex-start',
          pl: '16px',
          pr: '16px',
          py: '10px',
          textAlign: 'left',
          width: '100%',
          ...(active && {
            backgroundColor: alpha('#ffffff', 0.04)
          }),
          '&:hover': {
            backgroundColor: alpha('#ffffff', 0.04)
          }
        }}
      >
        {icon && (
          <Box
            component="span"
            sx={{
              alignItems: 'center',
              color: active ? 'primary.main' : alpha('#ffffff', 0.8),
              display: 'inline-flex',
              justifyContent: 'center',
              mr: 2,
              fontSize: 20
            }}
          >
            {icon}
          </Box>
        )}
        <Box
          component="span"
          sx={{
            color: active ? 'primary.main' : '#ffffff',
            flexGrow: 1,
            fontFamily: (theme) => theme.typography.fontFamily,
            fontSize: 14,
            fontWeight: 600,
            lineHeight: '24px',
            whiteSpace: 'nowrap'
          }}
        >
          {title}
        </Box>
      </ButtonBase>
    </li>
  );
}