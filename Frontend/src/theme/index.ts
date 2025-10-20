import { createTheme as createMuiTheme } from '@mui/material';
// Import without extensions
import { createPalette } from './create-palette';
import { createComponents } from './create-components';
import { createShadows } from './create-shadows';
import { createTypography } from './create-typography';

export function createTheme() {
  const palette = createPalette();
  const components = createComponents({ palette });
  const shadows = createShadows();
  const typography = createTypography();

  return createMuiTheme({
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1440
      }
    },
    // @ts-ignore - MUI v7 type incompatibilities
    components,
    // @ts-ignore - MUI v7 type incompatibilities
    palette: {
      ...palette,
      mode: 'light' as 'light' // Ensure mode is typed correctly
    },
    // @ts-ignore - MUI v7 type incompatibilities
    shadows,
    shape: {
      borderRadius: 8
    },
    // @ts-ignore - MUI v7 type incompatibilities
    typography
  });
}

export const theme = createTheme();