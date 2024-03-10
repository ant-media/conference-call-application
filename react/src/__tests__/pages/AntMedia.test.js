// src/Button.test.js
import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import AntMedia from 'pages/AntMedia';
import { useWebSocket } from 'Components/WebSocketProvider';
import { useSnackbar} from "notistack";
import { ConferenceContext } from "pages/AntMedia";


var webRTCAdaptorConstructor, webRTCAdaptorScreenConstructor;
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

jest.mock('@antmedia/webrtc_adaptor', () => ({
  ...jest.requireActual('@antmedia/webrtc_adaptor'),
  WebRTCAdaptor: jest.fn().mockImplementation((params) => {
    console.log(params);
    if(params.mediaConstraints.audio === true) {
      webRTCAdaptorScreenConstructor = params;
    }
    else {
      webRTCAdaptorConstructor = params;
    }
    return {
      init: jest.fn(),
      publish: jest.fn().mockImplementation(() => console.log('publishhhhhh')),
      play: jest.fn(),
      unpublish: jest.fn(),
      leaveRoom: jest.fn(),
      startPublishing: jest.fn(),
      stopPublishing: jest.fn(),
      startPlaying: jest.fn(),
      stopPlaying: jest.fn(),
      getLocalStream: jest.fn(),
      applyConstraints: jest.fn(),
      sendData: jest.fn().mockImplementation((publishStreamId, data) => console.log('send data called with ')),
      setMaxVideoTrackCount: jest.fn(),
    };
  }),
}));

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

      currentConference.allParticipants["p1"] = {streamId: "p1", name: "test1", metaData: JSON.stringify({isScreenShared: true})};

      var obj = {};
      var notificationEvent = {
        eventType: "VIDEO_TRACK_ASSIGNMENT_LIST",
        streamId: "stream1",
        payload: [
          {videoLabel:"videoTrack1", trackId:"tracka1"},
          {videoLabel:"videoTrack2", trackId:"tracka2"},
        ]
      };
      var json = JSON.stringify(notificationEvent);

      obj.data = json;

      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      await act(async () => {
        webRTCAdaptorConstructor.callback("data_received", obj);
      });


      await waitFor(() => {
        expect(currentConference.screenSharedVideoId).toBe("p1");
      });

      var event = {"eventType": "PIN_USER", "streamId": "p1"};
      expect(consoleSpy).toHaveBeenCalledWith("send notification event", event);


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

      await waitFor(() => {
        expect(currentConference.pinnedVideoId).toBe("test1");
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

      expect(currentConference.globals.maxVideoTrackCount == 7);

      consoleSpy.mockRestore();

    });

});
