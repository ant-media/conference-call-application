// src/ParticipantTab.test.js
import React from 'react';
import {fireEvent, render} from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import ParticipantTab from 'Components/ParticipantTab';
import theme from "styles/theme";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";

// Mock the context value
const contextValue = {
  presenters: [],
  approvedSpeakerRequestList: [],
  presenterButtonDisabled: [],
  presenterButtonStreamIdInProcess: '',
  allParticipants: {
    'test-stream-id': {
      role: 'host',
      participantID: 'test-participant-id',
      streamID: 'test-stream-id',
      videoTrack: 'test-video-track',
      audioTrack: 'test-audio-track',
      videoLabel: 'test-video-label',
    },
    'test-stream-id-2': {
        role: 'host',
        participantID: 'test-participant-id-2',
        streamID: 'test-stream-id-2',
        videoTrack: 'test-video-track-2',
        audioTrack: 'test-audio-track-2',
        videoLabel: 'test-video-label-2',
        metaData: {
          isMuted: false
        }
    }
  },
  publishStreamId: 'test-stream-id',
  pinVideo: jest.fn(),
  makeParticipantPresenter: jest.fn(),
  pagedParticipants: {
    'test-stream-id': {
        role: 'host',
        participantID: 'test-participant-id',
        streamID: 'test-stream-id',
        videoTrack: 'test-video-track',
        audioTrack: 'test-audio-track',
        videoLabel: 'test-video-label',
    },
    'test-stream-id-2': {
      role: 'host',
      participantID: 'test-participant-id-2',
      streamID: 'test-stream-id-2',
      videoTrack: 'test-video-track-2',
      audioTrack: 'test-audio-track-2',
      videoLabel: 'test-video-label-2',
      metaData: {
        isMuted: false
      }
    }
  },
  isAdmin: true,
  isPlayOnly: false,
  videoTrackAssignments: [
      {streamID: 'test-stream-id', participantID: 'test-participant-id', videoTrack: 'test-video-track', audioTrack: 'test-audio-track', videoLabel: 'test-video-label'},
      {streamID: 'test-stream-id-2', participantID: 'test-participant-id-2', videoTrack: 'test-video-track-2', audioTrack: 'test-audio-track-2', videoLabel: 'test-video-label-2'}
  ],
  globals: {
    maxVideoTrackCount: 6,
    desiredTileCount: 6,
    trackEvents: [],
    participantListPagination: {
      currentPage: 1,
      pageSize: 15,
      totalPage: 1,
      startIndex: 0,
      endIndex: 15
    }
  },
  muteLocalMic: jest.fn(),
  turnOffYourMicNotification: jest.fn(),
  setParticipantIdMuted: jest.fn(),
  updateAllParticipantsPagination: jest.fn(),
};

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

describe('ParticipantTab Component', () => {

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
        <ParticipantTab/>
      </ThemeProvider>
    );
  });

  it('renders getParticipantItem without crashing', () => {
    const { container } = render(
      <ThemeProvider theme={theme(ThemeList.Green)}>
        <ParticipantTab />
      </ThemeProvider>
    );
    const participantItem = container.innerHTML.includes('participant-item-'+contextValue.videoTrackAssignments[0].streamID);
    expect(participantItem).toBe(true);
  });

  it('renders getAdminButtons without crashing', () => {
    contextValue.isAdmin = true;
    process.env.REACT_APP_PARTICIPANT_TAB_ADMIN_MODE_ENABLED=true

    const { container } = render(
      <ThemeProvider theme={theme(ThemeList.Green)}>
        <ParticipantTab />
      </ThemeProvider>
    );

    const adminButtons = container.innerHTML.includes('admin-button-group-'+contextValue.videoTrackAssignments[0].streamID);
    expect(adminButtons).toBe(true);
  });

  it('renders presenter button with correct icon and color', () => {
    contextValue.isAdmin = true;
    process.env.REACT_APP_PARTICIPANT_TAB_ADMIN_MODE_ENABLED=true

    const { getByTestId } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <ParticipantTab />
        </ThemeProvider>
    );
    const presenterButton = getByTestId('add-presenter-test-stream-id');
    expect(presenterButton).toBeInTheDocument();
  });

  it('check muteLocalMic called in getMuteParticipantButton', () => {
    contextValue.isAdmin = true;
    process.env.REACT_APP_PARTICIPANT_TAB_MUTE_PARTICIPANT_BUTTON_ENABLED=true

    const { getByTestId } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <ParticipantTab />
        </ThemeProvider>
    );
    const micToggleParticipant = getByTestId('mic-toggle-participant-test-stream-id');
    expect(micToggleParticipant).toBeInTheDocument();

    micToggleParticipant.click();
    expect(contextValue.muteLocalMic).toHaveBeenCalled();
    expect(contextValue.setParticipantIdMuted).not.toHaveBeenCalled();
    expect(contextValue.turnOffYourMicNotification).not.toHaveBeenCalled();
  });

  it('check turnOffYourMicNotification called in getMuteParticipantButton', () => {
    contextValue.isAdmin = true;
    process.env.REACT_APP_PARTICIPANT_TAB_MUTE_PARTICIPANT_BUTTON_ENABLED=true

    const { getByTestId } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <ParticipantTab />
        </ThemeProvider>
    );
    const micToggleParticipant = getByTestId('mic-toggle-participant-test-stream-id-2');
    expect(micToggleParticipant).toBeInTheDocument();

    micToggleParticipant.click();
    expect(contextValue.muteLocalMic).not.toHaveBeenCalled();
    expect(contextValue.setParticipantIdMuted).toHaveBeenCalled();
    expect(contextValue.turnOffYourMicNotification).toHaveBeenCalled();
  });

  describe('ParticipantTab handleScroll', () => {
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

    it('calls handleScroll and updates state when bottom is reached', () => {
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <ParticipantTab />
          </ThemeProvider>
      );

      // Mock the scroll container
      const scrollContainer = container.querySelector('#paper-props');
      Object.defineProperty(scrollContainer, 'scrollHeight', { value: 200, writable: true });
      Object.defineProperty(scrollContainer, 'clientHeight', { value: 100, writable: true });
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 99, writable: true });

      // Simulate scroll event
      fireEvent.scroll(scrollContainer);

      // Check if setIsBottom was called and loadMoreParticipants is triggered
      expect(contextValue.updateAllParticipantsPagination).not.toHaveBeenCalledWith(
          contextValue.globals.participantListPagination.currentPage + 1
      );
    });

    it('does not call loadMoreParticipants if not at the bottom', () => {
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <ParticipantTab />
          </ThemeProvider>
      );

      const scrollContainer = container.querySelector('#paper-props');
      Object.defineProperty(scrollContainer, 'scrollHeight', { value: 200, writable: true });
      Object.defineProperty(scrollContainer, 'clientHeight', { value: 100, writable: true });
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 50, writable: true });

      // Simulate scroll event
      fireEvent.scroll(scrollContainer);

      // Ensure loadMoreParticipants is not triggered
      expect(contextValue.updateAllParticipantsPagination).not.toHaveBeenCalled();
    });
  });
});
