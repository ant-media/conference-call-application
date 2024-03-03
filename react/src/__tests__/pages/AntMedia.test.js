// src/Button.test.js
import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import AntMedia from 'pages/AntMedia';
import { useWebSocket } from 'Components/WebSocketProvider';
import { SnackbarProvider, useSnackbar} from "notistack";
import { ConferenceContext } from "pages/AntMedia";
import { assert, timeout } from 'workbox-core/_private';


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
      unpublish: jest.fn(),
      leaveRoom: jest.fn(),
      startPublishing: jest.fn(),
      stopPublishing: jest.fn(),
      startPlaying: jest.fn(),
      stopPlaying: jest.fn(),
      getLocalStream: jest.fn(),
      applyConstraints: jest.fn(),
    };
  }),
}));


const MockChild = () => {
  const conference = React.useContext(ConferenceContext);
  currentConference = conference;

  console.log(conference);

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


//jest.mock('pages/MeetingRoom', () => ({ value }) => <div>{value}</div>);
//jest.mock('Components/MessageDrawer', () => ({ value }) => <div>{value}</div>);
//jest.mock('Components/ParticipantListDrawer', () => ({ value }) => <div>{value}</div>);
//jest.mock('Components/EffectsDrawer', () => ({ value }) => <div>{value}</div>);

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

  
});
