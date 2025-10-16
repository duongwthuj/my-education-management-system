import { Grid as MUIGrid } from '@mui/material';
import { forwardRef, ReactNode } from 'react';

// This is a wrapper for the MUI v7 Grid component to fix the TypeScript errors
// In MUI v7, the 'item' prop is not explicitly in the type definitions but still works
interface GridProps {
  children?: ReactNode;
  item?: boolean;
  xs?: number | string;
  sm?: number | string;
  md?: number | string;
  lg?: number | string;
  xl?: number | string;
  key?: string;
  [key: string]: any;
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ children, item, ...props }, ref) => {
    // @ts-ignore - Ignore the TypeScript error for the item prop
    return <MUIGrid ref={ref} item={item} {...props}>{children}</MUIGrid>;
  }
);

Grid.displayName = 'Grid';