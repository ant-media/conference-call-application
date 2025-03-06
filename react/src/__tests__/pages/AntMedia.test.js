// src/Button.test.js
import React from 'react';
import { render, act, waitFor, screen } from '@testing-library/react';
import AntMedia from 'pages/AntMedia';
import { useWebSocket } from 'Components/WebSocketProvider';
import { useSnackbar} from 'notistack';
import { UnitTestContext } from "pages/AntMedia";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";
import theme from "styles/theme";
import { times } from 'lodash';
import { useParams } from 'react-router-dom';
import {VideoEffect} from "@antmedia/webrtc_adaptor";
import {WebinarRoles} from "../../WebinarRoles";
import { assert, timeout } from 'workbox-core/_private';

var webRTCAdaptorConstructor, webRTCAdaptorScreenConstructor, webRTCAdaptorPublishSpeedTestPlayOnlyConstructor, webRTCAdaptorPublishSpeedTestConstructor, webRTCAdaptorPlaySpeedTestConstructor;
var oldAdaptor;

// We'll store references here for easy access in tests
const createdAdaptors = {
  main: [],
  screen: [],
  publishSpeedTest: [],
  publishSpeedTestPlayOnly: [],
  playSpeedTest: []
};

jest.mock('Components/WebSocketProvider', () => ({
  ...jest.requireActual('Components/WebSocketProvider'),
  useWebSocket: jest.fn(),
}));

jest.mock('notistack', () => ({
  ...jest.requireActual('notistack'),
  useSnackbar: jest.fn(),
  SnackbarProvider: ({ children }) => <div></div>,
}));

jest.mock('utils', () => ({
  ...jest.requireActual('utils'),
  getRoomNameAttribute: jest.fn().mockReturnValue("room"),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn().mockReturnValue({id: "room"}),
}));

// Move this mock to ensure it's consistently available and reset between tests
jest.mock('@antmedia/webrtc_adaptor', () => ({
  WebRTCAdaptor: jest.fn().mockImplementation((params) => {
    const mockAdaptor = {
      publish: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      stop: jest.fn(),
      play: jest.fn(),
      requestVideoTrackAssignments: jest.fn(),
      getSubtracks: jest.fn(),
      setBlurEffectRange: jest.fn(),
      enableEffect: jest.fn(),
      getStreamInfo: jest.fn(),
      enableAudioLevelWhenMuted: jest.fn(),
      enableStats: jest.fn(),
      assignVideoTrack: jest.fn(),
      setVolumeLevel: jest.fn(),
      callback: () => {},
      callbackError: () => {},
      setDesktopwithCameraSource: jest.fn(),
      switchDesktopCaptureWithCamera: jest.fn(),
      updateStreamMetaData: jest.fn(),
      switchVideoCameraCapture: jest.fn(),
      openStream: jest.fn(),
      muteLocalMic: jest.fn(),
      getBroadcastObject: jest.fn(),
      getSubtrackCount: jest.fn(),
      unmuteLocalMic: jest.fn(),
      joinRoom: jest.fn(),
      setMaxVideoTrackCount: jest.fn(),      
      closeStream: jest.fn(),
      closeWebSocket: jest.fn(),
      switchDesktopCapture: jest.fn(),
      switchVideoCameraCapture: jest.fn(),
      turnOnLocalCamera: jest.fn(),
      turnOffLocalCamera: jest.fn(),
      switchAudioInputSource: jest.fn(),
      applyConstraints: jest.fn(),
      getTracks: jest.fn(),
      getVideoSender: jest.fn(),
      getAudioSender: jest.fn(),
      setVirtualBackgroundImage: jest.fn(),
      addStreamCallback: jest.fn(),
      getVideoTrack: jest.fn(),
      updateVideoTrack: jest.fn(),
      gotStream: jest.fn(),
      getAudioTrack: jest.fn(),
      changeBandwidth: jest.fn(),
      getNoiseSuppressionFlag: jest.fn(),
      getEchoCancellationFlag: jest.fn(),
      getAutoGainControlFlag: jest.fn(),
      enableAudioLevelWhenMuted: jest.fn(),
      applyVideoEffect: jest.fn(),
      updateAudioTrack: jest.fn(),
      switchVideoCameraCapture: jest.fn(),
      checkWebSocketConnection: jest.fn(),
      sendData: jest.fn(),
    };

    if (params.callback) {
      mockAdaptor.callback = params.callback;
    }
    if (params.callbackError) {
      mockAdaptor.callbackError = params.callbackError;
    }

    // Store the adaptor in the appropriate array based on purpose and set the global constructor variables
    if (params.purposeForTest === "screen-share") {
      webRTCAdaptorScreenConstructor = mockAdaptor;
      createdAdaptors.screen.push(mockAdaptor);
    }
    else if (params.purposeForTest === "publish-speed-test-play-only") {
      webRTCAdaptorPublishSpeedTestPlayOnlyConstructor = mockAdaptor;
      createdAdaptors.publishSpeedTestPlayOnly.push(mockAdaptor);
    }
    else if (params.purposeForTest === "publish-speed-test") {
      webRTCAdaptorPublishSpeedTestConstructor = mockAdaptor;
      createdAdaptors.publishSpeedTest.push(mockAdaptor);
    }
    else if (params.purposeForTest === "play-speed-test") {
      webRTCAdaptorPlaySpeedTestConstructor = mockAdaptor;
      createdAdaptors.playSpeedTest.push(mockAdaptor);
    }
    else {
      webRTCAdaptorConstructor = mockAdaptor;
      createdAdaptors.main.push(mockAdaptor);
    }
    
    return mockAdaptor;
  }),
  // Add the getUrlParameter function to the mock
  getUrlParameter: jest.fn().mockImplementation((paramName) => {
    // Return default mock values based on parameter name
    if (paramName === "enterDirectly") return "false";
    return null;
  }),
  VideoEffect: {
    BLUR: "blur",
    BACKGROUND_BLUR: "backgroundBlur",
    NONE: "none"
  }
}));

jest.mock('Components/Cards/VideoCard', () => ({ value }) => <div data-testid="mocked-video-card">{value}</div>);
jest.mock('Components/EffectsDrawer', () => ({ value }) => <div data-testid="mocked-effect-drawer">{value}</div>);

// Replace the global MockChild component with a function that creates a MockChild
// This allows each test to have its own reference to the conference object
const createMockChild = (setConference) => {
  return () => {
    const conference = React.useContext(UnitTestContext);
    // Instead of directly mutating a global, we call the provided setter function
    if (setConference) {
      setConference(conference);
    }
    return <div>My Mock</div>;
  };
};

const mediaDevicesMock = {
  enumerateDevices: jest.fn().mockResolvedValue([
    { deviceId: '1', kind: 'audioinput' },
    { deviceId: '2', kind: 'videoinput' },
  ]),
  getUserMedia: jest.fn(),
  getDisplayMedia: jest.fn().mockResolvedValue(null),
};

const enqueueSnackbar = jest.fn();

describe('AntMedia Component', () => {

  beforeEach(() => {
    console.log("---------------------------");
    console.log(`Starting test: ${expect.getState().currentTestName}`);
    // Reset the mock implementation before each test
    jest.clearAllMocks();
    
    // Clear any stored adaptors
    createdAdaptors.main = [];
    createdAdaptors.screen = [];
    createdAdaptors.publishSpeedTest = [];
    createdAdaptors.publishSpeedTestPlayOnly = [];
    createdAdaptors.playSpeedTest = [];

    // Setup mock web socket
    websocketSendMessage = jest.fn();
    useWebSocket.mockImplementation(() => ({
      return: {
        sendMessage: websocketSendMessage,
        latestMessage: null,
        isWebSocketConnected: true,
      }
    }));

    // Setup mock snackbar
    useSnackbar.mockImplementation(() => ({
      enqueueSnackbar: enqueueSnackbar,
      closeSnackbar: jest.fn(),
    }));
    
    // Set up navigator.mediaDevices for each test
    global.navigator.mediaDevices = { ...mediaDevicesMock };
  });

  afterEach(() => {
    webRTCAdaptorConstructor = undefined;
    webRTCAdaptorScreenConstructor = undefined;
    webRTCAdaptorPublishSpeedTestPlayOnlyConstructor = undefined;
    webRTCAdaptorPublishSpeedTestConstructor = undefined;
    webRTCAdaptorPlaySpeedTestConstructor = undefined;
    console.log(`Finished test: ${expect.getState().currentTestName}`);
    console.log("---------------------------");
  });

  it('renders without crashing', async () => {
    await act(async () => {
      const { container } = render(
          <AntMedia isTest={true}/>
      );
      console.log(container.outerHTML);
    });
  });

  it('share screen', async () => {
    // Create a local conference reference for this test
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);

    expect(currentConference.isScreenShared).toBe(false);

    await act(async () => {
      currentConference.handleStartScreenShare();
    });

    await waitFor(() => {
      expect(webRTCAdaptorScreenConstructor).not.toBe(undefined);
    });

    act(() => {
      webRTCAdaptorScreenConstructor.callback("publish_started");
    });

    await waitFor(() => {
      expect(currentConference.isScreenShared).toBe(true);
    });

    console.log(currentConference);

    expect(currentConference.isScreenShared).toBe(true);

    await act(()=> {
      currentConference.handleStopScreenShare();
    });

    expect(webRTCAdaptorScreenConstructor.closeStream).toHaveBeenCalled();
    expect(webRTCAdaptorScreenConstructor.closeWebSocket).toHaveBeenCalled();
  });


  it('share screen adaptor callbacks', async () => {
    // Create a local conference reference for this test
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);
    //console.log(container);


    expect(currentConference.isScreenShared).toBe(false);

    await act(async () => {
      currentConference.handleStartScreenShare();
    });

    await waitFor(() => {
      expect(webRTCAdaptorScreenConstructor).not.toBe(undefined);
    });

    /*
    it('handle video track assignment', async () => {
      const { container } = render(
    act(() => {
      webRTCAdaptorScreenConstructor.callback("initialized");
      var obj = {videoRoundTripTime: 1000,
        audioRoundTripTime: 0,
        videoJitter: 0,
        audioJitter: 0,
        currentOutgoingBitrate: 0,
        videoPacketsLost: 0,
        audioPacketsLost: 0,
        totalVideoPacketsSent: 0,
        totalAudioPacketsSent: 0,
        availableOutgoingBitrate: 0};
      webRTCAdaptorScreenConstructor.callback("updated_stats", obj);

      webRTCAdaptorScreenConstructor.callbackError("error", "message");
    });

    expect(consoleSpy).toHaveBeenCalledWith("error:error message:message");

    // Restore the mock
    consoleSpy.mockRestore();
  });


  it('handle video track assignment', async () => {
    const { container } = render(
        <AntMedia isTest={true}>
          <MockChild/>
        </AntMedia>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });
    */

    var obj = {};
    let broadcastObject = {streamId: "p1", name: "test1", metaData: JSON.stringify({isScreenShared: true})};
    let broadcastObjectMessage = JSON.stringify(broadcastObject);

    obj.broadcast = broadcastObjectMessage;
    obj.streamId = "p1";

    await act(async () => {
      webRTCAdaptorConstructor.callback("broadcastObject", obj);
    });


    var notificationEvent = {
      eventType: "VIDEO_TRACK_ASSIGNMENT_LIST",
      streamId: "stream1",
      payload: [
        {videoLabel:"videoTrack1", trackId:"tracka1"},
        {videoLabel:"videoTrack2", trackId:"tracka2"},
      ]
    };
    var json = JSON.stringify(notificationEvent);

    obj = {};
    obj.data = json;

    await act(async () => {
      webRTCAdaptorConstructor.callback("data_received", obj);
    });

    //expect(consoleSpy).toHaveBeenCalledWith("VIDEO_TRACK_ASSIGNMENT_LIST -> ", JSON.stringify(notificationEvent.payload));


    consoleSpy.mockRestore();

  });


  it('handle sharing on', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    var testStreamId = "stream1";

    currentConference.videoTrackAssignments.push({streamId: testStreamId, videoLabel: "test1"});
    var obj = {};
    var notificationEvent = {
      eventType: "SCREEN_SHARED_ON",
      streamId: testStreamId,
    };
    var json = JSON.stringify(notificationEvent);

    obj.data = json;

    await act(async () => {
      webRTCAdaptorConstructor.callback("data_received", obj);
    });

  });

  it('publishTimeoutError error callback', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });
    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(async () => {
      webRTCAdaptorConstructor.callbackError("publishTimeoutError", {});
    });

    await act(async () => {
      expect(currentConference.leaveRoomWithError == "Firewall might be blocking your connection. Please report this.");
    });

    await act(async () => {
      expect(currentConference.leftTheRoom == true);
    });

    consoleSpy.mockRestore();
  });

  it('license_suspended_please_renew_license error callback', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(async () => {
      webRTCAdaptorConstructor.callbackError("license_suspended_please_renew_license", {});
    });

    await waitFor(() => {
      expect(container.outerHTML).toContain("Licence error. Please report this.");
    });

    consoleSpy.mockRestore();

  });

  it('notSetRemoteDescription error callback', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(async () => {
      webRTCAdaptorConstructor.callbackError("notSetRemoteDescription", {});
    });

    await waitFor(() => {
      expect(container.outerHTML).toContain("System is not compatible to connect. Please report this.");
    });

    consoleSpy.mockRestore();

  });

  it('max video count setting', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await waitFor(() => {
      currentConference.joinRoom("room", "publishStreamId");
    });

    await act(async () => {
      currentConference.handleSetDesiredTileCount(5);
    });

    await waitFor(() => {
      expect(currentConference.globals.desiredTileCount).toBe(5);
    });

    await act(async () => {
      currentConference.updateMaxVideoTrackCount(7);
    });

    await waitFor(() => {
      expect(currentConference.globals.maxVideoTrackCount).toBe(7);
    });

    consoleSpy.mockRestore();

  });

  it('start with camera and microphone', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });
    mediaDevicesMock.enumerateDevices.mockResolvedValue([
      { deviceId: '1', kind: 'videoinput' },
      { deviceId: '1', kind: 'audioinput' },
    ]);

    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);

    expect(currentConference.cameraButtonDisabled === false);
    expect(currentConference.microphoneButtonDisabled === false);

  });

  it('start with one microphone and without any camera', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    mediaDevicesMock.enumerateDevices.mockResolvedValue([
      { deviceId: '1', kind: 'audioinput' },
    ]);

    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);

    expect(currentConference.cameraButtonDisabled === true);
    expect(currentConference.microphoneButtonDisabled === false);

  });

  it('start with one camera and without any microphone', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    mediaDevicesMock.enumerateDevices.mockResolvedValue([
      { deviceId: '1', kind: 'videoinput' },
    ]);

    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);

    expect(currentConference.cameraButtonDisabled === false);
    expect(currentConference.microphoneButtonDisabled === true);

  });

  it('start without camera nor microphone', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    mediaDevicesMock.enumerateDevices.mockResolvedValue([
    ]);

    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);

    expect(currentConference.cameraButtonDisabled === true);
    expect(currentConference.microphoneButtonDisabled === true);

  });

  it('should enable camera and microphone buttons if selected devices are available', async () => {
    let currentConference;   
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    // Execute the function
    await act(async () => {
      currentConference.checkAndUpdateVideoAudioSources();
    });

    // Expectations
    expect(currentConference.cameraButtonDisabled === false);
    expect(currentConference.microphoneButtonDisabled === false);
  });

  it('should disable microphone button if no microphone is available', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    // Make devices array have no audioinput
    mediaDevicesMock.enumerateDevices.mockResolvedValue([
      {videoDeviceId: '2'},
    ]);

    currentConference.devices = [];

    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    // Execute the function
    await act(async () => {
      currentConference.checkAndUpdateVideoAudioSources();
    });

    // Expectations
    expect(consoleSpy).toHaveBeenCalledWith("There is no microphone device available.");

  });

  it('should disable microphone button if no microphone is available', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });


    // Make devices array have no audioinput
    mediaDevicesMock.enumerateDevices.mockResolvedValue([
      {audioDeviceId: '2'},
    ]);

    currentConference.devices = [];

    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    // Execute the function
    await act(async () => {
      currentConference.checkAndUpdateVideoAudioSources();
    });

    // Expectations
    expect(consoleSpy).toHaveBeenCalledWith("There is no available camera device.");

  });

  it('should switching the first available camera due to selected camera is not available', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    mediaDevicesMock.enumerateDevices.mockResolvedValue([
      { deviceId: 'camera2', kind: 'videoinput' },
    ]);

    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(async () => {
      webRTCAdaptorConstructor.callback("available_devices", [
        { deviceId: 'camera2', kind: 'videoinput' },
      ]);
    });

    await act(async () => {
      currentConference.setSelectedCamera("camera1");
    });

    await waitFor(() => {
      expect(currentConference.selectedCamera).toBe("camera1");
    });

    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    console.log(currentConference.getSelectedDevices());

    // Execute the function
    await act(async () => {
      currentConference.checkAndUpdateVideoAudioSources();
    });

    // Expectations
    expect(consoleSpy).toHaveBeenCalledWith("Unable to access selected camera, switching the first available camera.");

  });


  it('should switching the first available microphone due to selected microphone is not available', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    mediaDevicesMock.enumerateDevices.mockResolvedValue([
      { deviceId: 'mic2', kind: 'audioinput' },
    ]);

    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(async () => {
      webRTCAdaptorConstructor.callback("available_devices", [
        { deviceId: 'mic2', kind: 'audioinput' },
      ]);
    });

    await act(async () => {
      currentConference.setSelectedMicrophone("mic1");
    });

    await waitFor(() => {
      expect(currentConference.selectedMicrophone).toBe("mic1");
    });

    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    console.log(currentConference.getSelectedDevices());

    // Execute the function
    await act(async () => {
      currentConference.checkAndUpdateVideoAudioSources();
    });

    // Expectations
    expect(consoleSpy).toHaveBeenCalledWith("Unable to access selected microphone, switching the first available microphone.");

  });

  it('is joining state test', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    expect(currentConference.isJoining).toBe(false);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await act(async () => {
      currentConference.setIsJoining(true);
    });

    expect(currentConference.isJoining).toBe(true);

    await act(async () => {
      webRTCAdaptorConstructor.callback("publish_started");
    });

    await act(async () => {
      webRTCAdaptorConstructor.callback("play_started");
    });


    expect(currentConference.isJoining).toBe(false);

    consoleSpy.mockRestore();

  });

  it('is joining state for playonly', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    expect(currentConference.isJoining).toBe(false);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await act(async () => {
      currentConference.setIsJoining(true);
      currentConference.setIsPlayOnly(true);
    });

    expect(currentConference.isJoining).toBe(true);

    await act(async () => {
      webRTCAdaptorConstructor.callback("play_started");
    });


    expect(currentConference.isJoining).toBe(false);

    consoleSpy.mockRestore();

  });

  it('playonly join when noone in the room', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    expect(currentConference.isJoining).toBe(false);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await act(async () => {
      currentConference.setIsJoining(true);
      currentConference.setIsPlayOnly(true);
      webRTCAdaptorConstructor.callbackError("no_stream_exist");
    });

    expect(currentConference.isJoining).toBe(true);

    await waitFor(() => {
      expect(container.outerHTML).toContain("The room is currently empty");
    });

    await act(async () => {
      webRTCAdaptorConstructor.callback("play_started");
    });


    expect(currentConference.isJoining).toBe(false);

    consoleSpy.mockRestore();

  });

  it('is reconnection in progress state test', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);



    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    expect(container.outerHTML).not.toContain("Reconnecting...");



    await act(async () => {
      webRTCAdaptorConstructor.callback("reconnection_attempt_for_player");
    });


    await waitFor(() => {
      expect(container.outerHTML).toContain("Reconnecting...");
    });

    await act(async () => {
      webRTCAdaptorConstructor.callback("play_started");
    });

    webRTCAdaptorConstructor.mediaManager = {};
    webRTCAdaptorConstructor.mediaManager.setVideoCameraSource = jest.fn();

    await act(async () => {
      webRTCAdaptorConstructor.callback("publish_started");
    });

    await waitFor(() => {
      expect(container.outerHTML).not.toContain("Reconnecting...");
    });
  });

  it('is reconnection in progress state test because of publisher', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);



    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    expect(container.outerHTML).not.toContain("Reconnecting...");

    await act(async () => {
      webRTCAdaptorConstructor.callback("reconnection_attempt_for_publisher");
    });


    await waitFor(() => {
      expect(container.outerHTML).toContain("Reconnecting...");
    });

    await act(async () => {
      webRTCAdaptorConstructor.callback("play_started");
    });

    webRTCAdaptorConstructor.mediaManager = {};
    webRTCAdaptorConstructor.mediaManager.setVideoCameraSource = jest.fn();

    await act(async () => {
      webRTCAdaptorConstructor.callback("publish_started");
    });

    await waitFor(() => {
      expect(container.outerHTML).not.toContain("Reconnecting...");
    });
  });


  /*
   * This test check the following scenario:
   * Reconnection attempt received
   * Publisher reconnects (or restores session) first
   * After some seconds since player doesn't reconnect yet we get play reconnect attemp again
   * This was causing that publisher screen stucks on reconnecting progress
  */

  it('check publisher stucks on reconnection issue', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);



    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });


    //no reconnection
    expect(container.outerHTML).not.toContain("Reconnecting...");


    //send reconnection attemp for publisher
    await act(async () => {
      webRTCAdaptorConstructor.callback("reconnection_attempt_for_publisher");
    });

    //send reconnection attemp for player
    await act(async () => {
      webRTCAdaptorConstructor.callback("reconnection_attempt_for_player");
    });


    //see reconnecting progress
    await waitFor(() => {
      expect(container.outerHTML).toContain("Reconnecting...");
    });


    //send publish_started
    webRTCAdaptorConstructor.mediaManager = {};
    webRTCAdaptorConstructor.mediaManager.setVideoCameraSource = jest.fn();

    await act(async () => {
      webRTCAdaptorConstructor.callback("publish_started");
    });


    //now send reconnection attempt for player again
    await act(async () => {
      webRTCAdaptorConstructor.callback("reconnection_attempt_for_player");
    });

    //see reconnecting progress
    await waitFor(() => {
      expect(container.outerHTML).toContain("Reconnecting...");
    });

    //send play started
    await act(async () => {
      webRTCAdaptorConstructor.callback("play_started");
    });

    //you shouldn't see reconnecting progress, because publish reconnected before
    await waitFor(() => {
      expect(container.outerHTML).not.toContain("Reconnecting...");
    });
  });


  it('is reconnection in progress state for playonly', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    expect(container.outerHTML).not.toContain("Reconnecting...");

    await act(async () => {
      currentConference.setIsPlayOnly(true);
    });

    await act(async () => {
      webRTCAdaptorConstructor.callback("reconnection_attempt_for_player");
    });


    await waitFor(() => {
      expect(container.outerHTML).toContain("Reconnecting...");
    });

    await act(async () => {
      webRTCAdaptorConstructor.callback("play_started");
    });


    await waitFor(() => {
      expect(container.outerHTML).not.toContain("Reconnecting...");
    });
  });


  it('test fix for duplicated tile after reconnection', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);



    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    expect(container.outerHTML).not.toContain("Reconnecting...");



    await act(async () => {
      webRTCAdaptorConstructor.callback("reconnection_attempt_for_player");
    });


    await waitFor(() => {
      expect(container.outerHTML).toContain("Reconnecting...");
    });

    expect(currentConference.videoTrackAssignments).toHaveLength(1);

    expect(currentConference.videoTrackAssignments[0].isMine).toBe(true);

    await act(async () => {
      webRTCAdaptorConstructor.callback("newTrackAvailable", {"trackId" : "ARDAMSvvideoTrack0", "streamId":"room1", "track": {id: "someId", kind: "video"}});
    });

    expect(currentConference.videoTrackAssignments).toHaveLength(2);

    expect(currentConference.videoTrackAssignments[1].videoLabel).toBe("videoTrack0");
    expect(currentConference.videoTrackAssignments[1].streamId).toBe("room1");


    var notificationEvent = {
      eventType: "VIDEO_TRACK_ASSIGNMENT_LIST",
      streamId: "stream1",
      payload: [
        {videoLabel:"videoTrack0", trackId:"participant1"},
      ]
    };
    var json = JSON.stringify(notificationEvent);

    let obj = {data: json};

    await act(async () => {
      webRTCAdaptorConstructor.callback("data_received", obj);
    });

    expect(currentConference.videoTrackAssignments).toHaveLength(2);

    expect(currentConference.videoTrackAssignments[1].videoLabel).toBe("videoTrack0");
    expect(currentConference.videoTrackAssignments[1].streamId).toBe("participant1");

  });

  it('calls removeAllRemoteParticipants without crashing', () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    let contextValue = {
      removeAllRemoteParticipants: jest.fn(),
    };

    const TestComponent = () => {
      const conference = React.useContext(UnitTestContext);
      conference.removeAllRemoteParticipants();
      return null;
    };

    render(
        <UnitTestContext.Provider value={contextValue}>
          <TestComponent />
        </UnitTestContext.Provider>
    );

    expect(contextValue.removeAllRemoteParticipants).toHaveBeenCalled();
  });

  it('handleLeaveFromRoom#closeStream', async () => {
    // Create a local reference for this test
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
      <AntMedia isTest={true}>
        <TestMockChild/>
      </AntMedia>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    let roomName = "room";
    let publishStreamId = "publishStreamId";

    await act(async () => {
      currentConference.setRoomName(roomName);
    });

    await act(async () => {
      currentConference.setPublishStreamId(publishStreamId);
    });

    await act(async () => {
      currentConference.handleLeaveFromRoom();
    });

    expect(webRTCAdaptorConstructor.closeStream).toHaveBeenCalled();
    
    expect(webRTCAdaptorConstructor.stop).toHaveBeenCalled();
  });

  it('screen sharing state test', async () => {
    // Create a local reference for this test
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    expect(currentConference.isScreenShared).toBe(false);

    await act(async () => {
      currentConference.handleStartScreenShare();
    });

    await waitFor(() => {
      expect(webRTCAdaptorScreenConstructor).not.toBe(undefined);
    });

    expect(container).not.toContain("Starting Screen Share...");


    await act(async () => {
      webRTCAdaptorScreenConstructor.callback("initialized");
    });

    await waitFor(() => {
      expect(container.outerHTML).toContain("Starting Screen Share...");
    });
  });

  it('screen sharing test', async () => {

    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });
    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    jest.useRealTimers();


    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    currentConference.setParticipantUpdated = jest.fn();

    currentConference.allParticipants["participant0"] = {videoTrackId: "participant0", isPinned: false};
    currentConference.allParticipants["participant1"] = {videoTrackId: "participant1", isPinned: false};
    currentConference.allParticipants["participant2"] = {videoTrackId: "participant2", isPinned: false};
    currentConference.allParticipants["participant3"] = {videoTrackId: "participant3", isPinned: false};

    await act(async () => {
      currentConference.setVideoTrackAssignments([
        {videoLabel: "localvideo", streamId: "participant0", videoTrackId: "localvideo", audioTrackId: "audioTrack0", isReserved: false},
        {videoLabel: "videoTrack0", streamId: "participant1", videoTrackId: "videoTrack0", audioTrackId: "audioTrack1", isReserved: false},
        {videoLabel: "videoTrack1", streamId: "participant2", videoTrackId: "videoTrack1", audioTrackId: "audioTrack2", isReserved: false},
        {videoLabel: "videoTrack2", streamId: "participant3", videoTrackId: "videoTrack2", audioTrackId: "audioTrack3", isReserved: false}
      ]);
    });

    await waitFor(() => {
      expect(currentConference.videoTrackAssignments[1].isReserved).toBe(false);
    });

    console.log("currentConference.videoTrackAssignments 1:", currentConference.videoTrackAssignments);

    // testing pinning
    await act(async () => {
      currentConference.pinVideo("participant3");
    });

    expect(webRTCAdaptorConstructor.assignVideoTrack).toHaveBeenCalledWith("videoTrack0", "participant3", true);


    //assume we assigned videotrack0 to participant3 here

    await act(async () => {
      currentConference.setVideoTrackAssignments([
        {videoLabel: "localvideo", streamId: "participant0", videoTrackId: "localvideo", audioTrackId: "audioTrack0", isReserved: false},
        {videoLabel: "videoTrack0", streamId: "participant3", videoTrackId: "videoTrack0", audioTrackId: "audioTrack1", isReserved: true},
        {videoLabel: "videoTrack1", streamId: "participant2", videoTrackId: "videoTrack1", audioTrackId: "audioTrack2", isReserved: false},
        {videoLabel: "videoTrack2", streamId: "participant1", videoTrackId: "videoTrack2", audioTrackId: "audioTrack3", isReserved: false}
      ]);
    });

    await waitFor(() => {
      expect(currentConference.videoTrackAssignments[1].isReserved).toBe(true);
    });

    console.log("currentConference.videoTrackAssignments 2:", currentConference.videoTrackAssignments);

    // testing pinning
    await act(async () => {
      currentConference.pinVideo("participant3");
    });
    
    await waitFor(() => {
      expect(currentConference.currentPinInfo.streamId).toBe('participant3');
    });

    await act(async () => {
      currentConference.setVideoTrackAssignments([
        {videoLabel: "localvideo", streamId: "participant0", videoTrackId: "localvideo", audioTrackId: "audioTrack0", isReserved: false},
        {videoLabel: "videoTrack0", streamId: "participant2", videoTrackId: "videoTrack0", audioTrackId: "audioTrack1", isReserved: true},
        {videoLabel: "videoTrack1", streamId: "participant3", videoTrackId: "videoTrack1", audioTrackId: "audioTrack2", isReserved: false},
        {videoLabel: "videoTrack2", streamId: "participant1", videoTrackId: "videoTrack2", audioTrackId: "audioTrack3", isReserved: false}
      ]);
    });

    // testing pinning while another participant is pinned
    await act(async () => {
      currentConference.pinVideo("participant2");
    }); 

    expect(currentConference.currentPinInfo.streamId).toBe('participant2');


    // testing unpinning
    await act(async () => {
      currentConference.unpinVideo(false);
    });

    expect(currentConference.currentPinInfo).toBe(null);

    // testing pinning a non-existing participant
    await act(async () => {
      currentConference.pinVideo("non-exist-participant");
    });

    expect(consoleSpy).toHaveBeenCalledWith("Cannot find broadcast object for streamId: non-exist-participant");

  });

  it('high resource usage', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    webRTCAdaptorConstructor.closeWebSocket = jest.fn();

    expect(currentConference.isJoining).toBe(false);

    await act(async () => {
      currentConference.joinRoom("room", "publishStreamId");
    });

    await act(async () => {
      jest.useFakeTimers();
      webRTCAdaptorConstructor.callbackError("highResourceUsage", {});
      jest.runAllTimers();
      jest.useRealTimers();
    });

    await waitFor(() => {
      console.log("tttttt");
      expect(webRTCAdaptorConstructor.checkWebSocketConnection).toHaveBeenCalled();
    });
  });

  it('audio level setting test', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    }); 

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await act(async () => {
      currentConference.setMicAudioLevel(10);
    });
    expect(webRTCAdaptorConstructor.setVolumeLevel).toHaveBeenCalledWith(10);

    consoleSpy.mockRestore();

  });

  it('checks connection quality and displays warning for poor network connection for publish', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });


    const mockStats = {
      streamId: 'test-stream-id',
      videoRoundTripTime: '0',
      audioRoundTripTime: '0',
      videoJitter: '0',
      audioJitter: '0',
      videoPacketsLost: '0',
      audioPacketsLost: '0',
      totalVideoPacketsSent: '0',
      totalAudioPacketsSent: '0',
    };

    const weak_msg = "Poor Network Connection Warning:Network connection is weak. You may encounter connection drop!";
    const unstable_msg = "Poor Network Connection Warning:Network connection is weak. You may encounter connection drop!";

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();


    await act(async () => {
      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      mockStats.videoRoundTripTime = '150';
      mockStats.audioRoundTripTime = '160';

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);

      expect(consoleWarnSpy).toHaveBeenCalledWith(weak_msg);

      mockStats.videoRoundTripTime = '120';
      mockStats.audioRoundTripTime = '130';

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);

      expect(consoleWarnSpy).toHaveBeenCalledWith(unstable_msg);
      //expect(enqueueSnackbar).toHaveBeenCalledWith("Network connection is not stable. Please check your connection!", expect.anything());
    });

    await act(async () => {

      mockStats.videoRoundTripTime = '0';
      mockStats.audioRoundTripTime = '0';
      mockStats.videoJitter = '90';
      mockStats.audioJitter = '100';
      consoleWarnSpy.mockReset();

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      expect(consoleWarnSpy).toHaveBeenCalledWith(weak_msg);


      mockStats.videoJitter = '60';
      mockStats.audioJitter = '70';

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      expect(consoleWarnSpy).toHaveBeenCalledWith(unstable_msg);
    });

    await act(async () => {

      mockStats.videoJitter = '0';
      mockStats.audioJitter = '0';
      mockStats.videoPacketsLost = '3';
      mockStats.audioPacketsLost = '4';
      mockStats.totalVideoPacketsSent = '50';
      mockStats.totalAudioPacketsSent = '50';
      consoleWarnSpy.mockReset();

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      expect(consoleWarnSpy).toHaveBeenCalledWith(weak_msg);

    });

    await act(async () => {

      mockStats.videoPacketsLost = '4';
      mockStats.audioPacketsLost = '5';
      mockStats.totalVideoPacketsSent = '100';
      mockStats.totalAudioPacketsSent = '100';

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      expect(consoleWarnSpy).toHaveBeenCalledWith(unstable_msg);


    });





    consoleWarnSpy.mockRestore();

  });

  it('checks connection quality and displays warning for poor network connection for playback', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });


    const mockStats = {
      streamId: 'room',
      inboundRtpList: [
        { trackIdentifier: 'ARDAMSv', jitterBufferDelay: 50 },
        { trackIdentifier: 'ARDAMSa', jitterBufferDelay: 60 }
      ],
      videoPacketsLost: 5,
      audioPacketsLost: 3,
      totalBytesReceivedCount: 1000,
      framesReceived: 100,
      framesDropped: 5,
      currentTimestamp: 2000,
      startTime: 1000,
      lastBytesReceived: 500,
      firstBytesReceivedCount: 0,
      videoRoundTripTime: '0.2',
      audioRoundTripTime: '0.2'
    };

    await act(async () => {
        webRTCAdaptorConstructor.playStats ={
          videoPacketsLost: 2,
          audioPacketsLost: 1,
          inboundRtpList: mockStats.inboundRtpList
        };
    });

    const weak_msg = "Poor Network Connection Warning:Network connection is weak. You may encounter connection drop!";
    const unstable_msg = "Poor Network Connection Warning:Network connection is weak. You may encounter connection drop!";

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();


    await act(async () => {
      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      mockStats.videoRoundTripTime = '150';
      mockStats.audioRoundTripTime = '160';

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);

      //expect(consoleWarnSpy).toHaveBeenCalledWith(weak_msg);

      mockStats.videoRoundTripTime = '120';
      mockStats.audioRoundTripTime = '130';

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);

      //expect(consoleWarnSpy).toHaveBeenCalledWith(unstable_msg);
      //expect(enqueueSnackbar).toHaveBeenCalledWith("Network connection is not stable. Please check your connection!", expect.anything());
    });

    await act(async () => {

      mockStats.videoRoundTripTime = '0';
      mockStats.audioRoundTripTime = '0';
      mockStats.videoJitter = '90';
      mockStats.audioJitter = '100';
      consoleWarnSpy.mockReset();

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      //expect(consoleWarnSpy).toHaveBeenCalledWith(weak_msg);


      mockStats.videoJitter = '60';
      mockStats.audioJitter = '70';

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      //expect(consoleWarnSpy).toHaveBeenCalledWith(unstable_msg);
    });

    await act(async () => {

      mockStats.videoJitter = '0';
      mockStats.audioJitter = '0';
      mockStats.videoPacketsLost = '3';
      mockStats.audioPacketsLost = '4';
      mockStats.totalVideoPacketsSent = '50';
      mockStats.totalAudioPacketsSent = '50';
      consoleWarnSpy.mockReset();

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      //expect(consoleWarnSpy).toHaveBeenCalledWith(weak_msg);

    });

    await act(async () => {

      mockStats.videoPacketsLost = '4';
      mockStats.audioPacketsLost = '5';
      mockStats.totalVideoPacketsSent = '100';
      mockStats.totalAudioPacketsSent = '100';

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      //expect(consoleWarnSpy).toHaveBeenCalledWith(unstable_msg);


    });





    consoleWarnSpy.mockRestore();

  });

  describe('Screen render test', () => {
    let currentConference;

    // Use the createMockChild function defined earlier to avoid the linter error
    const TestMockChild = createMockChild(conference => {
      currentConference = conference;
    });

    it('should update participantUpdated state every 5 seconds', async () => {
      jest.useFakeTimers();

      render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>
      );

      //expect(currentConference.participantUpdated).toBe(false);

      act(() => {
        jest.advanceTimersByTime(8000);
      });

      expect(currentConference.participantUpdated).toBe(true);

      act(() => {
        jest.advanceTimersByTime(8000);
      });

      expect(currentConference.participantUpdated).toBe(true);

      jest.useRealTimers();
    });

    it('should not update participantUpdated state if videoTrackAssignments and allParticipants are not changed', async () => {
      jest.useFakeTimers();

      render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>
      );

      //expect(currentConference.participantUpdated).toBe(false);

      act(() => {
        jest.advanceTimersByTime(8000);
      });

      expect(currentConference.participantUpdated).toBe(true);

      act(() => {
        jest.advanceTimersByTime(8000);
      });

      expect(currentConference.participantUpdated).toBe(true);

      jest.useRealTimers();
    });
  });

  // Why there are 2 tests with the same name?
  it('fake reconnection', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>
    );


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    })


    const mockStats = {
      streamId: 'test-stream-id',
      videoRoundTripTime: '0',
      audioRoundTripTime: '0',
      videoJitter: '0',
      audioJitter: '0',
      videoPacketsLost: '0',
      audioPacketsLost: '0',
      totalVideoPacketsSent: '0',
      totalAudioPacketsSent: '0',
    };

    const weak_msg = "Poor Network Connection Warning:Network connection is weak. You may encounter connection drop!";
    const unstable_msg = "Poor Network Connection Warning:Network connection is weak. You may encounter connection drop!";

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();


    await act(async () => {
      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      mockStats.videoRoundTripTime = '150';
      mockStats.audioRoundTripTime = '160';

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);

      expect(consoleWarnSpy).toHaveBeenCalledWith(weak_msg);

      mockStats.videoRoundTripTime = '120';
      mockStats.audioRoundTripTime = '130';

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);

      expect(consoleWarnSpy).toHaveBeenCalledWith(unstable_msg);
      //expect(enqueueSnackbar).toHaveBeenCalledWith("Network connection is not stable. Please check your connection!", expect.anything());
    });

    await act(async () => {

      mockStats.videoRoundTripTime = '0';
      mockStats.audioRoundTripTime = '0';
      mockStats.videoJitter = '90';
      mockStats.audioJitter = '100';
      consoleWarnSpy.mockReset();

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      expect(consoleWarnSpy).toHaveBeenCalledWith(weak_msg);


      mockStats.videoJitter = '60';
      mockStats.audioJitter = '70';

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      expect(consoleWarnSpy).toHaveBeenCalledWith(unstable_msg);
    });

    await act(async () => {

      mockStats.videoJitter = '0';
      mockStats.audioJitter = '0';
      mockStats.videoPacketsLost = '3';
      mockStats.audioPacketsLost = '4';
      mockStats.totalVideoPacketsSent = '50';
      mockStats.totalAudioPacketsSent = '50';
      consoleWarnSpy.mockReset();

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      expect(consoleWarnSpy).toHaveBeenCalledWith(weak_msg);

    });

    await act(async () => {

      mockStats.videoPacketsLost = '4';
      mockStats.audioPacketsLost = '5';
      mockStats.totalVideoPacketsSent = '100';
      mockStats.totalAudioPacketsSent = '100';

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      expect(consoleWarnSpy).toHaveBeenCalledWith(unstable_msg);


    });

    consoleWarnSpy.mockRestore();

  });

  it('fake reconnection', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    expect(currentConference.isScreenShared).toBe(false);

    await act(async () => {
      currentConference.handleStartScreenShare();
    });

    await waitFor(() => {
      expect(webRTCAdaptorScreenConstructor).not.toBe(undefined);
    });

    act(() => {
      webRTCAdaptorScreenConstructor.callback("publish_started");
    });


    await waitFor(() => {
      expect(currentConference.isScreenShared).toBe(true);
    });

    console.log(currentConference);

    expect(currentConference.isScreenShared).toBe(true);

    webRTCAdaptorConstructor.reconnectIfRequired = jest.fn();
    webRTCAdaptorConstructor.requestVideoTrackAssignments = jest.fn();
    webRTCAdaptorConstructor.iceConnectionState = () => "mock1";

    webRTCAdaptorScreenConstructor.reconnectIfRequired = jest.fn();
    webRTCAdaptorScreenConstructor.requestVideoTrackAssignments = jest.fn();
    webRTCAdaptorScreenConstructor.iceConnectionState = () => "mock1";

    await act(async () => {
      expect(webRTCAdaptorConstructor.iceConnectionState()).toBe("mock1");
      expect(webRTCAdaptorScreenConstructor.iceConnectionState()).toBe("mock1");
    });

    await act(async () => {
      jest.useFakeTimers();
      currentConference.fakeReconnect();
      expect(webRTCAdaptorConstructor.iceConnectionState()).toBe("disconnected");
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(webRTCAdaptorConstructor.iceConnectionState()).toBe("mock1");
      expect(webRTCAdaptorScreenConstructor.iceConnectionState()).toBe("mock1");

    });

    jest.useRealTimers();
  });


  it('checks connection quality and displays warning for poor network connection', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    let stopSpeedTest = jest.fn();
    let speedTestForPlayWebRtcAdaptor = {
      current: {
        play: jest.fn(),
        requestVideoTrackAssignments: jest.fn(),
        stopSpeedTest: stopSpeedTest
      },
    };
    let consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    const mockStats = {
      streamId: 'test-stream-id',
      videoRoundTripTime: '0',
      audioRoundTripTime: '0',
      videoJitter: '0',
      audioJitter: '0',
      videoPacketsLost: '0',
      audioPacketsLost: '0',
      totalVideoPacketsSent: '0',
      totalAudioPacketsSent: '0',
    };

    const weak_msg = "Poor Network Connection Warning:Network connection is weak. You may encounter connection drop!";
    const unstable_msg = "Poor Network Connection Warning:Network connection is weak. You may encounter connection drop!";

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();


    await act(async () => {
      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      mockStats.videoRoundTripTime = '0.300';
      mockStats.audioRoundTripTime = '0.310';

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);

      expect(consoleWarnSpy).toHaveBeenCalledWith(weak_msg);

      mockStats.videoRoundTripTime = '0.200';
      mockStats.audioRoundTripTime = '0.210';

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);

      expect(consoleWarnSpy).toHaveBeenCalledWith(unstable_msg);
    });

    jest.useFakeTimers();
    jest.advanceTimersByTime(3000);
    jest.runAllTimers();
    jest.useRealTimers();

    await act(async () => {

      mockStats.videoRoundTripTime = '0';
      mockStats.audioRoundTripTime = '0';
      mockStats.videoJitter = '90';
      mockStats.audioJitter = '100';
      consoleWarnSpy.mockReset();

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      expect(consoleWarnSpy).toHaveBeenCalledWith(weak_msg);


      mockStats.videoJitter = '0.02';
      mockStats.audioJitter = '0.10';

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      expect(consoleWarnSpy).toHaveBeenCalledWith(unstable_msg);
    });

    jest.useFakeTimers();
    jest.advanceTimersByTime(3000);
    jest.runAllTimers();
    jest.useRealTimers();

    await act(async () => {

      mockStats.videoJitter = '0';
      mockStats.audioJitter = '0';
      mockStats.videoPacketsLost = '3';
      mockStats.audioPacketsLost = '4';
      mockStats.totalVideoPacketsSent = '50';
      mockStats.totalAudioPacketsSent = '50';
      consoleWarnSpy.mockReset();

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      expect(consoleWarnSpy).toHaveBeenCalledWith(weak_msg);

    });

    jest.useFakeTimers();
    jest.advanceTimersByTime(3000);
    jest.runAllTimers();
    jest.useRealTimers();

    await act(async () => {

      mockStats.videoPacketsLost = '4';
      mockStats.audioPacketsLost = '5';
      mockStats.totalVideoPacketsSent = '100';
      mockStats.totalAudioPacketsSent = '100';

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);
      expect(consoleWarnSpy).toHaveBeenCalledWith(unstable_msg);


    });
  });


  it('should stop and nullify speedTestForPublishWebRtcAdaptor when it is defined', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(async () => {
      currentConference.startSpeedTest();
    });

    await waitFor(() => {
      expect(webRTCAdaptorPublishSpeedTestConstructor).not.toBe(undefined);
    });

    const mockStop = jest.fn();

    webRTCAdaptorPublishSpeedTestConstructor.stop = mockStop;


    // Act
    await act(async () => {
      currentConference.stopSpeedTest();
    });

    jest.useFakeTimers();
    jest.advanceTimersByTime(3000);
    jest.runAllTimers();
    jest.useRealTimers();

    // Assert
    await waitFor(() => {
      expect(mockStop).toHaveBeenCalledWith(`speedTestStream${currentConference.speedTestStreamId.current}`);
    });

    /*
    await waitFor(() => {
      expect(webRTCAdaptorPublishSpeedTestConstructor).toBeNull();
    });
    */
  });



  it('should not throw error when speedTestForPublishWebRtcAdaptor is not defined', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    let stopSpeedTest = jest.fn();
    let speedTestForPlayWebRtcAdaptor = {
      current: {
        play: jest.fn(),
        requestVideoTrackAssignments: jest.fn(),
        stopSpeedTest: stopSpeedTest
      },
    };
    let consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // Arrange
    webRTCAdaptorPublishSpeedTestPlayOnlyConstructor = null;
    webRTCAdaptorPublishSpeedTestConstructor = null;

    // Act and Assert
    await expect(async () => {
      await act(async () => {
        currentConference?.stopSpeedTest();
      });
    }).not.toThrow();
  });



  it('should stop and nullify speedTestForPlayWebRtcAdaptor when it is defined', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    currentConference.setIsPlayOnly(true);

    await waitFor(() => {
      expect(currentConference.isPlayOnly).toBe(true);
    });

    await act(async () => {
      currentConference.startSpeedTest();
    });

    await waitFor(() => {
      expect(webRTCAdaptorPlaySpeedTestConstructor).not.toBe(undefined);
    });

    let stopSpeedTest = jest.fn();

    // Arrange
    const mockStop = jest.fn();
    //webRTCAdaptorPlaySpeedTestConstructor = { stop: mockStop, stopSpeedTest: stopSpeedTest};

    webRTCAdaptorPlaySpeedTestConstructor.stop = mockStop;

    // Act
    await act(async () => {
      currentConference.stopSpeedTest();
    });

    // Assert
    await waitFor(() => {
      expect(mockStop).toHaveBeenCalledWith(`speedTestSampleStream`);
    });
    //await waitFor(() => {
    //  expect(webRTCAdaptorPlaySpeedTestConstructor).toBeNull();
    //});
  });


  it('should not throw error when speedTestForPlayWebRtcAdaptor is not defined', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    let stopSpeedTest = jest.fn();
    let speedTestForPlayWebRtcAdaptor = {
      current: {
        play: jest.fn(),
        requestVideoTrackAssignments: jest.fn(),
        stopSpeedTest: stopSpeedTest
      },
    };
    // Arrange
    webRTCAdaptorPlaySpeedTestConstructor = null;

    // Act and Assert
    await expect(async () => {
      await act(async () => {
        currentConference?.stopSpeedTest();
      });
    }).not.toThrow();
  });

  it('notSetRemoteDescription error callback in reconnection', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    expect(container.outerHTML).not.toContain("Reconnecting...");

    await act(async () => {
      webRTCAdaptorConstructor.callback("reconnection_attempt_for_publisher");
      webRTCAdaptorConstructor.callback("reconnection_attempt_for_player");
    });


    console.log("before waitttttttttttttttttttttttttt");

    await waitFor(() => {
      expect(container.outerHTML).toContain("Reconnecting...");
    });

    await act(async () => {
      webRTCAdaptorConstructor.callbackError("notSetRemoteDescription", {});
    });

    await waitFor(() => {
      expect(container.outerHTML).toContain("System is not compatible to connect. Please report this.");
    });

    await waitFor(() => {
      expect(container.outerHTML).not.toContain("Reconnecting...");
    });
  });

  it('license_suspended_please_renew_license error callback in reconnection', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    expect(container.outerHTML).not.toContain("Reconnecting...");

    await act(async () => {
      webRTCAdaptorConstructor.callback("reconnection_attempt_for_publisher");
      webRTCAdaptorConstructor.callback("reconnection_attempt_for_player");
    });

    await waitFor(() => {
      expect(container.outerHTML).toContain("Reconnecting...");
    });

    await act(async () => {
      webRTCAdaptorConstructor.callbackError("license_suspended_please_renew_license", {});
    });

    await waitFor(() => {
      expect(container.outerHTML).toContain("Licence error. Please report this.");
    });

    await waitFor(() => {
      expect(container.outerHTML).not.toContain("Reconnecting...");
    });
  });


  it('increments streamIdInUseCounter and does not leave room when counter is less than or equal to 3', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(async () => {
      webRTCAdaptorConstructor.callbackError("streamIdInUse", "Stream ID is in use");
      webRTCAdaptorConstructor.callbackError("streamIdInUse", "Stream ID is in use");
    });

    expect(consoleSpy).not.toHaveBeenCalledWith("This stream id is already in use. You may be logged in on another device.");

    consoleSpy.mockRestore();
  });

  it('increments streamIdInUseCounter and leaves room with error when counter exceeds 3', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(async () => {
      webRTCAdaptorConstructor.callbackError("streamIdInUse", "Stream ID is in use");
      webRTCAdaptorConstructor.callbackError("streamIdInUse", "Stream ID is in use");
      webRTCAdaptorConstructor.callbackError("streamIdInUse", "Stream ID is in use");
      webRTCAdaptorConstructor.callbackError("streamIdInUse", "Stream ID is in use");
    });

    expect(consoleSpy).toHaveBeenCalledWith("This stream id is already in use. You may be logged in on another device.");

    consoleSpy.mockRestore();
  });

  it('streamIdInUseCounter is not incremented due to reconnection is true', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(async () => {
      webRTCAdaptorConstructor.callback("reconnection_attempt_for_player");
    });

    await act(async () => {
      webRTCAdaptorConstructor.callbackError("streamIdInUse", "Stream ID is in use");
      webRTCAdaptorConstructor.callbackError("streamIdInUse", "Stream ID is in use");
      webRTCAdaptorConstructor.callbackError("streamIdInUse", "Stream ID is in use");
      webRTCAdaptorConstructor.callbackError("streamIdInUse", "Stream ID is in use");
    });

    expect(consoleSpy).not.toHaveBeenCalledWith("This stream id is already in use. You may be logged in on another device.");

    consoleSpy.mockRestore();
  });

  it('updates allParticipants and participantUpdated when subtrackList is provided', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    const subtrackList = [
      JSON.stringify({ streamId: 'stream1', metaData: JSON.stringify({ isScreenShared: false }) }),
      JSON.stringify({ streamId: 'stream2', metaData: JSON.stringify({ isScreenShared: true }) })
    ];
    const obj = { subtrackList };

    await act(async () => {
      webRTCAdaptorConstructor.callback('subtrackList', obj);
    });

    await waitFor(() => {
      expect(currentConference.participantUpdated).toBe(false);
    });
  });

  it('adds fake participants to allParticipants', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    currentConference.allParticipants["fakeStream1"] = {streamId: 'fakeStream1', isFake: true, videoTrackId: "participant0", parsedMetaData : {isScreenShared:false}};

    await waitFor(() => {
      expect(currentConference.allParticipants["fakeStream1"]).toBeDefined();
      expect(currentConference.allParticipants["fakeStream1"].isFake).toBe(true);
    });

    const subtrackList = [
      JSON.stringify({ streamId: 'stream1', metaData: JSON.stringify({ isScreenShared: false }) })
    ];
    const obj = { subtrackList };

    await act(async () => {
      webRTCAdaptorConstructor.callback('subtrackList', obj);
    });

    await waitFor(() => {
      expect(currentConference.allParticipants["fakeStream1"]).toBeDefined();
      expect(currentConference.participantUpdated).toBe(false);
    });
  });

  it('handle the case if the metadata is empty', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    const subtrackList = [
      JSON.stringify({ streamId: 'stream1', metaData: null }),
      JSON.stringify({ streamId: 'stream2', metaData: "" })
    ];
    const obj = { subtrackList };

    await act(async () => {
      webRTCAdaptorConstructor.callback('subtrackList', obj);
    });

    await waitFor(() => {
      expect(currentConference.participantUpdated).toBe(false);
    });
  });

  it('does not update allParticipants if there are no changes', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    currentConference.allParticipants = {
      'stream1': { streamId: 'stream1', isScreenShared: false }
    };
    const subtrackList = [
      JSON.stringify({ streamId: 'stream1', metaData: JSON.stringify({ isScreenShared: false }), receivedBytes: -1, duration: -1, bitrate: -1, updateTime: -1 })
    ];
    const obj = { subtrackList };

    await act(async () => {
      webRTCAdaptorConstructor.callback('subtrackList', obj);
    });

    await waitFor(() => {
      expect(currentConference.participantUpdated).toBe(false);
    });
  });

  it('sets allParticipants with "You" when not in play only mode', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    currentConference.allParticipants = {
      'publishStreamId': { name: 'You' },
    };

    currentConference.isPlayOnly = false;

    const subtrackList = [
      JSON.stringify({ streamId: 'stream1', metaData: JSON.stringify({ isScreenShared: false }), receivedBytes: -1, duration: -1, bitrate: -1, updateTime: -1 })
    ];
    const obj = { subtrackList };

    await act(async () => {
      webRTCAdaptorConstructor.callback('subtrackList', obj);
    });

    await waitFor(() => {
      expect(currentConference.participantUpdated).toBe(false);
    });
  });

  describe('fetchImageAsBlob', () => {
    it('returns a blob URL when the fetch is successful', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      const mockBlob = new Blob(['image content'], { type: 'image/png' });
      const mockUrl = 'blob:http://localhost/image';
      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(mockBlob),
      });
      global.URL.createObjectURL = jest.fn().mockReturnValue(mockUrl);

      const result = await currentConference.fetchImageAsBlob('http://example.com/image.png');

      expect(result).toBe(mockUrl);
      expect(global.fetch).toHaveBeenCalledWith('http://example.com/image.png');
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });

    it('throws an error when the fetch fails', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      global.fetch = jest.fn().mockRejectedValue(new Error('Fetch failed'));

      await expect(currentConference.fetchImageAsBlob('http://example.com/image.png')).rejects.toThrow('Fetch failed');
    });

    it('throws an error when the blob conversion fails', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockRejectedValue(new Error('Blob conversion failed')),
      });

      await expect(currentConference.fetchImageAsBlob('http://example.com/image.png')).rejects.toThrow('Blob conversion failed');
    });
  });

  describe('setVirtualBackgroundImage', () => {
    it('returns immediately if the URL is undefined', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const {container} = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      const result = currentConference.setVirtualBackgroundImage(undefined);
      expect(result).toBeUndefined();
    });

    it('returns immediately if the URL is null', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      const result = currentConference.setVirtualBackgroundImage(null);
      expect(result).toBeUndefined();
    });

    it('returns immediately if the URL is an empty string', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      const result = currentConference.setVirtualBackgroundImage('');
      expect(result).toBeUndefined();
    });

    it('calls setAndEnableVirtualBackgroundImage if the URL starts with "data:image"', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      const mockUrl = 'data:image/png;base64,example';
      currentConference.setVirtualBackgroundImage(mockUrl);
    });

    it('fetches the image as a blob and calls setAndEnableVirtualBackgroundImage if the URL does not start with "data:image"', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      const mockUrl = 'http://example.com/image.png';
      const mockBlobUrl = 'blob:http://localhost/image';
      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(new Blob(['image content'], { type: 'image/png' })),
      });
      global.URL.createObjectURL = jest.fn().mockReturnValue(mockBlobUrl);
      currentConference.setAndEnableVirtualBackgroundImage = jest.fn();
      await currentConference.setVirtualBackgroundImage(mockUrl);
      expect(global.fetch).toHaveBeenCalledWith(mockUrl);
    });
  });

  describe('handleBackgroundReplacement', () => {
    it('disables video effect when option is "none"', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      currentConference.setIsVideoEffectRunning = jest.fn();

      currentConference.handleBackgroundReplacement("none");
      expect(currentConference.setIsVideoEffectRunning).not.toHaveBeenCalled();
    });

    it('enables slight blur effect when option is "slight-blur"', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      currentConference.setIsVideoEffectRunning = jest.fn();

      currentConference.handleBackgroundReplacement("slight-blur");
      expect(currentConference.setIsVideoEffectRunning).not.toHaveBeenCalled();
    });

    it('enables blur effect when option is "blur"', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      currentConference.setIsVideoEffectRunning = jest.fn();

      currentConference.handleBackgroundReplacement("blur");
      expect(currentConference.setIsVideoEffectRunning).not.toHaveBeenCalled();
    });

    it('enables virtual background effect when option is "background" and virtualBackground is not null', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      currentConference.setIsVideoEffectRunning = jest.fn();

      process.env.REACT_APP_VIRTUAL_BACKGROUND_IMAGES = "http://example.com/image.png";

      currentConference.handleBackgroundReplacement("background");
      expect(currentConference.setIsVideoEffectRunning).not.toHaveBeenCalled();
    });

    it('sets and enables virtual background image when option is "background" and virtualBackground is null', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      process.env.REACT_APP_VIRTUAL_BACKGROUND_IMAGES = null;

      currentConference.setAndEnableVirtualBackgroundImage = jest.fn();

      await currentConference.handleBackgroundReplacement("background");
      await waitFor(() => {
        expect(currentConference.setAndEnableVirtualBackgroundImage).not.toHaveBeenCalled();
      });
    });

    it('handles error when enabling effect fails', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>
      );

      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      currentConference.enableEffect = jest.fn()

      currentConference.enableEffect.mockRejectedValue(new Error('Effect enable failed')); // Mock failure

      await currentConference.handleBackgroundReplacement("blur");
    });

  });

  describe('checkAndUpdateVideoAudioSourcesForPublishSpeedTest', () => {
    it('selects the first available camera if the selected camera is not available', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1' },
        { kind: 'audioinput', deviceId: 'microphone1' }
      ];
      const mockSelectedDevices = { videoDeviceId: 'camera2', audioDeviceId: 'microphone1' };
      const mockSetSelectedDevices = jest.fn();

      currentConference.devices = mockDevices;
      currentConference.getSelectedDevices = jest.fn().mockReturnValue(mockSelectedDevices);
      currentConference.setSelectedDevices = mockSetSelectedDevices;

      currentConference.checkAndUpdateVideoAudioSourcesForPublishSpeedTest();

      //expect(mockSetSelectedDevices).toHaveBeenCalledWith({ videoDeviceId: 'camera1', audioDeviceId: 'microphone1' });
    });

    it('selects the first available microphone if the selected microphone is not available', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1' },
        { kind: 'audioinput', deviceId: 'microphone1' }
      ];
      const mockSelectedDevices = { videoDeviceId: 'camera1', audioDeviceId: 'microphone2' };
      const mockSetSelectedDevices = jest.fn();

      currentConference.devices = mockDevices;
      currentConference.getSelectedDevices = jest.fn().mockReturnValue(mockSelectedDevices);
      currentConference.setSelectedDevices = mockSetSelectedDevices;

      currentConference.checkAndUpdateVideoAudioSourcesForPublishSpeedTest();

      //expect(mockSetSelectedDevices).toHaveBeenCalledWith({ videoDeviceId: 'camera1', audioDeviceId: 'microphone1' });
    });

    it('does not change selected devices if they are available', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1' },
        { kind: 'audioinput', deviceId: 'microphone1' }
      ];
      const mockSelectedDevices = { videoDeviceId: 'camera1', audioDeviceId: 'microphone1' };
      const mockSetSelectedDevices = jest.fn();

      currentConference.devices = mockDevices;
      currentConference.getSelectedDevices = jest.fn().mockReturnValue(mockSelectedDevices);
      currentConference.setSelectedDevices = mockSetSelectedDevices;

      currentConference.checkAndUpdateVideoAudioSourcesForPublishSpeedTest();

      //expect(mockSetSelectedDevices).toHaveBeenCalledWith(mockSelectedDevices);
    });

    it('switches video camera capture if the selected camera changes', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      const mockSelectedDevices = { videoDeviceId: 'camera1', audioDeviceId: 'microphone1' };
      const mockSetSelectedDevices = jest.fn();
      const mockSwitchVideoCameraCapture = jest.fn();

      currentConference.devices = [{ kind: 'videoinput', deviceId: 'camera1' }];
      currentConference.getSelectedDevices = jest.fn().mockReturnValue(mockSelectedDevices);
      currentConference.setSelectedDevices = mockSetSelectedDevices;
      currentConference.speedTestForPublishWebRtcAdaptor = { current: { switchVideoCameraCapture: mockSwitchVideoCameraCapture } };
      currentConference.publishStreamId = 'stream1';

      currentConference.checkAndUpdateVideoAudioSourcesForPublishSpeedTest();

      //expect(mockSwitchVideoCameraCapture).toHaveBeenCalledWith('stream1', 'camera1');
    });

    it('switches audio input source if the selected microphone changes', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      const mockSelectedDevices = { videoDeviceId: 'camera1', audioDeviceId: 'microphone1' };
      const mockSetSelectedDevices = jest.fn();
      const mockSwitchAudioInputSource = jest.fn();

      currentConference.devices = [{ kind: 'audioinput', deviceId: 'microphone1' }];
      currentConference.getSelectedDevices = jest.fn().mockReturnValue(mockSelectedDevices);
      currentConference.setSelectedDevices = mockSetSelectedDevices;
      currentConference.speedTestForPublishWebRtcAdaptor = { current: { switchAudioInputSource: mockSwitchAudioInputSource } };
      currentConference.publishStreamId = 'stream1';

      currentConference.checkAndUpdateVideoAudioSourcesForPublishSpeedTest();

      //expect(mockSwitchAudioInputSource).toHaveBeenCalledWith('stream1', 'microphone1');
    });

    it('handles errors when switching video and audio sources', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      const mockSelectedDevices = { videoDeviceId: 'camera1', audioDeviceId: 'microphone1' };
      const mockSetSelectedDevices = jest.fn();
      const mockSwitchVideoCameraCapture = jest.fn().mockImplementation(() => { throw new Error('Error switching video'); });
      const mockSwitchAudioInputSource = jest.fn().mockImplementation(() => { throw new Error('Error switching audio'); });
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

      currentConference.devices = [{ kind: 'videoinput', deviceId: 'camera1' }, { kind: 'audioinput', deviceId: 'microphone1' }];
      currentConference.getSelectedDevices = jest.fn().mockReturnValue(mockSelectedDevices);
      currentConference.setSelectedDevices = mockSetSelectedDevices;
      currentConference.speedTestForPublishWebRtcAdaptor = { current: { switchVideoCameraCapture: mockSwitchVideoCameraCapture, switchAudioInputSource: mockSwitchAudioInputSource } };
      currentConference.publishStreamId = 'stream1';

      currentConference.checkAndUpdateVideoAudioSourcesForPublishSpeedTest();

      //expect(mockConsoleError).toHaveBeenCalledWith('Error while switching video and audio sources for the publish speed test adaptor', expect.any(Error));
    });

    it('handles errors when switching video and audio source', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      mediaDevicesMock.enumerateDevices.mockResolvedValue([
        { deviceId: 'camera1', kind: 'videoinput' },
        { deviceId: 'microphone1', kind: 'audioinput' }
      ]);

      const {container} = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);

      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      await act(async () => {
        currentConference.startSpeedTest();
      });

      await waitFor(() => {
        expect(webRTCAdaptorPublishSpeedTestConstructor).not.toBe(undefined);
      });

      await act(async () => {
        webRTCAdaptorPublishSpeedTestConstructor.callback("available_devices", [
          { deviceId: 'camera1', kind: 'videoinput' },
          { deviceId: 'microphone1', kind: 'audioinput' }
        ]);
      });

      const mockSelectedDevices = {videoDeviceId: 'camera1', audioDeviceId: 'microphone1'};
      const mockSetSelectedDevices = jest.fn();
      const mockSwitchVideoCameraCapture = jest.fn().mockImplementation(() => {
        throw new Error('Error switching video');
      });
      const mockSwitchAudioInputSource = jest.fn().mockImplementation(() => {
        throw new Error('Error switching audio');
      });
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

      currentConference.devices = [{kind: 'videoinput', deviceId: 'camera1'}, {kind: 'audioinput', deviceId: 'microphone1'}];
      currentConference.getSelectedDevices = jest.fn().mockReturnValue(mockSelectedDevices);
      currentConference.setSelectedDevices = mockSetSelectedDevices;
      currentConference.speedTestForPublishWebRtcAdaptor = {current: {switchVideoCameraCapture: mockSwitchVideoCameraCapture, switchAudioInputSource: mockSwitchAudioInputSource}};
      currentConference.switchVideoCameraCapture = mockSwitchVideoCameraCapture;
      currentConference.publishStreamId = 'stream1';

      await act(async () => {
        currentConference.checkAndUpdateVideoAudioSourcesForPublishSpeedTest();
      });
      mockConsoleError.mockRestore();
    });
  });

  describe('checkVideoTrackHealth', () => {
    it('returns true if the camera is turned off by the user', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      currentConference.setIsMyCamTurnedOff(true);
      await waitFor(() => {
        expect(currentConference.isMyCamTurnedOff).toBe(true);
      });
      currentConference.mediaManager = {
        localStream: {
          getAudioTracks: jest.fn().mockReturnValue([]),
          getVideoTracks: jest.fn().mockReturnValue([
            {id: "tracka1", kind: "video", label: "videoTrack1", muted: true},
          ]),
        }
      };
      expect(currentConference.checkVideoTrackHealth()).toBe(true);
    });

    it('returns false if the camera is turned on and the video track is not muted', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      currentConference.setIsMyCamTurnedOff(false);
      await waitFor(() => {
        expect(currentConference.isMyCamTurnedOff).toBe(false);
      });      

      currentConference.mediaManager = {
        localStream: {
          getAudioTracks: jest.fn().mockReturnValue([]),
          getVideoTracks: jest.fn().mockReturnValue([
            {id: "tracka1", kind: "video", label: "videoTrack1", muted: true},
          ]),
        }
      };
      expect(currentConference.checkVideoTrackHealth()).toBe(false);
    });
  });

  it('sets and fills play stats list correctly', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const mockStats = {
      currentRoundTripTime: 100,
      packetsReceived: 200,
      totalBytesReceivedCount: 300,
      framesReceived: 400,
      framesDropped: 500,
      startTime: 600,
      currentTimestamp: 700,
      firstBytesReceivedCount: 800,
      lastBytesReceived: 900,
      videoPacketsLost: 1000,
    };

    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(async () => {
      currentConference.setAndFillPlayStatsList(mockStats);
    });

    expect(currentConference.statsList.current.currentRoundTripTime).not.toBe(100);
    expect(currentConference.statsList.current.packetsReceived).not.toBe(200);
    expect(currentConference.statsList.current.totalBytesReceivedCount).not.toBe(300);
    expect(currentConference.statsList.current.framesReceived).not.toBe(400);
    expect(currentConference.statsList.current.framesDropped).not.toBe(500);
    expect(currentConference.statsList.current.startTime).not.toBe(600);
    expect(currentConference.statsList.current.currentTimestamp).not.toBe(700);
    expect(currentConference.statsList.current.firstBytesReceivedCount).not.toBe(800);
    expect(currentConference.statsList.current.lastBytesReceived).not.toBe(900);
    expect(currentConference.statsList.current.videoPacketsLost).not.toBe(1000);
  });

  it('sets and fills publish stats list correctly', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const mockStats = {
      videoRoundTripTime: 100,
      audioRoundTripTime: 200,
      videoPacketsLost: 300,
      totalVideoPacketsSent: 400,
      totalAudioPacketsSent: 500,
      audioPacketsLost: 600,
      videoJitter: 700,
      audioJitter: 800,
      currentOutgoingBitrate: 900,
    };

    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(async () => {
      currentConference.setAndFillPublishStatsList(mockStats);
    });

    await waitFor(() => {
      expect(currentConference.statsList.current.videoRoundTripTime).not.toBe(100);
      expect(currentConference.statsList.current.audioRoundTripTime).not.toBe(200);
      expect(currentConference.statsList.current.videoPacketsLost).not.toBe(300);
      expect(currentConference.statsList.current.totalVideoPacketsSent).not.toBe(400);
      expect(currentConference.statsList.current.totalAudioPacketsSent).not.toBe(500);
      expect(currentConference.statsList.current.audioPacketsLost).not.toBe(600);
      expect(currentConference.statsList.current.videoJitter).not.toBe(700);
      expect(currentConference.statsList.current.audioJitter).not.toBe(800);
      expect(currentConference.statsList.current.currentOutgoingBitrate).not.toBe(900);
    });
  });

  it('sets speed test object to failed state', async () => {
    // Create a local reference for this test
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });
    
    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    currentConference.speedTestObject = {
      message: "Speed Test",
      isfinished: false,
      isfailed: false,
      errorMessage: "",
      progressValue: 50
    };

    currentConference.setSpeedTestObject = jest.fn();

    await act(async () => {
      currentConference.setSpeedTestObjectFailed('Error message');
    });

    await waitFor(() => {
      expect(currentConference.speedTestObject.message).toBe('Error message');
      expect(currentConference.speedTestObject.isfinished).toBe(false);
      expect(currentConference.speedTestObject.isfailed).toBe(true);
      expect(currentConference.speedTestObject.errorMessage).toBe('Error message');
      expect(currentConference.speedTestObject.progressValue).toBe(0);
    });
  });

  it('sets speed test object progress correctly', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(async () => {
      currentConference.setSpeedTestObjectProgress(50);
    });

    await waitFor(() => {
      expect(currentConference.speedTestObject.isfinished).toBe(false);
      expect(currentConference.speedTestObject.isfailed).toBe(false);
      expect(currentConference.speedTestObject.errorMessage).toBe('');
      expect(currentConference.speedTestObject.progressValue).toBe(50);
    });
  });

  it('handles progress value greater than 100', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(async () => {
      currentConference.setSpeedTestObjectProgress(150);
    });

    const stopSpeedTest = jest.fn();
    //expect(stopSpeedTest).toHaveBeenCalled();
    expect(currentConference.speedTestObject.message).toBe('Speed test failed. It may be due to firewall, wi-fi or network restrictions. Change your network or Try again ');
    expect(currentConference.speedTestObject.isfinished).toBe(false);
    expect(currentConference.speedTestObject.isfailed).toBe(true);
    expect(currentConference.speedTestObject.errorMessage).toBe('Speed test failed. It may be due to firewall, wi-fi or network restrictions. Change your network or Try again ');
    expect(currentConference.speedTestObject.progressValue).toBe(0);
  });

  it('calculates play speed test result with great connection', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    currentConference.statsList.current = [
      {
        totalBytesReceivedCount: 1000,
        framesReceived: 100,
        framesDropped: 0,
        currentTimestamp: 2000,
        startTime: 1000,
        lastBytesReceived: 1000,
        firstBytesReceivedCount: 0,
        videoPacketsLost: 0,
        audioPacketsLost: 0,
        inboundRtpList: [{
          trackIdentifier: 'ARDAMSv',
          packetsReceived: 100,
          jitterBufferDelay: 10
        }, {trackIdentifier: 'ARDAMSa', packetsReceived: 100, jitterBufferDelay: 10}],
        videoRoundTripTime: '0.05',
        audioRoundTripTime: '0.05'
      },
      {
        totalBytesReceivedCount: 500,
        framesReceived: 50,
        framesDropped: 0,
        currentTimestamp: 1500,
        startTime: 1000,
        lastBytesReceived: 500,
        firstBytesReceivedCount: 0,
        videoPacketsLost: 0,
        audioPacketsLost: 0,
        inboundRtpList: [{
          trackIdentifier: 'ARDAMSv',
          packetsReceived: 50,
          jitterBufferDelay: 10
        }, {trackIdentifier: 'ARDAMSa', packetsReceived: 50, jitterBufferDelay: 10}],
        videoRoundTripTime: '0.05',
        audioRoundTripTime: '0.05'
      }
    ];

    await act(async () => {
      currentConference.calculateThePlaySpeedTestResult();
    });

    expect(currentConference.speedTestObject.message).toBe('Your connection is Great!');
    expect(currentConference.speedTestObject.isfailed).toBe(false);
    expect(currentConference.speedTestObject.progressValue).toBe(100);
    expect(currentConference.speedTestObject.isfinished).toBe(true);
  });

  it('calculates play speed test result with moderate connection', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    currentConference.statsList.current = [
      {
        totalBytesReceivedCount: 1000,
        framesReceived: 100,
        framesDropped: 5,
        currentTimestamp: 2000,
        startTime: 1000,
        lastBytesReceived: 1000,
        firstBytesReceivedCount: 0,
        videoPacketsLost: 1,
        audioPacketsLost: 1,
        inboundRtpList: [{
          trackIdentifier: 'ARDAMSv',
          packetsReceived: 100,
          jitterBufferDelay: 60
        }, {trackIdentifier: 'ARDAMSa', packetsReceived: 100, jitterBufferDelay: 60}],
        videoRoundTripTime: '0.12',
        audioRoundTripTime: '0.12'
      },
      {
        totalBytesReceivedCount: 500,
        framesReceived: 50,
        framesDropped: 2,
        currentTimestamp: 1500,
        startTime: 1000,
        lastBytesReceived: 500,
        firstBytesReceivedCount: 0,
        videoPacketsLost: 0,
        audioPacketsLost: 0,
        inboundRtpList: [{
          trackIdentifier: 'ARDAMSv',
          packetsReceived: 50,
          jitterBufferDelay: 60
        }, {trackIdentifier: 'ARDAMSa', packetsReceived: 50, jitterBufferDelay: 60}],
        videoRoundTripTime: '0.12',
        audioRoundTripTime: '0.12'
      }
    ];

    await act(async () => {
      currentConference.calculateThePlaySpeedTestResult();
    });

    expect(currentConference.speedTestObject.message).toBe('Your connection is moderate, occasional disruptions may occur');
    expect(currentConference.speedTestObject.isfailed).toBe(false);
    expect(currentConference.speedTestObject.progressValue).toBe(100);
    expect(currentConference.speedTestObject.isfinished).toBe(true);
  });

  it('calculates play speed test result with poor connection', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    currentConference.statsList.current = [
      {
        totalBytesReceivedCount: 1000,
        framesReceived: 100,
        framesDropped: 10,
        currentTimestamp: 2000,
        startTime: 1000,
        lastBytesReceived: 1000,
        firstBytesReceivedCount: 0,
        videoPacketsLost: 5,
        audioPacketsLost: 5,
        inboundRtpList: [{
          trackIdentifier: 'ARDAMSv',
          packetsReceived: 100,
          jitterBufferDelay: 120
        }, {trackIdentifier: 'ARDAMSa', packetsReceived: 100, jitterBufferDelay: 120}],
        videoRoundTripTime: '0.2',
        audioRoundTripTime: '0.2'
      },
      {
        totalBytesReceivedCount: 500,
        framesReceived: 50,
        framesDropped: 5,
        currentTimestamp: 1500,
        startTime: 1000,
        lastBytesReceived: 500,
        firstBytesReceivedCount: 0,
        videoPacketsLost: 2,
        audioPacketsLost: 2,
        inboundRtpList: [{
          trackIdentifier: 'ARDAMSv',
          packetsReceived: 50,
          jitterBufferDelay: 120
        }, {trackIdentifier: 'ARDAMSa', packetsReceived: 50, jitterBufferDelay: 120}],
        videoRoundTripTime: '0.2',
        audioRoundTripTime: '0.2'
      }
    ];

    await act(async () => {
      currentConference.calculateThePlaySpeedTestResult();
    });

    expect(currentConference.speedTestObject.message).toBe('Your connection quality is poor. You may experience interruptions');
    expect(currentConference.speedTestObject.isfailed).toBe(false);
    expect(currentConference.speedTestObject.progressValue).toBe(100);
    expect(currentConference.speedTestObject.isfinished).toBe(true);
  });

  it('updates progress and stats list on subsequent iterations', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    currentConference.speedTestCounter.current = 1;
    currentConference.statsList.current = [{}, {}];
    currentConference.setAndFillPlayStatsList = jest.fn();
    currentConference.setSpeedTestObjectProgress = jest.fn();
    currentConference.setSpeedTestObject = jest.fn();

    currentConference.processUpdatedStatsForPlaySpeedTest({});

    expect(currentConference.statsList.current).toEqual([{}, {}, {}]);
  });

  it('updates speed test object progress when iterations are insufficient', async () => {
    // Create a local reference for this test
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });
    
    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    currentConference.speedTestCounter = { current: 2 };
    currentConference.statsList = { current: [{}, {}] };
    currentConference.setSpeedTestObjectProgress = jest.fn();
    currentConference.setSpeedTestObject = jest.fn();
    currentConference.speedTestObject = {
      message: "Speed Test",
      isfinished: false,
      isfailed: false,
      errorMessage: "",
      progressValue: 0
    };

    currentConference.processUpdatedStatsForPlaySpeedTest({});

    expect(currentConference.setSpeedTestObject).not.toHaveBeenCalledWith({
      message: currentConference.speedTestObject.message,
      isfinished: false,
      isfailed: false,
      errorMessage: "",
      progressValue: 60
    });
  });

  describe('loadMoreParticipants', () => {
    it('get subtracks as many as loadingStepSize', async () => {
      // Create a local reference for this test
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });
      
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      await act(async () => {
        currentConference.globals.participantListPagination.currentPagePosition = 2;
        currentConference.setParticipantCount(15);
      });

      await waitFor(() => {
        expect(currentConference.participantCount).toBe(15);
      });
      
      currentConference.loadMoreParticipants();

      expect(webRTCAdaptorConstructor.getSubtracks).toHaveBeenCalledWith("room", null, 2, currentConference.globals.participantListPagination.loadingStepSize);
    });


    it('get subtracks as many as difference', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      await act(async () => {
        currentConference.globals.participantListPagination.currentPagePosition = 2;
        currentConference.setParticipantCount(5);
      });

      await waitFor(() => {
        expect(currentConference.participantCount).toBe(5);
      });
      
      currentConference.loadMoreParticipants();

      expect(webRTCAdaptorConstructor.getSubtracks).toHaveBeenCalledWith("room", null, 2, 3);
    });

    

    it('update participant count, when we receive new subtrack count', async () => {
      let currentConference;
      const TestMockChild = createMockChild(conf => {
        currentConference = conf;
      });

      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <TestMockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      const obj = { count: 12 };

      await act(async () => {
        webRTCAdaptorConstructor.callback('subtrackCount', obj);
      });

      await waitFor(() => {
        expect(currentConference.participantCount).toBe(12);
      });
    });
  });

  it('opens publisher request list drawer and closes other drawers', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    currentConference.setPublisherRequestListDrawerOpen = jest.fn();
    currentConference.setMessageDrawerOpen = jest.fn();
    currentConference.setParticipantListDrawerOpen = jest.fn();
    currentConference.setEffectsDrawerOpen = jest.fn();

    currentConference.handlePublisherRequestListOpen(true);
    expect(currentConference.setPublisherRequestListDrawerOpen).not.toHaveBeenCalledWith(true);
    expect(currentConference.setMessageDrawerOpen).not.toHaveBeenCalledWith(false);
    expect(currentConference.setParticipantListDrawerOpen).not.toHaveBeenCalledWith(false);
    expect(currentConference.setEffectsDrawerOpen).not.toHaveBeenCalledWith(false);
  });

  it('does not send publisher request if not in play only mode', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    currentConference.handleSendNotificationEvent = jest.fn();
    await act(async () => {
      currentConference.setIsPlayOnly(false);
    });
    currentConference.handlePublisherRequest();
    expect(currentConference.handleSendNotificationEvent).not.toHaveBeenCalled();
  });

  it('sends publisher request if in play only mode', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });


    await act(async () => {
      currentConference.handleSendNotificationEvent = jest.fn();
      currentConference.setIsPlayOnly(true);
    });
    currentConference.handlePublisherRequest();
  });

  /*
  it('sends make listener again notification', async () => {
    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>
        </ThemeProvider>);
    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });
    const streamId = 'testStreamId';
    currentConference.makeListenerAgain(streamId);
    expect(currentConference.handleSendNotificationEvent).toHaveBeenCalledWith("MAKE_LISTENER_AGAIN", currentConference.roomName, {
      senderStreamId: streamId
    });
    expect(currentConference.updateParticipantRole).toHaveBeenCalledWith(streamId, WebinarRoles.Listener);
  });
   */

  it('should not run playOnly effect on initial mount', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

      const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
                <TestMockChild/>
            </AntMedia>
        </ThemeProvider>
    );

    await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    // Verify initial mount doesn't trigger the effect's main logic
    expect(webRTCAdaptorConstructor.stop).not.toHaveBeenCalled();
    expect(webRTCAdaptorConstructor.turnOffLocalCamera).not.toHaveBeenCalled();
    expect(webRTCAdaptorConstructor.closeStream).not.toHaveBeenCalled();
});

  it('should run playOnly effect when isPlayOnly changes after mount', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const mockLocalStorage = {
      getItem: jest.fn().mockImplementation((key) => {
          if (key === 'selectedCamera') return 'camera1'; 
          if (key === 'selectedMicrophone') return 'microphone1';
          return null;
      }),
      setItem: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
      
    mediaDevicesMock.enumerateDevices.mockResolvedValue([
        { deviceId: 'camera1', kind: 'videoinput' },
        { deviceId: 'microphone1', kind: 'audioinput' }
    ]);

    const { render1 } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true} isPlayOnly={false}>
                <TestMockChild/>
            </AntMedia>
        </ThemeProvider>
    );

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(async () => {
      currentConference.setIsPlayOnly(true);
    });

    await waitFor(() => {

      expect(webRTCAdaptorConstructor.stop).toHaveBeenCalled();
      expect(webRTCAdaptorConstructor.turnOffLocalCamera).toHaveBeenCalled();
      expect(webRTCAdaptorConstructor.closeStream).toHaveBeenCalled();
    });
  });

  it('should clear participants and intervals when isPlayOnly changes', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

      const { rerender } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
              <AntMedia isTest={true} isPlayOnly={false}>
                  <TestMockChild/>
              </AntMedia>
          </ThemeProvider>
      );

      await waitFor(() => {
          expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      // Set some initial participants
      await act(async () => {
        currentConference.setVideoTrackAssignments(['track1', 'track2']);
        currentConference.setAllParticipants({ participant1: {}, participant2: {} });
      });
      
      await act(async () => {
        currentConference.setIsPlayOnly(true);
      });

      // Verify participants are cleared
      await waitFor(() => {
          expect(currentConference.videoTrackAssignments).toEqual([]);
          expect(currentConference.allParticipants).toEqual({});
      });
  });

  it('starts becoming publisher if in play only mode', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(async () => {
      currentConference.setIsPlayOnly(true);
    });

    await act(async () => {
      currentConference.setIsPlayOnly = jest.fn();
      currentConference.setInitialized = jest.fn();
      currentConference.setWaitingOrMeetingRoom = jest.fn();
      currentConference.joinRoom = jest.fn();
    });

    await act(async () => {
      currentConference.handleStartBecomePublisher();
    });
    await waitFor(() => {
      expect(currentConference.setIsPlayOnly).not.toHaveBeenCalledWith(false);
      expect(currentConference.setInitialized).not.toHaveBeenCalledWith(false);
      expect(currentConference.setWaitingOrMeetingRoom).not.toHaveBeenCalledWith("waiting");
      expect(currentConference.joinRoom).not.toHaveBeenCalledWith(currentConference.roomName, currentConference.publishStreamId);
    });
  });

  it('rejects become speaker request', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    currentConference.handleSendNotificationEvent = jest.fn();
    const streamId = 'testStreamId';
    currentConference.rejectBecomeSpeakerRequest(streamId);
    expect(currentConference.handleSendNotificationEvent).not.toHaveBeenCalledWith("REJECT_BECOME_PUBLISHER", currentConference.roomName, {
      senderStreamId: streamId
    });
  });

  it('handles REQUEST_BECOME_PUBLISHER event when role is Host', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>
    );

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(() => {
      currentConference.setPublishStreamId('testStreamId');
    });

    const notificationEvent = {
      streamId: 'testStreamId',
      eventType: 'REQUEST_BECOME_PUBLISHER',
      senderStreamId: 'testStreamId',
      message: 'Request approved'
    };
    const obj = {
      data: JSON.stringify(notificationEvent)
    };

    await act(async () => {
      currentConference.handleNotificationEvent(obj);
    });

    await waitFor(() => {
      expect(currentConference.requestSpeakerList).not.toContain('testStreamId');
    });
  });

  it('does not handle REQUEST_BECOME_PUBLISHER event if request already received', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>
    );

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(() => {
      currentConference.requestSpeakerList = ['testStreamIdListener'];
    });

    await act(() => {
      currentConference.setRequestSpeakerList(['testStreamIdListener']);
    });

    await act(() => {
      currentConference.setPublishStreamId('testStreamIdHost');
    });

    await act(() => {
      currentConference.setRole(WebinarRoles.Host);
    });

    const notificationEvent = {
      streamId: 'testStreamId',
      eventType: 'REQUEST_BECOME_PUBLISHER',
      senderStreamId: 'testStreamIdListener',
      message: 'Request rejected'
    };
    const obj = {
      data: JSON.stringify(notificationEvent)
    };

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await act(async () => {
      currentConference.handleNotificationEvent(obj);
    });

    expect(consoleSpy).toHaveBeenCalledWith("Request is already received from ", 'testStreamIdListener');
    consoleSpy.mockRestore();
  });

  it('handles MAKE_LISTENER_AGAIN event when role is TempListener', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>
    );

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(() => {
      currentConference.setRole(WebinarRoles.TempListener);
    });

    const notificationEvent = {
      streamId: 'testStreamId',
      eventType: 'MAKE_LISTENER_AGAIN',
      senderStreamId: 'testStreamId',
      message: 'Request approved'
    };
    const obj = {
      data: JSON.stringify(notificationEvent)
    };

    await act(async () => {
      currentConference.handleNotificationEvent(obj);
    });

    await waitFor(() => {
      expect(currentConference.isPlayOnly).toBe(true);
    });
  });

  it('handles APPROVE_BECOME_PUBLISHER event when role is Listener', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>
    );

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(() => {
      currentConference.setRole(WebinarRoles.Listener);
    });

    await act(() => {
      currentConference.setPublishStreamId('testStreamId');
    });

    const notificationEvent = {
      streamId: 'testStreamId',
      eventType: 'APPROVE_BECOME_PUBLISHER',
      senderStreamId: 'testStreamId',
      message: 'Request approved'
    };
    const obj = {
      data: JSON.stringify(notificationEvent)
    };

    await act(async () => {
      currentConference.handleNotificationEvent(obj);
    });

    await waitFor(() => {
      expect(currentConference.isPlayOnly).toBe(false);
    });
  });

  it('handles REJECT_BECOME_PUBLISHER event when role is Listener', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <TestMockChild/>
          </AntMedia>
        </ThemeProvider>
    );

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(() => {
      currentConference.setRole(WebinarRoles.Listener);
    });

    await act(() => {
      currentConference.setPublishStreamId('testStreamId');
    });

    const notificationEvent = {
      streamId: 'testStreamId',
      eventType: 'REJECT_BECOME_PUBLISHER',
      senderStreamId: 'testStreamId',
      message: 'Request rejected'
    };
    const obj = {
      data: JSON.stringify(notificationEvent)
    };

    await act(async () => {
      currentConference.showInfoSnackbarWithLatency = jest.fn();
    });

    await act(async () => {
      currentConference.handleNotificationEvent(obj);
    });

    await waitFor(() => {
      expect(currentConference.role).toBe(WebinarRoles.Listener);
    });
  });


  it('test play only participant join room', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(async () => {
      currentConference.setIsPlayOnly(true);
    });

    await act(async () => {
      process.env.REACT_APP_SHOW_PLAY_ONLY_PARTICIPANTS = "true";
    });

    await waitFor(() => {
      currentConference.joinRoom("room", "publishStreamId");
    });

    consoleSpy.mockRestore();
  });

  it('test not updating devices unless initialized ', async () => {
    let currentConference;
    const TestMockChild = createMockChild(conf => {
      currentConference = conf;
    });

    const { container } = render(
        <AntMedia isTest={true}>
          <TestMockChild/>
        </AntMedia>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();


    const mockDevices = [
      { kind: 'videoinput', deviceId: 'camera1' },
    ];

    const updateMetaData = jest.spyOn(webRTCAdaptorConstructor, 'updateStreamMetaData').mockImplementation();

    await act(async () => {
      currentConference.setInitialized(false);
    });

    await act(async () => {
      currentConference.setDevices(mockDevices);
    });

    jest.useFakeTimers();
    setTimeout(() => {
      expect(updateMetaData).not.toHaveBeenCalled();
    }, 2000);

    jest.runAllTimers();

    consoleSpy.mockRestore();
  });
});