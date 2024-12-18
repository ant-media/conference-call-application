// src/Button.test.js
import React from 'react';
import { render } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import LayoutPinned from 'pages/LayoutPinned';
import theme from "styles/theme";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";

// Mock the props
const props = {
  pinnedParticipant: {
    participantID: "participant-1",
    streamID: "stream-1",
  },
  gallerySize: {
    w: 800,
    h: 600,
  },
  globals: {
    desiredTileCount: 10,
  },
  publishStreamId: "stream-1",
  pinVideo: jest.fn(),
  allParticipants: {},
  videoTrackAssignments: [],
  updateMaxVideoTrackCount: jest.fn(),
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
            <LayoutPinned
                {...props}
            />
        </ThemeProvider>
      );

    console.log(container.outerHTML);
  });

  it('test other cards not visible until limit', () => {
    process.env.REACT_APP_LAYOUT_OTHERS_CARD_VISIBILITY = true;
    var noOfParticipants = 4;

    for (let i = 0; i < noOfParticipants; i++) {
      props.allParticipants[`p${i}`] = {streamId: `p${i}`, name: `test${i}`};
      props.videoTrackAssignments.push({streamId: `p${i}`, videoLabel: `test${i}`, track: null, name: `test${i}`});
    }

    props.pinnedVideoId = 1;

    const { container, getAllByTestId, queryByTestId  } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
            <LayoutPinned
                {...props}
            />
        </ThemeProvider>
      );

    const videoCards = getAllByTestId('mocked-video-card');
    expect(videoCards).toHaveLength(4);

    const otherCard = queryByTestId('mocked-others-card');
    expect(otherCard).toBeNull();

    console.log(container.outerHTML);
  });

  /*
  it('test show other cards after limit', () => {
    process.env.REACT_APP_LAYOUT_OTHERS_CARD_VISIBILITY = true;
    var noOfParticipants = 10;

    for (let i = 0; i < noOfParticipants; i++) {
      props.allParticipants[`p${i}`] = {streamId: `p${i}`, name: `test${i}`};
      props.videoTrackAssignments.push({streamId: `p${i}`, videoLabel: `test${i}`, track: null, name: `test${i}`});
    }

    props.pinnedVideoId = 1;

    const { container, getAllByTestId, getByTestId  } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
            <LayoutPinned
                {...props}
            />
        </ThemeProvider>
      );

    const videoCards = getAllByTestId('mocked-video-card');
    expect(videoCards).toHaveLength(4);

    const otherCard = getByTestId('mocked-others-card');
    expect(otherCard).toBeTruthy();

    console.log(container.outerHTML);
  });

  it('set the max video count', () => {
    process.env.REACT_APP_LAYOUT_OTHERS_CARD_VISIBILITY = true;
    props.pipinnedVideoId = 1;

    const { container, getAllByTestId, getByTestId  } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
            <LayoutPinned
                {...props}
            />
        </ThemeProvider>
      );

      expect(props.updateMaxVideoTrackCount).toHaveBeenCalledWith(3);

  });
  */
});
