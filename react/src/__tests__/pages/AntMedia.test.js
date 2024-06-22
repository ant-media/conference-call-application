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

global.navigator.mediaDevices = mediaDevicesMock; // here

describe('AntMedia Component', () => {

  beforeEach(() => {
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
        enqueueSnackbar: jest.fn(),
        closeSnackbar: jest.fn(),
    }));
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

          expect(consoleSpy).toHaveBeenCalledWith("displayPoorNetworkConnectionWarning");


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

      expect(consoleSpy).toHaveBeenCalledWith("publishTimeoutError", "Firewall might be blocking the connection Please setup a TURN Server");

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

      expect(consoleSpy).toHaveBeenCalledWith("license_suspended_please_renew_license", "Licence is Expired please renew the licence");


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

    expect(consoleSpy).toHaveBeenCalledWith("notSetRemoteDescription", "Not set remote description");


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

  describe('parseWebSocketURL', () => {
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
  });

  describe('startSpeedTest', () => {
    it('should call createSpeedTestForPublishWebRtcAdaptorPlayOnly when isPlayOnly is true and string', async () => {
      const { container } = render(
          <AntMedia isTest={true}>
            <MockChild/>
          </AntMedia>
      );

      currentConference.isPlayOnly = "true";
      currentConference.createSpeedTestForPublishWebRtcAdaptorPlayOnly = jest.fn();
      currentConference.createSpeedTestForPublishWebRtcAdaptor = jest.fn();
      currentConference.createSpeedTestForPlayWebRtcAdaptor = jest.fn();

      await act(async () => {
        currentConference.startSpeedTest();
      });

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
  });

  describe('stopSpeedTest function', () => {
    it('should stop and nullify speedTestForPublishWebRtcAdaptor when it is defined', async () => {
      // Arrange
      const mockStop = jest.fn();
      webRTCAdaptorPublishSpeedTestPlayOnlyConstructor = { stop: mockStop };
      webRTCAdaptorPublishSpeedTestConstructor = { stop: mockStop };

      // Act
      await act(async () => {
        currentConference.stopSpeedTest();
      });

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

});

/*
webRTCAdaptorPublishSpeedTestPlayOnlyConstructor
webRTCAdaptorPublishSpeedTestConstructor
webRTCAdaptorPlaySpeedTestConstructor
 */