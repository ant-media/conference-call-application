import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import WaitingRoom from 'pages/WaitingRoom';
import React from "react";
import { ConferenceContext } from 'pages/AntMedia';

const contextValue = {
  initialized: true,
  setLocalVideo: jest.fn(),
  localVideoCreate: jest.fn(),
  setIsJoining: jest.fn(),
  joinRoom: jest.fn(),
  localVideo: {},
  setSpeedTestObject: jest.fn(),
  makeId: jest.fn(),
};

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

jest.mock('utils', () => ({
  isComponentMode: jest.fn().mockImplementation(() => true),
  getRoomNameAttribute: jest.fn().mockImplementation(() => 'roomName'),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => {
    return {
      t: (str) => str,
    };
  },
}));

jest.mock('Components/Cards/VideoCard', () => ({ value }) => <div data-testid="mocked-video-card">{value}</div>);
jest.mock('Components/Footer/Components/MicButton', () => ({ value }) => <div data-testid="mocked-mic-button">{value}</div>);
jest.mock('Components/Footer/Components/CameraButton', () => ({ value }) => <div data-testid="mocked-camera-button">{value}</div>);
jest.mock('Components/Footer/Components/SettingsDialog', () => ({ value }) => <div data-testid="mocked-settings-dialog">{value}</div>);
jest.mock('pages/AntMedia', () => ({ value }) => <div data-testid="mocked-ant-media">{value}</div>);

describe('Waiting Room Component', () => {

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


  it('renders WaitingRoom component without crashing', () => {
    render(<WaitingRoom />);
    const linkElement = screen.getByText(/What's your name?/i);
    expect(linkElement).toBeInTheDocument();
  });

});
