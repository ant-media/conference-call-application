import {isComponentMode} from "../utils";

export function getAntDrawerStyle (theme) {
  if (isComponentMode()) {
    return {
      '& .MuiDrawer-root': {
        position: 'absolute',
      },
      '& .MuiBackdrop-root': {
        backgroundColor: 'transparent',
      },
      '& .MuiPaper-root': {
        padding: 12,
        backgroundColor: 'transparent',
        position: 'absolute',
        boxShadow: 'unset',
        width: 360,
        border: 'unset',
        [theme.breakpoints.down('sm')]: {
          width: '100%',
          padding: 0,
          backgroundColor: theme.palette.themeColor70,
        },
      },
    }
  } else {
    return {
      '& .MuiBackdrop-root': {
        backgroundColor: 'transparent',
      },
      '& .MuiPaper-root': {
        padding: 12,
        backgroundColor: 'transparent',
        boxShadow: 'unset',
        width: 360,
        border: 'unset',
        [theme.breakpoints.down('sm')]: {
          width: '100%',
          padding: 0,
          backgroundColor: theme.palette.themeColor70,
        },
      },
    };
  }
}
