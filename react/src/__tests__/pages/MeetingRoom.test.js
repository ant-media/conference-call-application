// src/Button.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import LayoutPinned from 'pages/LayoutPinned';
import { random } from 'lodash';
import theme from "styles/theme";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";
import VideoCard from 'Components/Cards/VideoCard';
import { assert } from 'workbox-core/_private';
import MeetingRoom from 'pages/MeetingRoom';

// Mock the context value
const contextValue = {
  allParticipants: {},
  videoTrackAssignments: [{id: 1, name: 'test'}],
  audioTracks: [{audio: {streamId:"1234", track: ""}}],
};

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
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
