// src/Button.test.js
import React from 'react';
import { render, act, waitFor, screen } from '@testing-library/react';
import AntMedia from 'pages/AntMedia';
import { useWebSocket } from 'Components/WebSocketProvider';
import { useSnackbar} from "notistack-v2-maintained";
import { ConferenceContext } from "pages/AntMedia";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";
import theme from "styles/theme";
import { times } from 'lodash';
import { useParams } from 'react-router-dom';
import {VideoEffect} from "@antmedia/webrtc_adaptor";

var webRTCAdaptorConstructor, webRTCAdaptorScreenConstructor, webRTCAdaptorPublishSpeedTestPlayOnlyConstructor, webRTCAdaptorPublishSpeedTestConstructor, webRTCAdaptorPlaySpeedTestConstructor;
var currentConference;
var websocketURL = "ws://localhost:5080/Conference/websocket";

jest.mock('Components/WebSocketProvider', () => ({
  ...jest.requireActual('Components/WebSocketProvider'),
  useWebSocket: jest.fn(),
}));

jest.mock('notistack-v2-maintained', () => ({
  ...jest.requireActual('notistack-v2-maintained'),
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



jest.mock('@antmedia/webrtc_adaptor', () => ({
  ...jest.requireActual('@antmedia/webrtc_adaptor'),
  WebRTCAdaptor: jest.fn().mockImplementation((params) => {
    console.log(params);
    var mockAdaptor = {
      init : jest.fn(),
      publish : jest.fn().mockImplementation(() => console.log('publishhhhhh')),
      play : jest.fn(),
      unpublish : jest.fn(),
      leaveRoom : jest.fn(),
      startPublishing : jest.fn(),
      stopPublishing : jest.fn(),
      startPlaying : jest.fn(),
      stopPlaying : jest.fn(),
      getLocalStream : jest.fn(),
      applyConstraints : jest.fn(),
      sendData : jest.fn().mockImplementation((publishStreamId, data) => console.log('send data called with ')),
      setMaxVideoTrackCount : jest.fn(),
      enableStats : jest.fn(),
      getBroadcastObject : jest.fn(),
      checkWebSocketConnection : jest.fn(),
      stop : jest.fn(),
      turnOffLocalCamera : jest.fn(),
      muteLocalMic: jest.fn(),
      switchVideoCameraCapture: jest.fn(),
      switchAudioInputSource: jest.fn(),
      displayMessage: jest.fn(),
      setMicrophoneButtonDisabled: jest.fn(),
      setCameraButtonDisabled: jest.fn(),
      setSelectedDevices: jest.fn(),
      checkAndTurnOffLocalCamera: jest.fn(),
      devices: [],
      updateStreamMetaData: jest.fn(),
      assignVideoTrack: jest.fn(),
      setParticipantUpdated: jest.fn(),
      getSubtracks: jest.fn(),
      createSpeedTestForPublishWebRtcAdaptorPlayOnly: jest.fn(),
      createSpeedTestForPublishWebRtcAdaptor: jest.fn(),
      createSpeedTestForPlayWebRtcAdaptor: jest.fn(),
      requestVideoTrackAssignments: jest.fn(),
      stopSpeedTest: jest.fn().mockImplementation(() => console.log('stopSpeedTest')),
      closeStream: jest.fn(),
      closeWebSocket: jest.fn(),
      playStats: {},
      enableEffect: jest.fn(),
      setSelectedVideoEffect: jest.fn(),
      setBlurEffectRange: jest.fn(),
      getSubtrackCount: jest.fn(),
      setVolumeLevel: jest.fn(),
    }

    for (var key in params) {
      if (typeof params[key] === 'function') {
        mockAdaptor[key] = params[key];
      }
    }

    if (params.purposeForTest === "main-adaptor") {
      webRTCAdaptorConstructor = mockAdaptor;
    }
    else if(params.purposeForTest === "screen-share") {
      webRTCAdaptorScreenConstructor = mockAdaptor;
    }
    else if (params.purposeForTest === "publish-speed-test-play-only") {
      webRTCAdaptorPublishSpeedTestPlayOnlyConstructor = mockAdaptor;
    }
    else if (params.purposeForTest === "publish-speed-test") {
      webRTCAdaptorPublishSpeedTestConstructor = mockAdaptor;
    }
    else if (params.purposeForTest === "play-speed-test") {
      webRTCAdaptorPlaySpeedTestConstructor = mockAdaptor;
    }
    return mockAdaptor;
  }),
}));

jest.mock('Components/Cards/VideoCard', () => ({ value }) => <div data-testid="mocked-video-card">{value}</div>);
jest.mock('Components/EffectsDrawer', () => ({ value }) => <div data-testid="mocked-effect-drawer">{value}</div>);


const MockChild = () => {
  const conference = React.useContext(ConferenceContext);
  currentConference = conference;

  //console.log(conference);

  return (
      <div> My Mock </div>
  );
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

global.navigator.mediaDevices = mediaDevicesMock; // here

describe('AntMedia Component', () => {

  beforeEach(() => {
    console.log("---------------------------");
    console.log(`Starting test: ${expect.getState().currentTestName}`);
    // Reset the mock implementation before each test
    jest.clearAllMocks();

    useWebSocket.mockImplementation(() => ({
      return: {
        sendMessage: jest.fn(),
        latestMessage: null,
        isWebSocketConnected: true,
      }
    }));

    useSnackbar.mockImplementation(() => ({
      enqueueSnackbar: enqueueSnackbar,
      closeSnackbar: jest.fn(),
    }));
  });

  afterEach(() => {
    webRTCAdaptorConstructor = undefined;
    webRTCAdaptorScreenConstructor = undefined;
    currentConference = undefined;
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
    const { container } = render(
        <AntMedia isTest={true}>
          <MockChild/>
        </AntMedia>);
    //console.log(container);

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

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const { container } = render(
        <AntMedia isTest={true}>
          <MockChild/>
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

  it('handle video track assignment remove mechanism', async () => {
    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    var obj = {};
    let broadcastObject = {streamId: "p1", name: "test1", metaData: JSON.stringify({isScreenShared: true})};
    let broadcastObjectMessage = JSON.stringify(broadcastObject);

    obj.broadcast = broadcastObjectMessage;
    obj.streamId = "p1";

    await act(async () => {
      webRTCAdaptorConstructor.callback("broadcastObject", obj);
    });

    await act(async () => {
      currentConference.setVideoTrackAssignments([
        {videoLabel:"videoTrack0", trackId:"tracka0"},
        {videoLabel:"videoTrack1", trackId:"tracka1"},
        {videoLabel:"videoTrack2", trackId:"tracka2"}]);
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

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await act(async () => {
      webRTCAdaptorConstructor.callback("data_received", obj);
    });

    expect(consoleSpy).toHaveBeenCalledWith("---> Removed video track assignment: videoTrack0");
    expect(currentConference.videoTrackAssignments["stream0"]).toBe(undefined);

    consoleSpy.mockRestore();

  });

  it('handle sharing on', async () => {
    const { container } = render(
        <AntMedia isTest={true}>
          <MockChild/>
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
    const { container } = render(
        <AntMedia isTest={true}>
          <MockChild/>
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
    const { container } = render(
        <AntMedia isTest={true}>
          <MockChild/>
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
    const { container } = render(
        <AntMedia isTest={true}>
          <MockChild/>
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
    const { container } = render(
        <AntMedia isTest={true}>
          <MockChild/>
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

    expect(currentConference.globals.desiredTileCount == 5);

    await act(async () => {
      currentConference.updateMaxVideoTrackCount(7);
    });

    expect(currentConference.globals.maxVideoTrackCount === 7);

    consoleSpy.mockRestore();

  });

  it('start with camera and microphone', async () => {
    mediaDevicesMock.enumerateDevices.mockResolvedValue([
      { deviceId: '1', kind: 'videoinput' },
      { deviceId: '1', kind: 'audioinput' },
    ]);

    const { container } = render(
        <AntMedia isTest={true}>
          <MockChild/>
        </AntMedia>);

    expect(currentConference.cameraButtonDisabled === false);
    expect(currentConference.microphoneButtonDisabled === false);

  });

  it('start with one microphone and without any camera', async () => {
    mediaDevicesMock.enumerateDevices.mockResolvedValue([
      { deviceId: '1', kind: 'audioinput' },
    ]);

    const { container } = render(
        <AntMedia isTest={true}>
          <MockChild/>
        </AntMedia>);

    expect(currentConference.cameraButtonDisabled === true);
    expect(currentConference.microphoneButtonDisabled === false);

  });

  it('start with one camera and without any microphone', async () => {
    mediaDevicesMock.enumerateDevices.mockResolvedValue([
      { deviceId: '1', kind: 'videoinput' },
    ]);

    const { container } = render(
        <AntMedia isTest={true}>
          <MockChild/>
        </AntMedia>);

    expect(currentConference.cameraButtonDisabled === false);
    expect(currentConference.microphoneButtonDisabled === true);

  });

  it('start without camera nor microphone', async () => {
    mediaDevicesMock.enumerateDevices.mockResolvedValue([
    ]);

    const { container } = render(
        <AntMedia isTest={true}>
          <MockChild/>
        </AntMedia>);

    expect(currentConference.cameraButtonDisabled === true);
    expect(currentConference.microphoneButtonDisabled === true);

  });

  it('should enable camera and microphone buttons if selected devices are available', async () => {

    const { container } = render(
        <AntMedia isTest={true}>
          <MockChild/>
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

    const { container } = render(
        <AntMedia isTest={true}>
          <MockChild/>
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
    const { container } = render(
        <AntMedia isTest={true}>
          <MockChild/>
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
    mediaDevicesMock.enumerateDevices.mockResolvedValue([
      { deviceId: 'camera2', kind: 'videoinput' },
    ]);

    const { container } = render(
        <AntMedia isTest={true}>
          <MockChild/>
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
    mediaDevicesMock.enumerateDevices.mockResolvedValue([
      { deviceId: 'mic2', kind: 'audioinput' },
    ]);

    const { container } = render(
        <AntMedia isTest={true}>
          <MockChild/>
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
    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    let contextValue = {
      removeAllRemoteParticipants: jest.fn(),
    };

    const TestComponent = () => {
      const conference = React.useContext(ConferenceContext);
      conference.removeAllRemoteParticipants();
      return null;
    };

    render(
        <ConferenceContext.Provider value={contextValue}>
          <TestComponent />
        </ConferenceContext.Provider>
    );

    expect(contextValue.removeAllRemoteParticipants).toHaveBeenCalled();
  });

  it('handleLeaveFromRoom#closeStream', async () => { 
    const { container } = render(
      <AntMedia isTest={true}>
        <MockChild/>
      </AntMedia>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    await act(async () => {
      currentConference.handleLeaveFromRoom();
    });

    expect(webRTCAdaptorConstructor.stop).toHaveBeenCalled();
    expect(webRTCAdaptorConstructor.closeStream).toHaveBeenCalled();

  });

  it('screen sharing state test', async () => {
    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    currentConference.setParticipantUpdated = jest.fn();

    currentConference.allParticipants["participant0"] = {videoTrackId: "participant0", isPinned: false};
    currentConference.allParticipants["participant1"] = {videoTrackId: "participant1", isPinned: false};
    currentConference.allParticipants["participant2"] = {videoTrackId: "participant2", isPinned: false};
    currentConference.allParticipants["participant3"] = {videoTrackId: "participant3", isPinned: false};

    await act(async () => {
      currentConference.setVideoTrackAssignments([
        {videoLabel: "participant0", streamId: "participant0", videoTrackId: "participant0", audioTrackId: "participant0", isReserved: false},
        {videoLabel: "participant1", streamId: "participant1", videoTrackId: "participant1", audioTrackId: "participant1", isReserved: false},
        {videoLabel: "participant2", streamId: "participant2", videoTrackId: "participant2", audioTrackId: "participant2", isReserved: false},
        {videoLabel: "participant3", streamId: "participant3", videoTrackId: "participant3", audioTrackId: "participant3", isReserved: false}
      ]);
    });

    // testing pinning
    await act(async () => {
      currentConference.pinVideo("participant3");
    });

    await waitFor(() => {
      expect(currentConference.allParticipants['participant3'].isPinned).toBe(true);
      expect(currentConference.allParticipants['participant2'].isPinned).toBe(false);
    });

    // testing pinning while another participant is pinned
    await act(async () => {
      currentConference.pinVideo("participant2");
    });

    expect(currentConference.allParticipants['participant3'].isPinned).toBe(false);
    expect(currentConference.allParticipants['participant2'].isPinned).toBe(true);

    // testing unpinning
    await act(async () => {
      currentConference.pinVideo("participant2");
    });

    expect(currentConference.allParticipants['participant2'].isPinned).toBe(false);

    // testing pinning a non-existing participant
    await act(async () => {
      currentConference.pinVideo("non-exist-participant");
    });

    expect(consoleSpy).toHaveBeenCalledWith("Cannot find broadcast object for streamId: non-exist-participant");

  });

  it('high resource usage', async () => {
    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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

    const MockChild = () => {
      const conference = React.useContext(ConferenceContext);
      currentConference = conference;
      return <div>Mock Child</div>;
    };

    it('should update participantUpdated state every 5 seconds', async () => {
      jest.useFakeTimers();

      render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
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
              <MockChild/>
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

  it('fake reconnection', async () => {

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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

    const { container } = render(
        <AntMedia isTest={true}>
          <MockChild/>
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
      expect(webRTCAdaptorScreenConstructor.iceConnectionState()).toBe("disconnected");
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(webRTCAdaptorConstructor.iceConnectionState()).toBe("mock1");
      expect(webRTCAdaptorScreenConstructor.iceConnectionState()).toBe("mock1");

    });

    jest.useRealTimers();
  });


  it('checks connection quality and displays warning for poor network connection', async () => {

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
            <MockChild/>
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
      mockStats.videoRoundTripTime = '0.150';
      mockStats.audioRoundTripTime = '0.160';

      webRTCAdaptorConstructor.callback("updated_stats", mockStats);

      expect(consoleWarnSpy).toHaveBeenCalledWith(weak_msg);

      mockStats.videoRoundTripTime = '0.120';
      mockStats.audioRoundTripTime = '0.130';

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

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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

  it('returns broadcastObject with isPinned set to true when existing broadcast object is pinned', async () => {
    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    const streamId = 'stream1';
    const broadcastObject = {isPinned: false};
    currentConference.allParticipants[streamId] = {isPinned: true};

    const result = currentConference.checkAndSetIsPinned(streamId, broadcastObject);

    expect(result.isPinned).toBe(true);
  });

  it('returns broadcastObject with isPinned set to false when existing broadcast object is not pinned', async () => {
    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    const streamId = 'stream2';
    const broadcastObject = {isPinned: true};
    currentConference.allParticipants[streamId] = {isPinned: false};

    const result = currentConference.checkAndSetIsPinned(streamId, broadcastObject);

    expect(result.isPinned).toBe(false);
  });

  it('returns broadcastObject unchanged when existing broadcast object is null', async () => {
    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    const streamId = 'stream3';
    const broadcastObject = {isPinned: true};
    currentConference.allParticipants[streamId] = null;

    const result = currentConference.checkAndSetIsPinned(streamId, broadcastObject);

    expect(result.isPinned).toBe(true);
  });

  it('returns broadcastObject unchanged when existing broadcast object is undefined', async () => {
    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    const streamId = 'stream4';
    const broadcastObject = {isPinned: false};
    currentConference.allParticipants[streamId] = undefined;

    const result = currentConference.checkAndSetIsPinned(streamId, broadcastObject);

    expect(result.isPinned).toBe(false);
  });

  it('increments streamIdInUseCounter and does not leave room when counter is less than or equal to 3', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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

  it('updates allParticipants and participantUpdated when subtrackList is provided', async () => {
    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>
        </ThemeProvider>);


    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    currentConference.allParticipants["fakeStream1"] = {streamId: 'fakeStream1', isFake: true, videoTrackId: "participant0", isPinned: false};

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
    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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

    await waitFor(() => {
        expect(currentConference.allParticipants["stream1"]).toBeDefined();
        expect(currentConference.allParticipants["stream2"]).toBeDefined();
    });
  });

  it('does not update allParticipants if there are no changes', async () => {
    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
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
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      global.fetch = jest.fn().mockRejectedValue(new Error('Fetch failed'));

      await expect(currentConference.fetchImageAsBlob('http://example.com/image.png')).rejects.toThrow('Fetch failed');
    });

    it('throws an error when the blob conversion fails', async () => {
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
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
      const {container} = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      const result = currentConference.setVirtualBackgroundImage(undefined);
      expect(result).toBeUndefined();
    });

    it('returns immediately if the URL is null', async () => {
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      const result = currentConference.setVirtualBackgroundImage(null);
      expect(result).toBeUndefined();
    });

    it('returns immediately if the URL is an empty string', async () => {
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      const result = currentConference.setVirtualBackgroundImage('');
      expect(result).toBeUndefined();
    });

    it('calls setAndEnableVirtualBackgroundImage if the URL starts with "data:image"', async () => {
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      const mockUrl = 'data:image/png;base64,example';
      currentConference.setVirtualBackgroundImage(mockUrl);
    });

    it('fetches the image as a blob and calls setAndEnableVirtualBackgroundImage if the URL does not start with "data:image"', async () => {
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
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
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
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
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
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
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
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
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
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
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
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
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild />
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
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
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
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
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
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
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
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
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
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
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
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
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

    it('handles errors when switching video and audio sources', async () => {
      mediaDevicesMock.enumerateDevices.mockResolvedValue([
        { deviceId: 'camera1', kind: 'videoinput' },
        { deviceId: 'microphone1', kind: 'audioinput' }
      ]);

      const {container} = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
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

  it('sets and fills play stats list correctly', async () => {
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
            <MockChild/>
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
            <MockChild/>
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
    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

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
    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
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
    const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>
        </ThemeProvider>);

    await waitFor(() => {
      expect(webRTCAdaptorConstructor).not.toBe(undefined);
    });

    currentConference.speedTestCounter.current = 2;
    currentConference.statsList.current = [{}, {}];
    currentConference.setSpeedTestObjectProgress = jest.fn();
    currentConference.setSpeedTestObject = jest.fn();

    currentConference.processUpdatedStatsForPlaySpeedTest({});

    expect(currentConference.setSpeedTestObject).not.toHaveBeenCalledWith({
      message: currentConference.speedTestObject.message,
      isfinished: false,
      isfailed: false,
      errorMessage: "",
      progressValue: 60
    });
  });

  describe('updateAllParticipantsPagination', () => {
    it('sets currentPage to 1 if currentPage is less than or equal to 0', async () => {
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      currentConference.updateAllParticipantsPagination(0);
      expect(currentConference.globals.participantListPagination.currentPage).toBe(1);
    });

    it('calculates totalPage correctly', async () => {
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      await act(async () => {
        currentConference.setParticipantCount(25);
      });
      currentConference.globals.participantListPagination.pageSize = 10;
      currentConference.updateAllParticipantsPagination(1);
      expect(currentConference.globals.participantListPagination.totalPage).toBe(3);
    });

    it('sets currentPage to totalPage if currentPage is greater than totalPage', async () => {
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      await act(async () => {
        currentConference.setParticipantCount(25);
      });
      await waitFor(() => {
        expect(currentConference.participantCount).toBe(25);
      });
      currentConference.globals.participantListPagination.pageSize = 10;
      currentConference.updateAllParticipantsPagination(5);
      expect(currentConference.globals.participantListPagination.currentPage).toBe(3);
    });

    it('calculates startIndex and endIndex correctly', async () => {
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      await act(async () => {
        currentConference.setParticipantCount(25);
      });
      await waitFor(() => {
        expect(currentConference.participantCount).toBe(25);
      });
      currentConference.globals.participantListPagination.pageSize = 10;
      currentConference.updateAllParticipantsPagination(2);
    });

    it('calls getSubtracks with correct parameters', async () => {
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
            </AntMedia>
          </ThemeProvider>);


      await waitFor(() => {
        expect(webRTCAdaptorConstructor).not.toBe(undefined);
      });

      const mockGetSubtracks = jest.fn();
      currentConference.getSubtracks = mockGetSubtracks;

      currentConference.roomName = 'testRoom';
      await act(async () => {
        currentConference.setParticipantCount(25);
      });
      await waitFor(() => {
        expect(currentConference.participantCount).toBe(25);
      });
      currentConference.globals.participantListPagination.pageSize = 10;
      currentConference.updateAllParticipantsPagination(2);
    });

    it('update participant count, when we receive new subtrack count', async () => {
      const { container } = render(
          <ThemeProvider theme={theme(ThemeList.Green)}>
            <AntMedia isTest={true}>
              <MockChild/>
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

});