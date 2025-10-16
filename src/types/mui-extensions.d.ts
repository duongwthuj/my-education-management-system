import { GridTypeMap } from '@mui/material/Grid';
import { ElementType } from 'react';

declare module '@mui/material/Grid' {
  interface GridTypeMap<P = {}, D extends ElementType = 'div'> {
    props: P & {
      item?: boolean;
    };
    defaultComponent: D;
  }
}