import { alpha } from '@mui/material/styles';
import { error, info, neutral, success, warning } from './colors';

export function createPalette() {
  return {
    action: {
      active: neutral[500],
      disabled: alpha(neutral[900], 0.38),
      disabledBackground: alpha(neutral[900], 0.12),
      focus: alpha(neutral[900], 0.16),
      hover: alpha(neutral[900], 0.04),
      selected: alpha(neutral[900], 0.12)
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF'
    },
    divider: '#F2F4F7',
    error,
    info,
    mode: 'light',
    neutral,
    primary: {
      main: '#3366FF',
      light: '#84A9FF',
      dark: '#1939B7',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#10B981',
      light: '#3FC79A',
      dark: '#0B815A',
      contrastText: '#FFFFFF'
    },
    success,
    text: {
      primary: '#121828',
      secondary: '#65748B',
      disabled: alpha(neutral[900], 0.38)
    },
    warning
  };
}