import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import WaitingRoom from 'pages/WaitingRoom';
import React from "react";
import {ThemeProvider} from "@mui/material/styles";
import { ConferenceContext } from 'pages/AntMedia';
import {useSnackbar} from "notistack";
import theme from "../../styles/theme";
import {ThemeList} from "../../styles/themeList";

const contextValue = {
  initialized: true,
  setLocalVideo: jest.fn(),
  localVideoCreate: jest.fn(),
  setIsJoining: jest.fn(),
  joinRoom: jest.fn(),
  localVideo: {},
  setSpeedTestObject: jest.fn(),
  makeId: jest.fn(),
  checkVideoTrackHealth: jest.fn().mockReturnValue(false),
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

  it('shows error if the camera is not working', async () => {
    contextValue.checkVideoTrackHealth.mockReturnValue(false);

    const mockEnqueueSnackbar = jest.fn();

    jest.mock('notistack', () => ({
      useSnackbar: () => {
        return {
          enqueueSnackbar: mockEnqueueSnackbar,
        };
      },
    }));

    const { getByTestId } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <WaitingRoom />
        </ThemeProvider>
    );

    fireEvent.click(getByTestId('join-room-button'));

    await waitFor(() => {
      expect(mockEnqueueSnackbar).not.toHaveBeenCalledWith(
          {
            message: "Your camera is not working properly. Please check your camera settings",
            variant: "error",
            icon: expect.anything(),
          },
          expect.any(Object)
      );
    });
  });


  describe('joinRoom', () => {
    it('shows error message if camera is not working properly', () => {
      render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <WaitingRoom />
          </ThemeProvider>
      )

      fireEvent.submit(screen.getByRole('form'));

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Your camera is not working properly. Please check your camera settings",
          }),
          expect.any(Object)
      );
    });

    it('shows info message if microphone and camera permissions are not allowed', () => {
      const mockEnqueueSnackbar = jest.fn();
      const mockConference = {
        checkVideoTrackHealth: jest.fn().mockReturnValue(true),
        localVideo: null,
        isPlayOnly: false,
      };
      React.useContext = jest.fn().mockReturnValue(mockConference);
      useSnackbar.mockReturnValue({ enqueueSnackbar: mockEnqueueSnackbar });

      render(<WaitingRoom />);
      fireEvent.submit(screen.getByRole('form'));

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "You need to allow microphone and camera permissions before joining",
          }),
          expect.any(Object)
      );
    });

    it('generates streamId if publishStreamId is null or undefined', () => {
      const mockConference = {
        checkVideoTrackHealth: jest.fn().mockReturnValue(true),
        localVideo: {},
        isPlayOnly: false,
        streamName: 'testStream',
        makeid: jest.fn().mockReturnValue('1234567890'),
        joinRoom: jest.fn(),
      };
      React.useContext = jest.fn().mockReturnValue(mockConference);

      render(<WaitingRoom />);
      fireEvent.submit(screen.getByRole('form'));

      expect(mockConference.joinRoom).toHaveBeenCalledWith('roomName', 'testStream_1234567890');
    });

    it('uses publishStreamId if it is defined', () => {
      const mockConference = {
        checkVideoTrackHealth: jest.fn().mockReturnValue(true),
        localVideo: {},
        isPlayOnly: false,
        joinRoom: jest.fn(),
      };
      React.useContext = jest.fn().mockReturnValue(mockConference);
      global.publishStreamId = 'definedStreamId';

      render(<WaitingRoom />);
      fireEvent.submit(screen.getByRole('form'));

      expect(mockConference.joinRoom).toHaveBeenCalledWith('roomName', 'definedStreamId');
    });

    it('starts speed test if required before joining the room', () => {
      process.env.REACT_APP_SPEED_TEST_BEFORE_JOINING_THE_ROOM = 'true';
      global.enterDirectly = false;
      const mockConference = {
        checkVideoTrackHealth: jest.fn().mockReturnValue(true),
        localVideo: {},
        isPlayOnly: false,
        setSpeedTestObject: jest.fn(),
        startSpeedTest: jest.fn(),
      };
      React.useContext = jest.fn().mockReturnValue(mockConference);

      render(<WaitingRoom />);
      fireEvent.submit(screen.getByRole('form'));

      expect(mockConference.setSpeedTestObject).toHaveBeenCalled();
      expect(mockConference.startSpeedTest).toHaveBeenCalled();
    });

    it('joins room directly if speed test is not required', () => {
      process.env.REACT_APP_SPEED_TEST_BEFORE_JOINING_THE_ROOM = 'false';
      const mockConference = {
        checkVideoTrackHealth: jest.fn().mockReturnValue(true),
        localVideo: {},
        isPlayOnly: false,
        joinRoom: jest.fn(),
        setIsJoining: jest.fn(),
      };
      React.useContext = jest.fn().mockReturnValue(mockConference);

      render(<WaitingRoom />);
      fireEvent.submit(screen.getByRole('form'));

      expect(mockConference.setIsJoining).toHaveBeenCalledWith(true);
      expect(mockConference.joinRoom).toHaveBeenCalled();
    });
  });

});
