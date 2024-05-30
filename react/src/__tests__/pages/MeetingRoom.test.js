// src/Button.test.js
import React from 'react';
import { render } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import MeetingRoom from 'pages/MeetingRoom';
import theme from "styles/theme";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";

// Mock the context value
const contextValue = {
  allParticipants: {},
  videoTrackAssignments: [{id: 1, name: 'test'}],
  audioTracks: [{audio: {streamId:"1234", track: ""}}],
  showEmojis: false,
};

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

jest.mock('utils', () => ({
  isComponentMode: jest.fn(),
  getRoomNameAttribute: jest.fn(),
  getWebSocketURLAttribute: jest.fn(),
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

    React.useContext.mockImplementation(input => {
      if (input === ConferenceContext) {
        return contextValue;
      }
      return jest.requireActual('react').useContext(input);
    });
  });


  it('renders without crashing', () => {
    const { container, getByText, getByRole } = render(
        <MeetingRoom />
      );

    console.log(container.outerHTML);
  });
});

describe('Reactions Component', () => {
  it('should have position style as absolute when isComponentMode is true', () => {
    contextValue.showEmojis = true;
    require('utils').isComponentMode.mockImplementation(() => true);
    const { container } = render(
      <ThemeProvider theme={theme(ThemeList.Green)}>
        <MeetingRoom />
      </ThemeProvider>
    );
    const meetingReactionsDiv = container.querySelector('#meeting-reactions');
    expect(meetingReactionsDiv).toHaveStyle('position: absolute');
  });

  it('should have position style as fixed when isComponentMode is false', () => {
    contextValue.showEmojis = true;
    require('utils').isComponentMode.mockImplementation(() => false);
    const { container } = render(
      <ThemeProvider theme={theme(ThemeList.Green)}>
        <MeetingRoom />
      </ThemeProvider>
    );
    const meetingReactionsDiv = container.querySelector('#meeting-reactions');
    expect(meetingReactionsDiv).toHaveStyle('position: fixed');
  });
});
