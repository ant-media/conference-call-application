// src/Button.test.js
import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import AntMedia from 'pages/AntMedia';
import { useWebSocket } from 'Components/WebSocketProvider';
import { useSnackbar} from "notistack";
import { ConferenceContext } from "pages/AntMedia";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";
import theme from "styles/theme";


var webRTCAdaptorConstructor, webRTCAdaptorScreenConstructor, webRTCAdaptorPublishSpeedTestPlayOnlyConstructor, webRTCAdaptorPublishSpeedTestConstructor, webRTCAdaptorPlaySpeedTestConstructor;
var currentConference;
var websocketURL = "ws://localhost:5080/Conference/websocket";

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
      createSpeedTestForPublishWebRtcAdaptorPlayOnly: jest.fn(),
      createSpeedTestForPublishWebRtcAdaptor: jest.fn(),
      createSpeedTestForPlayWebRtcAdaptor: jest.fn(),
      requestVideoTrackAssignments: jest.fn(),
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

      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      await act(async () => {
        webRTCAdaptorConstructor.callback("data_received", obj);
      });

      var event = {"eventType": "PIN_USER", "streamId": "p1"};
      expect(consoleSpy).toHaveBeenCalledWith("send notification event", event);


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

      await act(async () => {
        expect(currentConference.leaveRoomWithError == "Licence error. Please report this.");
      });

      await act(async () => {
        expect(currentConference.leftTheRoom == true);
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

    await act(async () => {
      expect(currentConference.leaveRoomWithError == "System is not compatible to connect. Please report this.");
    });

    await act(async () => {
      expect(currentConference.leftTheRoom === true);
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
        currentConference.handleSetMaxVideoTrackCount(5);
      });

      expect(currentConference.globals.desiredMaxVideoTrackCount == 5);

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
    // Execute the function
    await act(async () => {
      currentConference.checkAndUpdateVideoAudioSources();
    });

    // Expectations
    expect(currentConference.cameraButtonDisabled === false);
    expect(currentConference.microphoneButtonDisabled === false);
  });

  it('should disable microphone button if no microphone is available', async () => {
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

      expect(container).not.toContain("Reconnecting...");
      
      webRTCAdaptorConstructor.iceConnectionState = (any) => {
        console.log("iceConnectionState called with: " + any); 
        return "disconnected";
      };
      //global.setTimeout = (callback) => callback();
      await act(async () => {
        webRTCAdaptorConstructor.callback("ice_connection_state_changed", {state: "disconnected"});
      });

      jest.useFakeTimers();
      jest.advanceTimersByTime(10000);
      jest.runAllTimers();
      jest.useRealTimers();

      waitFor(() => {
        expect(container).toContain("Reconnecting...");
      });

      await act(async () => {
        webRTCAdaptorConstructor.callback("play_started");
      });

      await act(async () => {
        webRTCAdaptorConstructor.callback("publish_started");
      });

      await waitFor(() => {
        expect(container).not.toContain("Reconnecting...");
      });
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

      expect(currentConference.isJoining).toBe(false);

      await act(async () => {
        webRTCAdaptorConstructor.callbackError("highResourceUsage", {});
      });

      waitFor(() => {
        expect(webRTCAdaptorConstructor.checkWebSocketConnection).toHaveBeenCalled();
      });
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


      act(() => {
          webRTCAdaptorScreenConstructor.callback("initialized");
      });

      waitFor(() => {
        expect(container).toContain("Starting Screen Share...");
      });
    });

    it('screen sharing test', async () => {
      const {container} = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>
        </ThemeProvider>);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      currentConference.setParticipantUpdated = jest.fn();

      currentConference.allParticipants["participant0"] = {videoTrackId: "participant0", isPinned: false};
      currentConference.allParticipants["participant1"] = {videoTrackId: "participant1", isPinned: false};
      currentConference.allParticipants["participant2"] = {videoTrackId: "participant2", isPinned: false};
      currentConference.allParticipants["participant3"] = {videoTrackId: "participant3", isPinned: false};

      currentConference.videoTrackAssignments["participant0"] = {streamId: "participant0", videoTrackId: "participant0", audioTrackId: "participant0"};
      currentConference.videoTrackAssignments["participant1"] = {streamId: "participant1", videoTrackId: "participant1", audioTrackId: "participant1"};
      currentConference.videoTrackAssignments["participant2"] = {streamId: "participant2", videoTrackId: "participant2", audioTrackId: "participant2"};
      currentConference.videoTrackAssignments["participant3"] = {streamId: "participant3", videoTrackId: "participant3", audioTrackId: "participant3"};

      // testing pinning
      await act(async () => {
        currentConference.pinVideo("participant3");
      });

      expect(currentConference.allParticipants['participant3'].isPinned).toBe(true);
      expect(currentConference.allParticipants['participant2'].isPinned).toBe(false);

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

    it('should correctly parse WebSocket URL with wss protocol', () => {
      const { container } = render(
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>);

      const url = 'wss://localhost:5080/WebRTCAppEE/websocket';
      const result = currentConference.parseWebSocketURL(url);
      expect(result).toEqual('https://localhost:5080/WebRTCAppEE');
    });

    it('should correctly parse WebSocket URL with ws protocol', () => {
      const { container } = render(
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>);

      const url = 'ws://localhost:5080/WebRTCAppEE/websocket';
      const result = currentConference.parseWebSocketURL(url);
      expect(result).toEqual('http://localhost:5080/WebRTCAppEE');
    });

    it('should return empty string when URL is not provided', () => {
      const { container } = render(
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>);

      const url = '';
      const result = currentConference.parseWebSocketURL(url);
      expect(result).toEqual('');
    });

    it('should return empty string when URL is null', () => {
      const { container } = render(
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>);

      const url = null;
      const result = currentConference.parseWebSocketURL(url);
      expect(result).toEqual('');
    });

    it('should return empty string when URL is undefined', () => {
      const { container } = render(
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>);

      const url = undefined;
      const result = currentConference.parseWebSocketURL(url);
      expect(result).toEqual('');
    });

    it('should call createSpeedTestForPublishWebRtcAdaptorPlayOnly when isPlayOnly is true and boolean', async () => {
      const { container } = render(
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>
      );

      currentConference.isPlayOnly = true;
      currentConference.createSpeedTestForPublishWebRtcAdaptorPlayOnly = jest.fn();
      currentConference.createSpeedTestForPublishWebRtcAdaptor = jest.fn();
      currentConference.createSpeedTestForPlayWebRtcAdaptor = jest.fn();

      await act(async () => {
        currentConference.startSpeedTest();
      });

      jest.useFakeTimers();
      jest.advanceTimersByTime(3000);
      jest.runAllTimers();
      jest.useRealTimers();

      waitFor(() => {
        expect(currentConference.createSpeedTestForPublishWebRtcAdaptorPlayOnly).toHaveBeenCalled();
      });
      waitFor(() => {
        expect(currentConference.createSpeedTestForPublishWebRtcAdaptor).not.toHaveBeenCalled();
      });
      waitFor(() => {
        expect(currentConference.createSpeedTestForPlayWebRtcAdaptor).toHaveBeenCalled();
      });
    });

    it('should call createSpeedTestForPublishWebRtcAdaptor when isPlayOnly is false', async () => {
      const { container } = render(
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>
      );

      currentConference.isPlayOnly = false;
      currentConference.createSpeedTestForPublishWebRtcAdaptorPlayOnly = jest.fn();
      currentConference.createSpeedTestForPublishWebRtcAdaptor = jest.fn();
      currentConference.createSpeedTestForPlayWebRtcAdaptor = jest.fn();

      await act(async () => {
        currentConference.startSpeedTest();
      });

      jest.useFakeTimers();
      jest.advanceTimersByTime(3000);
      jest.runAllTimers();
      jest.useRealTimers();

      waitFor(() => {
        expect(currentConference.createSpeedTestForPublishWebRtcAdaptorPlayOnly).not.toHaveBeenCalled();
      });
      waitFor(() => {
        expect(currentConference.createSpeedTestForPublishWebRtcAdaptor).toHaveBeenCalled();
      });
      waitFor(() => {
        expect(currentConference.createSpeedTestForPlayWebRtcAdaptor).toHaveBeenCalled();
      });
    });

  describe('createSpeedTestForPublishWebRtcAdaptorPlayOnly', () => {
    let originalCreateElement;
    let mockCreateElement;
    let mockVideoElement;
    let mockCaptureStream;
    let appendChildSpy;

    beforeEach(() => {
      originalCreateElement = document.createElement;
      mockCaptureStream = jest.fn();
      mockVideoElement = {
        id: '',
        style: {},
        autoplay: false,
        muted: false,
        playsInline: false,
        controls: false,
        width: 0,
        height: 0,
        loop: false,
        crossOrigin: '',
        src: '',
        captureStream: mockCaptureStream,
      };
      mockCreateElement = jest.fn().mockReturnValue(mockVideoElement);
      document.createElement = mockCreateElement;
      appendChildSpy = jest.spyOn(document.body, 'appendChild');
      appendChildSpy.mockImplementation(() => {});
    });

    afterEach(() => {
      document.createElement = originalCreateElement;
      appendChildSpy.mockRestore();
    });

    it('should create a video element with correct properties', () => {
      conference.createSpeedTestForPublishWebRtcAdaptorPlayOnly();
      expect(mockCreateElement).toHaveBeenCalledWith('video');
      expect(mockVideoElement.id).toBe('speedTestVideoElement');
      expect(mockVideoElement.style.display).toBe('none');
      expect(mockVideoElement.autoplay).toBe(true);
      expect(mockVideoElement.muted).toBe(true);
      expect(mockVideoElement.playsInline).toBe(true);
      expect(mockVideoElement.controls).toBe(false);
      expect(mockVideoElement.width).toBe(640);
      expect(mockVideoElement.height).toBe(360);
      expect(mockVideoElement.loop).toBe(true);
      expect(mockVideoElement.crossOrigin).toBe('anonymous');
    });

    it('should set the video element source correctly', () => {
      conference.createSpeedTestForPublishWebRtcAdaptorPlayOnly();
      expect(mockVideoElement.src).toBe(conference.parseWebSocketURL(websocketURL) + "/speed-test-sample-video.mp4");
    });

    it('should append the video element to the body', () => {
      const appendChildSpy = jest.spyOn(document.body, 'appendChild');
      conference.createSpeedTestForPublishWebRtcAdaptorPlayOnly();
      expect(appendChildSpy).toHaveBeenCalledWith(mockVideoElement);
    });

    it('should call captureStream on the video element after a delay', async () => {
      jest.useFakeTimers();
      conference.createSpeedTestForPublishWebRtcAdaptorPlayOnly();
      jest.advanceTimersByTime(3000);
      expect(mockCaptureStream).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('speedTestForPublishWebRtcAdaptor callbacks test', () => {
    let speedTestForPublishWebRtcAdaptor;
    let setSpeedTestObject;
    let stopSpeedTest;

    beforeEach(() => {
      speedTestForPublishWebRtcAdaptor = {
        current: {
          publish: jest.fn(),
          enableStats: jest.fn(),
          stop: jest.fn(),
          mediaManager: {
            bandwidth: 1000
          }
        }
      };
      setSpeedTestObject = jest.fn();
      stopSpeedTest = jest.fn();
    });


    it('should handle "initialized" info', () => {
      conference.speedTestForPublishWebRtcAdaptorInfoCallback('initialized', {});
      waitFor(() => {
        expect(webRTCAdaptorPublishSpeedTestConstructor.publish).toHaveBeenCalled();
      });
    });

    it('should handle "publish_started" info', () => {
      conference.speedTestForPublishWebRtcAdaptorInfoCallback('publish_started', {});
      waitFor(() => {
        expect(webRTCAdaptorPublishSpeedTestConstructor.enableStats).toHaveBeenCalled();
      });
    });

    it('should handle "updated_stats" info and stop speed test after 3 updates', () => {
      const obj = {
        videoRoundTripTime: '100',
        audioRoundTripTime: '100',
        videoPacketsLost: '1',
        audioPacketsLost: '1',
        videoJitter: '10',
        audioJitter: '10',
        currentOutgoingBitrate: '800'
      };
      speedTestForPublishWebRtcAdaptor.current.mediaManager.bandwidth = 1000;
      conference.speedTestForPublishWebRtcAdaptorInfoCallback('updated_stats', obj);
      conference.speedTestForPublishWebRtcAdaptorInfoCallback('updated_stats', obj);
      //conference.speedTestForPublishWebRtcAdaptorInfoCallback('updated_stats', obj);
      //expect(conference.stop).toHaveBeenCalled();
      //expect(setSpeedTestObject).toHaveBeenCalledWith({ message: 'Your connection is good', isfinished: true });
      //expect(stopSpeedTest).toHaveBeenCalled();
    });

    it('should handle error callback', () => {
      conference.speedTestForPublishWebRtcAdaptorErrorCallback('NotFoundError', 'Media not found');
    });
  });

  describe('speedTestForPlayWebRtcAdaptor callbacks test', () => {
    let speedTestForPlayWebRtcAdaptor;
    let consoleSpy;

    beforeEach(() => {
      speedTestForPlayWebRtcAdaptor = {
        current: {
          play: jest.fn(),
          requestVideoTrackAssignments: jest.fn(),
        },
      };
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log "speed test publish started" when info is "publish_started"', () => {
      conference.speedTestForPlayWebRtcAdaptorInfoCallback('publish_started', {});
      expect(consoleSpy).toHaveBeenCalledWith('speed test publish started');
    });

    it('should log "speed test updated stats" when info is "updated_stats"', () => {
      conference.speedTestForPlayWebRtcAdaptorInfoCallback('updated_stats', {});
      expect(consoleSpy).toHaveBeenCalledWith('speed test updated stats');
    });

    it('should log "speed test ice connection state changed" when info is "ice_connection_state_changed"', () => {
      conference.speedTestForPlayWebRtcAdaptorInfoCallback('ice_connection_state_changed', {});
      expect(consoleSpy).toHaveBeenCalledWith('speed test ice connection state changed');
    });

    it('should log error and message when speedTestForPlayWebRtcAdaptorErrorCallback is called', () => {
      conference.speedTestForPlayWebRtcAdaptorErrorCallback('NotFoundError', 'Media not found');
      expect(consoleSpy).toHaveBeenCalledWith('error from speed test webrtc adaptor callback');
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

      expect(currentConference.isJoining).toBe(false);

      await act(async () => {
        webRTCAdaptorConstructor.callbackError("highResourceUsage", {});
      });

      jest.useFakeTimers();
      jest.advanceTimersByTime(10000);
      jest.runAllTimers();
      jest.useRealTimers();

      waitFor(() => {
        expect(webRTCAdaptorConstructor.checkWebSocketConnection).toHaveBeenCalled();
      });
    });

    it('checks connection quality and displays warning for poor network connection', async () => {  
      
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
      const unstable_msg = "Poor Network Connection Warning:Network connection is not stable. Please check your connection!";
      
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
    
      await act(async () => {
        webRTCAdaptorConstructor.callback("updated_stats", mockStats);
        mockStats.videoRoundTripTime = '150';
        mockStats.audioRoundTripTime = '160';
        
        webRTCAdaptorConstructor.callback("updated_stats", mockStats);

        expect(consoleWarnSpy).toHaveBeenCalledWith(weak_msg);
        expect(enqueueSnackbar).toHaveBeenCalledWith("Network connection is weak. You may encounter connection drop!", expect.anything());

        mockStats.videoRoundTripTime = '120';
        mockStats.audioRoundTripTime = '130';

        webRTCAdaptorConstructor.callback("updated_stats", mockStats);

        expect(consoleWarnSpy).toHaveBeenCalledWith(unstable_msg);
        //expect(enqueueSnackbar).toHaveBeenCalledWith("Network connection is not stable. Please check your connection!", expect.anything());
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


        mockStats.videoJitter = '60';
        mockStats.audioJitter = '70';

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

  });

  it('should stop and nullify speedTestForPublishWebRtcAdaptor when it is defined', async () => {
      // Arrange
      const mockStop = jest.fn();
      webRTCAdaptorPublishSpeedTestPlayOnlyConstructor = { stop: mockStop };
      webRTCAdaptorPublishSpeedTestConstructor = { stop: mockStop };

      // Act
      await act(async () => {
        currentConference.stopSpeedTest();
      });

      jest.useFakeTimers();
      jest.advanceTimersByTime(3000);
      jest.runAllTimers();
      jest.useRealTimers();

      // Assert
      waitFor(() => {
        expect(mockStop).toHaveBeenCalledWith(`speedTestStream${currentConference.speedTestStreamId.current}`);
      });
      waitFor(() => {
        expect(webRTCAdaptorPublishSpeedTestPlayOnlyConstructor).toBeNull();
      });
      waitFor(() => {
        expect(webRTCAdaptorPublishSpeedTestConstructor).toBeNull();
      });
    });

    it('should not throw error when speedTestForPublishWebRtcAdaptor is not defined', async () => {
      // Arrange
      webRTCAdaptorPublishSpeedTestPlayOnlyConstructor = null;
      webRTCAdaptorPublishSpeedTestConstructor = null;

      // Act and Assert
      await expect(async () => {
        await act(async () => {
          currentConference.stopSpeedTest();
        });
      }).not.toThrow();
    });

    it('should stop and nullify speedTestForPlayWebRtcAdaptor when it is defined', async () => {
      // Arrange
      const mockStop = jest.fn();
      webRTCAdaptorPlaySpeedTestConstructor = { stop: mockStop };

      // Act
      await act(async () => {
        currentConference.stopSpeedTest();
      });

      // Assert
      waitFor(() => {
        expect(mockStop).toHaveBeenCalledWith(`speedTestStream${currentConference.speedTestStreamId.current}`);
      });
      waitFor(() => {
        expect(webRTCAdaptorPlaySpeedTestConstructor).toBeNull();
      });
    });

    it('should not throw error when speedTestForPlayWebRtcAdaptor is not defined', async () => {
      // Arrange
      webRTCAdaptorPlaySpeedTestConstructor = null;

      // Act and Assert
      await expect(async () => {
        await act(async () => {
          currentConference.stopSpeedTest();
        });
      }).not.toThrow();
    });
   
});
