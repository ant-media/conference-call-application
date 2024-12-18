// src/EffectsTab.test.js
import React from 'react';
import { render } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import EffectsTab from "../../Components/EffectsTab";
import theme from "../../styles/theme";
import {ThemeList} from "../../styles/themeList";
import {ThemeProvider} from "@mui/material";

const mockOpfsRoot = {
  values: jest.fn(() => ({
    [Symbol.asyncIterator]: async function* () {
      yield { name: 'file1.txt' };
      yield { name: 'file2.txt' };
    },
  })),
};

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

describe('Effects Tab Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();

    Object.defineProperty(navigator, 'storage', {
      value: {
        getDirectory: jest.fn().mockResolvedValue(mockOpfsRoot),
      },
      writable: true,
    });
  });

  it('renders without crashing', () => {
    render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <EffectsTab
              setVirtualBackgroundImage={jest.fn()}
              handleBackgroundReplacement={jest.fn()}
          />
        </ThemeProvider>
      );
  });

  describe('getBackgroundImages', () => {
    it('returns an empty array when no environment variable or custom images are provided', () => {
      process.env.REACT_APP_VIRTUAL_BACKGROUND_IMAGES = undefined;
      const setVirtualBackgroundImageMock = jest.fn();
      const {getByTestId} = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <EffectsTab
                setVirtualBackgroundImage={setVirtualBackgroundImageMock}
                handleBackgroundReplacement={jest.fn()}
            />
          </ThemeProvider>
      );
      let customVirtualBackgroundButton = getByTestId('custom-virtual-background-button');
      customVirtualBackgroundButton.click();
      expect(setVirtualBackgroundImageMock).toHaveBeenCalled();
    });


  });

});
