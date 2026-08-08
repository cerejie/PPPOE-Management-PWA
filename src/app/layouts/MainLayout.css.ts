import { style } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { solid } from '@/common/styles/Token.utils';

export const shell = style({
  display: 'flex',
  height: '100dvh',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: solid(vars.rgb.canvas),
});

export const scroller = style({
  minHeight: 0,
  flex: 1,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
});
