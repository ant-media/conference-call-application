import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import WaitingRoom from 'pages/WaitingRoom';
import React from "react";
import AntMedia, { ConferenceContext } from 'pages/AntMedia';
import {ThemeProvider} from "@mui/material/styles";
import theme from "../../styles/theme";
import {ThemeList} from "../../styles/themeList";
import {useSnackbar} from "notistack";

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
  getRootAttribute: jest.fn().mockImplementation(() => 'roomName'),
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
    render(<WaitingRoom/>);
  });

    it('should click join room button', () => {
      const {getByTestId} = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <WaitingRoom/>
          </ThemeProvider>);
        getByTestId('join-room-button').click();

    });

  it('shows error message if camera is not working properly', () => {
    const mockEnqueueSnackbar = jest.fn();
    jest.mock('notistack', () => ({
      useSnackbar: () => {
        return {
          enqueueSnackbar: mockEnqueueSnackbar,
        };
      },
    }));

    const {getByTestId} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <WaitingRoom/>
        </ThemeProvider>);

    getByTestId('join-room-button').click();

    expect(mockEnqueueSnackbar).not.toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Your camera is not working properly. Please check your camera settings",
        }),
        expect.any(Object)
    );
  });

});
