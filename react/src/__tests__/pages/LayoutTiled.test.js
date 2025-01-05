// src/Button.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import LayoutTiled from 'pages/LayoutTiled';
import { random } from 'lodash';
import theme from "styles/theme";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";
import VideoCard from 'Components/Cards/VideoCard';
import { assert } from 'workbox-core/_private';

// Mock the props
const props = {
  gallerySize: {
    w: 800,
    h: 600,
  },
  videoTrackAssignments: [{ id: 1, name: "test" }],
  participantUpdated: jest.fn(),
  allParticipants: {
    "participant-1": {
      role: "host",
      participantID: "participant-1",
      streamID: "stream-1",
      videoTrack: "video-track-1",
      audioTrack: "audio-track-1",
      videoLabel: "label-1",
    },
  },
  globals: {
    desiredTileCount: 10,
  },
  updateMaxVideoTrackCount: jest.fn(),
  publishStreamId: "stream-1",
  talkers: ["participant-1"],
  streamName: "Test Stream",
  isPublished: true,
  isPlayOnly: false,
  isMyMicMuted: false,
  isMyCamTurnedOff: false,
  setAudioLevelListener: jest.fn(),
  setParticipantIdMuted: jest.fn(),
  turnOnYourMicNotification: jest.fn(),
  turnOffYourMicNotification: jest.fn(),
  turnOffYourCamNotification: jest.fn(),
  pinVideo: jest.fn(),
  isAdmin: false,
  localVideo: {
    id: "local-video-1",
    track: "video-track",
  },
  localVideoCreate: jest.fn(),
};


// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

jest.mock('Components/Cards/VideoCard', () => ({ value }) => <div data-testid="mocked-video-card">{value}</div>);
jest.mock('Components/Cards/OthersCard', () => ({ value }) => <div data-testid="mocked-others-card">{value}</div>);


describe('Pinned Layout Component', () => {
  
  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });
  

  it('renders without crashing', () => {
    const { container, getByText, getByRole } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
            <LayoutTiled
                {...props}
            />
        </ThemeProvider>
      );

    console.log(container.outerHTML);
  });

  
  it('set the max video count', () => {
    process.env.REACT_APP_LAYOUT_OTHERS_CARD_VISIBILITY = true;

    const { container, getAllByTestId, getByTestId  } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
            <LayoutTiled
                {...props}
            />
        </ThemeProvider>
      );

      expect(props.updateMaxVideoTrackCount).toHaveBeenCalledWith(9);

  });
});
