import React from 'react';
import { render } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import ParticipantTab from 'Components/ParticipantTab';
import theme from "styles/theme";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";

// Mock the context value
const contextValue = {
  presenters: [],
  approvedSpeakerRequestList: [],
  presenterButtonDisabled: false,
  presenterButtonStreamIdInProcess: '',
  allParticipants: {},
  publishStreamId: 'test-stream-id',
  pinVideo: jest.fn(),
  makeParticipantPresenter: jest.fn(),
  isAdmin: true,
  isPlayOnly: false,
  videoTrackAssignments: [{streamID: 'test-stream-id', participantID: 'test-participant-id', videoTrack: 'test-video-track', audioTrack: 'test-audio-track', videoLabel: 'test-video-label'}],
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

});
