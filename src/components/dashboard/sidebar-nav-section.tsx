import { Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

interface SidebarNavSectionProps {
  children?: React.ReactNode;
  title: string;
}

export function SidebarNavSection({ children, title }: SidebarNavSectionProps) {
  return (
    <Stack spacing={2}>
      <Typography
        color={alpha('#ffffff', 0.7)}
        variant="overline"
      >
        {title}
      </Typography>
      {children}
    </Stack>
  );
}