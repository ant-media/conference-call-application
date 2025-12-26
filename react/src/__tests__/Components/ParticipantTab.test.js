// src/ParticipantTab.test.js
import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import ParticipantTab from 'Components/ParticipantTab';
import theme from "styles/theme";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";

const props = {
  globals: {
    maxVideoTrackCount: 6,
    desiredTileCount: 6,
    trackEvents: [],
    participantListPagination: {
      currentPage: 1,
      pageSize: 15,
      totalPage: 1,
      startIndex: 0,
      endIndex: 15,
    },
  },
  isAdmin: false,
  pinVideo: jest.fn(),
  makeListenerAgain: jest.fn(),
  videoTrackAssignments: [
    {
      streamID: "test-stream-id",
      participantID: "test-participant-id",
      videoTrack: "test-video-track",
      audioTrack: "test-audio-track",
      videoLabel: "test-video-label",
    },
    {
      streamID: "test-stream-id-2",
      participantID: "test-participant-id-2",
      videoTrack: "test-video-track-2",
      audioTrack: "test-audio-track-2",
      videoLabel: "test-video-label-2",
    },
  ],
  presenterButtonStreamIdInProcess: "",
  presenterButtonDisabled: [],
  makeParticipantPresenter: jest.fn(),
  makeParticipantUndoPresenter: jest.fn(),
  participantCount: 2,
  isMyMicMuted: false,
  publishStreamId: "test-stream-id",
  muteLocalMic: jest.fn(),
  turnOffYourMicNotification: jest.fn(),
  setParticipantIdMuted: jest.fn(),
  pagedParticipants: {
    "test-stream-id": {
      role: "host",
      participantID: "test-participant-id",
      streamID: "test-stream-id",
      videoTrack: "test-video-track",
      audioTrack: "test-audio-track",
      videoLabel: "test-video-label",
    },
    "test-stream-id-2": {
      role: "host",
      participantID: "test-participant-id-2",
      streamID: "test-stream-id-2",
      videoTrack: "test-video-track-2",
      audioTrack: "test-audio-track-2",
      videoLabel: "test-video-label-2",
      metaData: {
        isMuted: false,
      },
    },
  },
  loadMoreParticipants: jest.fn(),
};

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

describe('ParticipantTab Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <ThemeProvider theme={theme(ThemeList.Green)}>
        <ParticipantTab
            {...props}
        />
      </ThemeProvider>
    );
  });

  it('renders getParticipantItem without crashing', () => {
    const { container } = render(
      <ThemeProvider theme={theme(ThemeList.Green)}>
        <ParticipantTab
            {...props}
        />
      </ThemeProvider>
    );
    const participantItem = container.innerHTML.includes('participant-item-'+props.videoTrackAssignments[0].streamID);
    expect(participantItem).toBe(true);
  });

  it('renders getAdminButtons without crashing', () => {
    props.isAdmin = true;
    process.env.REACT_APP_PARTICIPANT_TAB_ADMIN_MODE_ENABLED=true

    const { container } = render(
      <ThemeProvider theme={theme(ThemeList.Green)}>
        <ParticipantTab
            {...props}
        />
      </ThemeProvider>
    );

    const adminButtons = container.innerHTML.includes('admin-button-group-'+props.videoTrackAssignments[0].streamID);
    expect(adminButtons).toBe(true);
  });

  it('renders presenter button with correct icon and color', () => {
    props.isAdmin = true;
    process.env.REACT_APP_PARTICIPANT_TAB_ADMIN_MODE_ENABLED=true

    const { getByTestId } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <ParticipantTab
              {...props}
          />
        </ThemeProvider>
    );
    const presenterButton = getByTestId('add-presenter-test-stream-id');
    expect(presenterButton).toBeInTheDocument();
  });

  it('check muteLocalMic called in getMuteParticipantButton', () => {
    props.isAdmin = true;
    process.env.REACT_APP_PARTICIPANT_TAB_MUTE_PARTICIPANT_BUTTON_ENABLED=true

    const { getByTestId } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <ParticipantTab
              {...props}
          />
        </ThemeProvider>
    );
    const micToggleParticipant = getByTestId('mic-toggle-participant-test-stream-id');
    expect(micToggleParticipant).toBeInTheDocument();

    micToggleParticipant.click();
    expect(props.muteLocalMic).toHaveBeenCalled();
    expect(props.setParticipantIdMuted).not.toHaveBeenCalled();
    expect(props.turnOffYourMicNotification).not.toHaveBeenCalled();
  });

  it('check turnOffYourMicNotification called in getMuteParticipantButton', () => {
    props.isAdmin = true;
    process.env.REACT_APP_PARTICIPANT_TAB_MUTE_PARTICIPANT_BUTTON_ENABLED=true

    const { getByTestId } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <ParticipantTab
              {...props}
          />
        </ThemeProvider>
    );
    const micToggleParticipant = getByTestId('mic-toggle-participant-test-stream-id-2');
    expect(micToggleParticipant).toBeInTheDocument();

    micToggleParticipant.click();
    expect(props.muteLocalMic).not.toHaveBeenCalled();
    expect(props.setParticipantIdMuted).toHaveBeenCalled();
    expect(props.turnOffYourMicNotification).toHaveBeenCalled();
  });

  describe('ParticipantTab handleScroll', () => {
    beforeEach(() => {
      // Reset the mock implementation before each test
      jest.clearAllMocks();
    });

    it('calls handleScroll and updates state when bottom is reached', async () => {
      jest.useFakeTimers();

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <ParticipantTab
                {...props}
            />
          </ThemeProvider>
      );

      // Mock the scroll container
      const scrollContainer = container.querySelector('#participant-scroll');
      Object.defineProperty(scrollContainer, 'scrollHeight', { value: 200, writable: true });
      Object.defineProperty(scrollContainer, 'clientHeight', { value: 200, writable: true });
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 99, writable: true });

      // Simulate scroll event
      fireEvent.scroll(scrollContainer);

      jest.advanceTimersByTime(1000);

      // Check if setIsBottom was called and loadMoreParticipants is triggered
      await waitFor(() => {
        expect(props.loadMoreParticipants).toHaveBeenCalled();
      });
      jest.clearAllTimers()
    });

    it('does not call loadMoreParticipants if not at the bottom', () => {
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <ParticipantTab
                {...props}
            />
          </ThemeProvider>
      );

      const scrollContainer = container.querySelector('#participant-scroll');
      Object.defineProperty(scrollContainer, 'scrollHeight', { value: 200, writable: true });
      Object.defineProperty(scrollContainer, 'clientHeight', { value: 100, writable: true });
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 50, writable: true });

      // Simulate scroll event
      fireEvent.scroll(scrollContainer);

      // Ensure loadMoreParticipants is not triggered
      expect(props.loadMoreParticipants).not.toHaveBeenCalled();
    });

  });
});
