import React from 'react';
import { render } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import OthersCard from 'Components/Cards/OthersCard';
import theme from "styles/theme";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";

// Mock the context value
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

describe('OthersCard Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();

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
        <OthersCard/>
      </ThemeProvider>
    );
  });

});
