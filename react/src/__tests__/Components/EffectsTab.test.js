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

const contextValue = {
  allParticipants: {
    'test-stream-id': {
      role: 'host',
      participantID: 'test-participant-id',
      streamID: 'test-stream-id',
      videoTrack: 'test-video-track',
      audioTrack: 'test-audio-track',
      videoLabel: 'test-video-label',
    },
  },
  publishStreamId: 'test-stream-id',
};

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
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

    React.useContext.mockImplementation(input => {
      if (input === ConferenceContext) {
        return contextValue;
      }
      return jest.requireActual('react').useContext(input);
    });
  });

  it('renders without crashing', () => {
    render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <EffectsTab />
        </ThemeProvider>
      );
  });

  /*
  describe('getBackgroundImages', () => {
    it('returns an empty array when no environment variable or custom images are provided', () => {
      process.env.REACT_APP_VIRTUAL_BACKGROUND_IMAGES = undefined;
      //customVirtualBackgroundImages = [];
      const result = getBackgroundImages();
      expect(result).toEqual([]);
    });

    it('returns an array of buttons for environment variable images', () => {
      process.env.REACT_APP_VIRTUAL_BACKGROUND_IMAGES = 'image1.jpg,image2.jpg';
      //customVirtualBackgroundImages = [];
      const result = getBackgroundImages();
      expect(result.length).toBe(2);
      expect(result[0].key).toBe('0');
      expect(result[1].key).toBe('1');
    });

    it('returns an array of buttons for custom images', () => {
      process.env.REACT_APP_VIRTUAL_BACKGROUND_IMAGES = undefined;
      //customVirtualBackgroundImages = [{ url: 'custom1.jpg', name: 'custom1' }];
      const result = getBackgroundImages();
      expect(result.length).toBe(1);
      expect(result[0].key).toBe('0');
    });

    it('returns an array of buttons for both environment variable and custom images', () => {
      process.env.REACT_APP_VIRTUAL_BACKGROUND_IMAGES = 'image1.jpg';
      //customVirtualBackgroundImages = [{ url: 'custom1.jpg', name: 'custom1' }];
      const result = getBackgroundImages();
      expect(result.length).toBe(2);
      expect(result[0].key).toBe('0');
      expect(result[1].key).toBe('1');
    });

    it('sets the background images button list state', () => {
      process.env.REACT_APP_VIRTUAL_BACKGROUND_IMAGES = 'image1.jpg';
      //customVirtualBackgroundImages = [];
      getBackgroundImages();
      expect(setBackgroundImagesButtonList).toHaveBeenCalled();
    });
  });
  */

});
