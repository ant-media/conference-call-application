// src/Button.test.js
import React from 'react';
import { render } from '@testing-library/react';
import MeetingRoom from 'pages/MeetingRoom';
import theme from "styles/theme";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";

// Mock the props
const props = {
  messageDrawerOpen: false,
  participantListDrawerOpen: false,
  effectsDrawerOpen: false,
  publisherRequestListDrawerOpen: false,
  showEmojis: false,
  sendReactions: jest.fn(),
  setShowEmojis: jest.fn(),
  globals: {
    maxVideoTrackCount: 6,
    desiredTileCount: 6,
    trackEvents: [],
  },
  audioTracks: [{ audio: { streamId: "1234", track: "" } }],
  participantIdMuted: null,
  isMuteParticipantDialogOpen: false,
  setMuteParticipantDialogOpen: jest.fn(),
  publishStreamId: "test-publish-stream-id",
  pinVideo: jest.fn(),
  allParticipants: {
    "test-stream-id": {
      role: "host",
      participantID: "test-participant-id",
      streamID: "test-stream-id",
      videoTrack: "test-video-track",
      audioTrack: "test-audio-track",
      videoLabel: "test-video-label",
    },
  },
  participantUpdated: jest.fn(),
  videoTrackAssignments: [{ id: 1, name: "test" }],
  updateMaxVideoTrackCount: jest.fn(),
  talkers: [],
  streamName: "Test Stream",
  isPublished: false,
  isPlayOnly: false,
  isMyMicMuted: false,
  isMyCamTurnedOff: false,
  setAudioLevelListener: jest.fn(),
  setParticipantIdMuted: jest.fn(),
  turnOnYourMicNotification: jest.fn(),
  turnOffYourMicNotification: jest.fn(),
  turnOffYourCamNotification: jest.fn(),
  isAdmin: false,
  localVideo: {},
  localVideoCreate: jest.fn(),
  isRecordPluginActive: false,
  isEnterDirectly: false,
  cameraButtonDisabled: false,
  checkAndTurnOffLocalCamera: jest.fn(),
  checkAndTurnOnLocalCamera: jest.fn(),
  toggleMic: jest.fn(),
  microphoneButtonDisabled: false,
  isScreenShared: false,
  handleStartScreenShare: jest.fn(),
  handleStopScreenShare: jest.fn(),
  numberOfUnReadMessages: 0,
  toggleSetNumberOfUnreadMessages: jest.fn(),
  handleMessageDrawerOpen: jest.fn(),
  participantCount: 2,
  handleParticipantListOpen: jest.fn(),
  requestSpeakerList: jest.fn(),
  handlePublisherRequestListOpen: jest.fn(),
  handlePublisherRequest: jest.fn(),
  setLeftTheRoom: jest.fn(),
  addFakeParticipant: jest.fn(),
  removeFakeParticipant: jest.fn(),
  fakeReconnect: jest.fn(),
  isBroadcasting: false,
  handleSetDesiredTileCount: jest.fn(),
  handleBackgroundReplacement: jest.fn(),
  microphoneSelected: jest.fn(),
  devices: {
    cameras: [{ id: "cam-1", name: "Camera 1" }],
    microphones: [{ id: "mic-1", name: "Microphone 1" }],
    speakers: [{ id: "speaker-1", name: "Speaker 1" }],
  },
  selectedCamera: "cam-1",
  cameraSelected: jest.fn(),
  selectedMicrophone: "mic-1",
  selectedBackgroundMode: "none",
  setSelectedBackgroundMode: jest.fn(),
  videoSendResolution: "720p",
  setVideoSendResolution: jest.fn(),
  isRecordPluginInstalled: false,
  startRecord: jest.fn(),
  stopRecord: jest.fn(),
  handleEffectsOpen: jest.fn(),
};


// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

jest.mock('utils', () => ({
  isComponentMode: jest.fn(),
  getRoomNameAttribute: jest.fn(),
  getRootAttribute: jest.fn(),
  urlify: jest.fn(),
}));

jest.mock('Components/Footer/Footer', () => ({ value }) => <div data-testid="mocked-footer">{value}</div>);
jest.mock('Components/MuteParticipantDialog', () => ({ value }) => <div data-testid="mocked-mute-participant-dialog">{value}</div>);
jest.mock('pages/LayoutPinned', () => ({ value }) => <div data-testid="mocked-layout-pinned">{value}</div>);
jest.mock('pages/LayoutTiled', () => ({ value }) => <div data-testid="mocked-layout-tiled">{value}</div>);
jest.mock('Components/Cards/VideoCard', () => ({ value }) => <div data-testid="mocked-video-card">{value}</div>);

describe('Pinned Layout Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });


  it('renders without crashing', () => {
    const { container, getByText, getByRole } = render(
        <MeetingRoom
            {...props}
        />
      );

    console.log(container.outerHTML);
  });
});

describe('Reactions Component', () => {
  it('should have position style as absolute when isComponentMode is true', () => {
    props.showEmojis = true;
    require('utils').isComponentMode.mockImplementation(() => true);
    const { container } = render(
      <ThemeProvider theme={theme(ThemeList.Green)}>
        <MeetingRoom
            {...props}
        />
      </ThemeProvider>
    );
    const meetingReactionsDiv = container.querySelector('#meeting-reactions');
    expect(meetingReactionsDiv).toHaveStyle('position: absolute');
  });

  it('should have position style as fixed when isComponentMode is false', () => {
    props.showEmojis = true;
    require('utils').isComponentMode.mockImplementation(() => false);
    const { container } = render(
      <ThemeProvider theme={theme(ThemeList.Green)}>
        <MeetingRoom
            {...props}
        />
      </ThemeProvider>
    );
    const meetingReactionsDiv = container.querySelector('#meeting-reactions');
    expect(meetingReactionsDiv).toHaveStyle('position: fixed');
  });
});
