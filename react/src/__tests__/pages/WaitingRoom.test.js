import { render, fireEvent, waitFor } from '@testing-library/react';
import React from "react";
import WaitingRoom from "../../pages/WaitingRoom";
import { ConferenceContext } from 'pages/AntMedia';
import theme from "../../styles/theme";
import {ThemeList} from "../../styles/themeList";
import {ThemeProvider} from "@mui/material";
import { useSnackbar} from 'notistack';


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

const props = {
  isPlayOnly: false,
  initialized: false,
  localVideoCreate: jest.fn(),
  localVideo: null,
  streamName: "test-stream-id",
  setStreamName: jest.fn(),
  makeid: jest.fn(),
  setSpeedTestObject: jest.fn(),
  speedTestStreamId: "speed-test-stream-id",
  startSpeedTest: jest.fn(),
  stopSpeedTest: jest.fn(),
  setIsJoining: jest.fn(),
  joinRoom: jest.fn(),
  speedTestObject: {},
  setWaitingOrMeetingRoom: jest.fn(),
  handleBackgroundReplacement: jest.fn(),
  isMyCamTurnedOff: false,
  cameraButtonDisabled: false,
  checkAndTurnOffLocalCamera: jest.fn(),
  checkAndTurnOnLocalCamera: jest.fn(),
  isMyMicMuted: false,
  toggleMic: jest.fn(),
  microphoneButtonDisabled: false,
  microphoneSelected: jest.fn(),
  devices: [],
  selectedCamera: "default",
  cameraSelected: jest.fn(),
  selectedMicrophone: "default",
  selectedBackgroundMode: "default",
  setSelectedBackgroundMode: jest.fn(),
  videoSendResolution: "default",
  setVideoSendResolution: jest.fn(),
  talkers: [],
  isPublished: true,
  allParticipants: {},
  setAudioLevelListener: jest.fn(),
  setParticipantIdMuted: jest.fn(),
  turnOnYourMicNotification: jest.fn(),
  turnOffYourMicNotification: jest.fn(),
  turnOffYourCamNotification: jest.fn(),
  pinVideo: jest.fn(),
  isAdmin: false,
  publishStreamId: "test-stream-id",  
};

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

jest.mock('notistack', () => ({
  useSnackbar: jest.fn(),
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
jest.mock('Components/Footer/Components/MicButton', () => ({ value }) => (
    <div data-testid="mocked-mic-button">{value}</div>
));
jest.mock('Components/CustomizedBtn', () => (props) => (
    <button
        data-testid="mocked-customized-btn"
        className={props.className || ''}
        {...props}
    >
      {props.children || 'Mocked Button'}
    </button>
));
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

    const mockEnqueueSnackbar = jest.fn();
    useSnackbar.mockReturnValue({ enqueueSnackbar: mockEnqueueSnackbar });
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

  it('shows error message if camera is not working properly', () => {
    const mockEnqueueSnackbar = jest.fn();
    useSnackbar.mockReturnValue({ enqueueSnackbar: mockEnqueueSnackbar });

    const {getByTestId} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <WaitingRoom 
            checkVideoTrackHealth = {jest.fn().mockReturnValue(false)}
          />
        </ThemeProvider>
    )

    fireEvent.submit(getByTestId('join-form'));

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Your camera is not working properly. Please check your camera settings",
        }),
        expect.any(Object)
    );
  });

  it('shows info message if microphone and camera permissions are not allowed', () => {
    const mockEnqueueSnackbar = jest.fn();
    useSnackbar.mockReturnValue({ enqueueSnackbar: mockEnqueueSnackbar });

    const {getByTestId} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <WaitingRoom 
            checkVideoTrackHealth = {jest.fn().mockReturnValue(false)}
          />
        </ThemeProvider>
    )

    fireEvent.submit(getByTestId('join-form'));

    expect(mockEnqueueSnackbar).not.toHaveBeenCalledWith(
        expect.objectContaining({
          message: "You need to allow microphone and camera permissions before joining",
        }),
        expect.any(Object)
    );

  });

});
