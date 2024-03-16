// src/__tests__/styles/themeUtil.test.js
import { getAntDrawerStyle } from 'styles/themeUtil';
import { isComponentMode } from 'utils';

jest.mock('utils', () => ({
  isComponentMode: jest.fn(),
}));

describe('getAntDrawerStyle', () => {
  it('returns correct styles when component mode is true', () => {
    isComponentMode.mockReturnValue(true);

    const theme = {
      breakpoints: {
        down: jest.fn().mockReturnValue('sm'),
      },
      palette: {
        themeColor70: 'color70',
      },
    };

    const result = getAntDrawerStyle(theme);

    expect(result).toEqual({
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
        'sm': {
          width: '100%',
          padding: 0,
          backgroundColor: 'color70',
        },
      },
    });
  });

  it('returns correct styles when component mode is false', () => {
    isComponentMode.mockReturnValue(false);

    const theme = {
      breakpoints: {
        down: jest.fn().mockReturnValue('sm'),
      },
      palette: {
        themeColor70: 'color70',
      },
    };

    const result = getAntDrawerStyle(theme);

    expect(result).toEqual({
      '& .MuiBackdrop-root': {
        backgroundColor: 'transparent',
      },
      '& .MuiPaper-root': {
        padding: 12,
        backgroundColor: 'transparent',
        boxShadow: 'unset',
        width: 360,
        border: 'unset',
        'sm': {
          width: '100%',
          padding: 0,
          backgroundColor: 'color70',
        },
      },
    });
  });
});
