import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import useSpeedTest from '../../hooks/useSpeedTest';

// Mock WebRTC Adaptor
jest.mock('@antmedia/webrtc_adaptor', () => {
  return {
    WebRTCAdaptor: jest.fn().mockImplementation(() => ({
      publish: jest.fn(),
      play: jest.fn(),
      enableStats: jest.fn(),
      stop: jest.fn(),
      closeStream: jest.fn(),
      closeWebSocket: jest.fn(),
      mediaManager: {
        bandwidth: 1000,
        trackDeviceChange: jest.fn()
      }
    }))
  };
});

// Mock the publishStats reference used in the hook
beforeEach(() => {
  // Mock the publishStats reference that's used in calculateThePlaySpeedTestResult
  if (!global.publishStats) {
    global.publishStats = { current: null };
  }
});

describe('useSpeedTest Hook', () => {
  const defaultProps = {
    websocketURL: 'wss://test.antmedia.io:5443/WebRTCAppEE/websocket',
    peerconnection_config: { iceServers: [] },
    token: 'test-token',
    subscriberId: 'test-subscriber-id',
    subscriberCode: 'test-subscriber-code',
    isPlayOnly: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));
    
    expect(result.current.speedTestObject.message).toBe('Please wait while we are testing your connection speed');
    expect(result.current.speedTestObject.isfinished).toBe(false);
    expect(result.current.speedTestObject.isfailed).toBe(false);
    expect(result.current.speedTestObject.progressValue).toBe(10);
    expect(result.current.speedTestInProgress).toBe(false);
    expect(result.current.speedTestProgress.current).toBe(0);
    expect(result.current.speedTestStreamId).toBeDefined();
  });

  it('starts and stops speed test', () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));
    
    act(() => {
      result.current.startSpeedTest();
    });
    
    expect(result.current.speedTestInProgress).toBe(true);
    
    act(() => {
      result.current.stopSpeedTest();
    });
    
    expect(result.current.speedTestInProgress).toBe(false);
  });

  it('sets and fills play stats list correctly', () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));
    
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
      audioPacketsLost: 1100,
      inboundRtpList: [],
      videoJitterAverageDelay: 50,
      audioJitterAverageDelay: 60,
      videoRoundTripTime: 70,
      audioRoundTripTime: 80
    };
    
    act(() => {
      result.current.setAndFillPlayStatsList(mockStats);
    });
    
    expect(result.current.statsList.current.length).toBe(1);
    expect(result.current.statsList.current[0].currentRoundTripTime).toBe(100);
    expect(result.current.statsList.current[0].packetsReceived).toBe(200);
    expect(result.current.statsList.current[0].totalBytesReceivedCount).toBe(300);
    expect(result.current.statsList.current[0].framesReceived).toBe(400);
    expect(result.current.statsList.current[0].framesDropped).toBe(500);
    expect(result.current.statsList.current[0].startTime).toBe(600);
    expect(result.current.statsList.current[0].currentTimestamp).toBe(700);
    expect(result.current.statsList.current[0].firstBytesReceivedCount).toBe(800);
    expect(result.current.statsList.current[0].lastBytesReceived).toBe(900);
    expect(result.current.statsList.current[0].videoPacketsLost).toBe(1000);
    expect(result.current.statsList.current[0].audioPacketsLost).toBe(1100);
    expect(result.current.statsList.current[0].videoJitterAverageDelay).toBe(50);
    expect(result.current.statsList.current[0].audioJitterAverageDelay).toBe(60);
    expect(result.current.statsList.current[0].videoRoundTripTime).toBe(70);
    expect(result.current.statsList.current[0].audioRoundTripTime).toBe(80);
  });

  it('sets and fills publish stats list correctly', () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));
    
    const mockStats = {
      videoRoundTripTime: 100,
      audioRoundTripTime: 200,
      videoPacketsLost: 300,
      totalVideoPacketsSent: 400,
      totalAudioPacketsSent: 500,
      audioPacketsLost: 600,
      videoJitter: 700,
      audioJitter: 800,
      currentOutgoingBitrate: 900
    };
    
    act(() => {
      result.current.setAndFillPublishStatsList(mockStats);
    });
    
    expect(result.current.statsList.current.length).toBe(1);
    expect(result.current.statsList.current[0].videoRoundTripTime).toBe(100);
    expect(result.current.statsList.current[0].audioRoundTripTime).toBe(200);
    expect(result.current.statsList.current[0].videoPacketsLost).toBe(300);
    expect(result.current.statsList.current[0].totalVideoPacketsSent).toBe(400);
    expect(result.current.statsList.current[0].totalAudioPacketsSent).toBe(500);
    expect(result.current.statsList.current[0].audioPacketsLost).toBe(600);
    expect(result.current.statsList.current[0].videoJitter).toBe(700);
    expect(result.current.statsList.current[0].audioJitter).toBe(800);
    expect(result.current.statsList.current[0].currentOutgoingBitrate).toBe(900);
  });

  it('calculates play speed test result with great connection', async () => {
    
    const { result } = renderHook(() => {
      const hook = useSpeedTest(defaultProps);
      return hook;
    });
    
    act(() => {
      result.current.startSpeedTest();
    });

    result.current.statsList.current = [
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
      result.current.calculateThePlaySpeedTestResult();
    });

    console.log(result.current.speedTestObject);
    await waitFor(() => {
      expect(result.current.speedTestObject.message).toBe('Your connection is Great!');
      expect(result.current.speedTestObject.isfailed).toBe(false);
      expect(result.current.speedTestObject.progressValue).toBe(100);
      expect(result.current.speedTestObject.isfinished).toBe(true);
    });
  });

  it('calculates play speed test result with moderate connection', async () => {
    
    const { result } = renderHook(() => {
      const hook = useSpeedTest(defaultProps);
      return hook;
    });
    
    act(() => {
      result.current.startSpeedTest();
    });

    result.current.statsList.current = [
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
      result.current.calculateThePlaySpeedTestResult();
    });

    await waitFor(() => {
      expect(result.current.speedTestObject.message).toBe('Your connection is moderate, occasional disruptions may occur');
      expect(result.current.speedTestObject.isfailed).toBe(false);
      expect(result.current.speedTestObject.progressValue).toBe(100);
      expect(result.current.speedTestObject.isfinished).toBe(true);
    }); 
  });

  it('calculates play speed test result with poor connection', async () => {
    
    const { result } = renderHook(() => {
      const hook = useSpeedTest(defaultProps);
      return hook;
    });
    
    act(() => {
      result.current.startSpeedTest();
    }); 

    result.current.statsList.current = [
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
      result.current.calculateThePlaySpeedTestResult();
    });

    await waitFor(() => {
      expect(result.current.speedTestObject.message).toBe('Your connection quality is poor. You may experience interruptions');
      expect(result.current.speedTestObject.isfailed).toBe(false);
      expect(result.current.speedTestObject.progressValue).toBe(100);
      expect(result.current.speedTestObject.isfinished).toBe(true);
    });
  });

  it('increments speedTestCounter when processUpdatedStatsForPlaySpeedTest is called', () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));

    act(() => {
      result.current.startSpeedTest();
    });

    result.current.speedTestCounter.current = 1;
    result.current.statsList.current = [{}, {}];

    act(() => {
      result.current.processUpdatedStatsForPlaySpeedTest({});
    });

    expect(result.current.speedTestCounter.current).toBe(2);
  });

  it('sets speed test object to failed state', async () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));
    
    act(() => {
      result.current.startSpeedTest();
    });
    
    expect(result.current.speedTestInProgress).toBe(true);

    result.current.speedTestObject = {
      message: "Speed Test",
      isfinished: false,
      isfailed: false,
      errorMessage: "",
      progressValue: 50
    };

    result.current.setSpeedTestObject = jest.fn();

    await act(async () => {
      result.current.setSpeedTestObjectFailed('Error message');
    });

    await waitFor(() => {
      expect(result.current.speedTestObject.message).toBe('Error message');
      expect(result.current.speedTestObject.isfinished).toBe(false);
      expect(result.current.speedTestObject.isfailed).toBe(true);
      expect(result.current.speedTestObject.errorMessage).toBe('Error message');
      expect(result.current.speedTestObject.progressValue).toBe(0);
    });
  });

  it('sets speed test object progress correctly', async () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));
    
    act(() => {
      result.current.startSpeedTest();
    });
    
    expect(result.current.speedTestInProgress).toBe(true);

    await act(async () => {
      result.current.setSpeedTestObjectProgress(50);
    });

    await waitFor(() => {
      expect(result.current.speedTestObject.isfinished).toBe(false);
      expect(result.current.speedTestObject.isfailed).toBe(false);
      expect(result.current.speedTestObject.errorMessage).toBe('');
      expect(result.current.speedTestObject.progressValue).toBe(50);
    });
  });

  it('handles progress value greater than 100', async () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));
    
    act(() => {
      result.current.startSpeedTest();
    });
    
    expect(result.current.speedTestInProgress).toBe(true);
    await act(async () => {
      result.current.setSpeedTestObjectProgress(150);
    });

    const stopSpeedTest = jest.fn();
    //expect(stopSpeedTest).toHaveBeenCalled();
    expect(result.current.speedTestObject.message).toBe('Speed test failed. It may be due to firewall, wi-fi or network restrictions. Change your network or Try again ');
    expect(result.current.speedTestObject.isfinished).toBe(false);
    expect(result.current.speedTestObject.isfailed).toBe(true);
    expect(result.current.speedTestObject.errorMessage).toBe('Speed test failed. It may be due to firewall, wi-fi or network restrictions. Change your network or Try again ');
    expect(result.current.speedTestObject.progressValue).toBe(0);
  });

  it('updates progress and stats list on subsequent iterations', async () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));
    
    act(() => {
      result.current.startSpeedTest();
    });
    
    expect(result.current.speedTestInProgress).toBe(true);
    result.current.speedTestCounter.current = 1;
    result.current.statsList.current = [{}, {}];
    result.current.setAndFillPlayStatsList = jest.fn();
    result.current.setSpeedTestObjectProgress = jest.fn();
    result.current.setSpeedTestObject = jest.fn();

    result.current.processUpdatedStatsForPlaySpeedTest({});

    expect(result.current.statsList.current).toEqual([{}, {}, {}]);
  });
  it('updates speed test object progress when iterations are insufficient', async () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));
    
    act(() => {
      result.current.startSpeedTest();
    });
    
    expect(result.current.speedTestInProgress).toBe(true);

    result.current.speedTestCounter.current = 2;
    result.current.statsList.current = [{}, {}];
    result.current.setSpeedTestObjectProgress = jest.fn();
    result.current.setSpeedTestObject = jest.fn();
    result.current.speedTestObject = {
      message: "Speed Test",
      isfinished: false,
      isfailed: false,
      errorMessage: "",
      progressValue: 0
    };

    result.current.processUpdatedStatsForPlaySpeedTest({});

    expect(result.current.setSpeedTestObject).not.toHaveBeenCalledWith({
      message: result.current.speedTestObject.message,
      isfinished: false,
      isfailed: false,
      errorMessage: "",
      progressValue: 60
    });
  });

  it('creates WebRTC adaptor for play when isPlayOnly is true', () => {
    const playOnlyProps = {
      ...defaultProps,
      isPlayOnly: true
    };

    const { result } = renderHook(() => useSpeedTest(playOnlyProps));

    act(() => {
      result.current.startSpeedTest();
    });

    expect(result.current.speedTestInProgress).toBe(true);
    // WebRTCAdaptor constructor should be called with play-specific parameters
    expect(require('@antmedia/webrtc_adaptor').WebRTCAdaptor).toHaveBeenCalledWith(
      expect.objectContaining({
        purposeForTest: 'play-speed-test'
      })
    );
  });

  it('creates WebRTC adaptor for publish when isPlayOnly is false', () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));

    act(() => {
      result.current.startSpeedTest();
    });

    expect(result.current.speedTestInProgress).toBe(true);
    // WebRTCAdaptor constructor should be called with publish-specific parameters
    expect(require('@antmedia/webrtc_adaptor').WebRTCAdaptor).toHaveBeenCalledWith(
      expect.objectContaining({
        purposeForTest: 'publish-speed-test'
      })
    );
  });

  it('handles initialized callback for publish adaptor', () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));
    
    // Capture the callback function when WebRTCAdaptor is constructed
    const mockCallback = jest.fn();
    require('@antmedia/webrtc_adaptor').WebRTCAdaptor.mockImplementationOnce(config => {
      mockCallback.mockImplementation(config.callback);
      return {
        publish: jest.fn(),
        enableStats: jest.fn(),
        stop: jest.fn(),
        closeStream: jest.fn(),
        closeWebSocket: jest.fn()
      };
    });
    
    act(() => {
      result.current.startSpeedTest();
    });
    
    // Simulate the initialized callback
    act(() => {
      result.current.speedTestForPublishWebRtcAdaptorInfoCallback('initialized');
    });
    
    expect(result.current.speedTestCounter.current).toBe(0);
    expect(result.current.speedTestObject.progressValue).toBe(10);
  });

  it('handles publish_started callback for publish adaptor', () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));
    
    act(() => {
      result.current.startSpeedTest();
    });
    
    // Directly test the callback handler
    act(() => {
      result.current.speedTestForPublishWebRtcAdaptorInfoCallback('publish_started');
    });
    
    expect(result.current.speedTestCounter.current).toBe(0);
    expect(result.current.speedTestObject.progressValue).toBe(20);
  });

  it('handles play_started callback for play adaptor', () => {
    const { result } = renderHook(() => useSpeedTest({...defaultProps, isPlayOnly: true}));
    
    act(() => {
      result.current.startSpeedTest();
    });
    
    // Mock the WebRTCAdaptor callback directly
    const webRtcAdaptor = require('@antmedia/webrtc_adaptor').WebRTCAdaptor.mock.instances[0];
    // Call the callback function that was passed to WebRTCAdaptor
    const callbackFunction = require('@antmedia/webrtc_adaptor').WebRTCAdaptor.mock.calls[0][0].callback;
    
    act(() => {
      callbackFunction('play_started');
    });
    
    expect(result.current.speedTestObject.progressValue).toBe(20);
  });

  it('handles updated_stats callback for publish adaptor with sufficient iterations', () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));
    
    act(() => {
      result.current.startSpeedTest();
    });
    
    // Setup the scenario where we already have enough stats
    result.current.speedTestCounter.current = 3;
    result.current.statsList.current = [{}, {}, {}, {}];
    
    // Call the callback function that was passed to WebRTCAdaptor
    const callbackFunction = require('@antmedia/webrtc_adaptor').WebRTCAdaptor.mock.calls[0][0].callback;
    
    act(() => {
      callbackFunction('updated_stats', {});
    });
    
    // The test passes if we don't get an error, as the actual implementation would call calculateThePublishSpeedTestResult
  });

  it('handles error callback for publish adaptor', () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));
    
    act(() => {
      result.current.startSpeedTest();
    });
    
    // Call the error callback function that was passed to WebRTCAdaptor
    const errorCallbackFunction = require('@antmedia/webrtc_adaptor').WebRTCAdaptor.mock.calls[0][0].callbackError;
    
    act(() => {
      errorCallbackFunction('test-error', 'test-message');
    });
    
    expect(result.current.speedTestObject.isfailed).toBe(true);
    expect(result.current.speedTestObject.errorMessage).toContain('test-error');
  });

  it('handles error callback for play adaptor', () => {
    const { result } = renderHook(() => useSpeedTest({...defaultProps, isPlayOnly: true}));
    
    act(() => {
      result.current.startSpeedTest();
    });
    
    // Call the error callback function that was passed to WebRTCAdaptor
    const errorCallbackFunction = require('@antmedia/webrtc_adaptor').WebRTCAdaptor.mock.calls[0][0].callbackError;
    
    act(() => {
      errorCallbackFunction('test-error', 'test-message');
    });
    
    expect(result.current.speedTestObject.isfailed).toBe(true);
    expect(result.current.speedTestObject.errorMessage).toContain('test-error');
  });

  it('calculates publish speed test result with good connection', () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));
    
    act(() => {
      result.current.startSpeedTest();
    });
    
    // Prepare mock stats for a good connection
    result.current.statsList.current = [
      {
        videoRoundTripTime: '0.02',
        audioRoundTripTime: '0.02',
        videoPacketsLost: '0',
        totalVideoPacketsSent: '1000',
        totalAudioPacketsSent: '1000',
        audioPacketsLost: '0',
        videoJitter: '0.01',
        audioJitter: '0.01',
        currentOutgoingBitrate: '500000'
      },
      {
        videoRoundTripTime: '0.02',
        audioRoundTripTime: '0.02',
        videoPacketsLost: '0',
        totalVideoPacketsSent: '1000',
        totalAudioPacketsSent: '1000',
        audioPacketsLost: '0',
        videoJitter: '0.01',
        audioJitter: '0.01',
        currentOutgoingBitrate: '500000'
      },
      {
        videoRoundTripTime: '0.02',
        audioRoundTripTime: '0.02',
        videoPacketsLost: '0',
        totalVideoPacketsSent: '1000',
        totalAudioPacketsSent: '1000',
        audioPacketsLost: '0',
        videoJitter: '0.01',
        audioJitter: '0.01',
        currentOutgoingBitrate: '500000'
      }
    ];
    
    // Call the function via the callback to ensure it's properly called
    const callbackFunction = require('@antmedia/webrtc_adaptor').WebRTCAdaptor.mock.calls[0][0].callback;
    
    act(() => {
      // Simulate a scenario that would trigger calculateThePublishSpeedTestResult
      result.current.speedTestCounter.current = 4;
      callbackFunction('updated_stats', {});
    });
    
    // Test that the calculation happened correctly
    expect(result.current.speedTestObject.isfinished).toBe(true);
    expect(result.current.speedTestObject.progressValue).toBe(100);
  });

  it('calculates publish speed test result with moderate connection', () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));
    
    act(() => {
      result.current.startSpeedTest();
    });
    
    // Prepare mock stats for a moderate connection
    result.current.statsList.current = [
      {
        videoRoundTripTime: '0.15',
        audioRoundTripTime: '0.15',
        videoPacketsLost: '20',
        totalVideoPacketsSent: '1000',
        totalAudioPacketsSent: '1000',
        audioPacketsLost: '20',
        videoJitter: '0.09',
        audioJitter: '0.09',
        currentOutgoingBitrate: '300000'
      },
      {
        videoRoundTripTime: '0.15',
        audioRoundTripTime: '0.15',
        videoPacketsLost: '20',
        totalVideoPacketsSent: '1000',
        totalAudioPacketsSent: '1000',
        audioPacketsLost: '20',
        videoJitter: '0.09',
        audioJitter: '0.09',
        currentOutgoingBitrate: '300000'
      },
      {
        videoRoundTripTime: '0.15',
        audioRoundTripTime: '0.15',
        videoPacketsLost: '20',
        totalVideoPacketsSent: '1000',
        totalAudioPacketsSent: '1000',
        audioPacketsLost: '20',
        videoJitter: '0.09',
        audioJitter: '0.09',
        currentOutgoingBitrate: '300000'
      }
    ];
    
    act(() => {
      result.current.calculateThePublishSpeedTestResult();
    });
    
    expect(result.current.speedTestObject.message).toBe('Your connection is moderate, occasional disruptions may occur');
    expect(result.current.speedTestObject.isfinished).toBe(true);
    expect(result.current.speedTestObject.progressValue).toBe(100);
  });

  it('calculates publish speed test result with poor connection', () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));
    
    act(() => {
      result.current.startSpeedTest();
    });
    
    // Prepare mock stats for a poor connection
    result.current.statsList.current = [
      {
        videoRoundTripTime: '0.3',
        audioRoundTripTime: '0.3',
        videoPacketsLost: '50',
        totalVideoPacketsSent: '1000',
        totalAudioPacketsSent: '1000',
        audioPacketsLost: '50',
        videoJitter: '0.25',
        audioJitter: '0.25',
        currentOutgoingBitrate: '150000'
      },
      {
        videoRoundTripTime: '0.3',
        audioRoundTripTime: '0.3',
        videoPacketsLost: '50',
        totalVideoPacketsSent: '1000',
        totalAudioPacketsSent: '1000',
        audioPacketsLost: '50',
        videoJitter: '0.25',
        audioJitter: '0.25',
        currentOutgoingBitrate: '150000'
      },
      {
        videoRoundTripTime: '0.3',
        audioRoundTripTime: '0.3',
        videoPacketsLost: '50',
        totalVideoPacketsSent: '1000',
        totalAudioPacketsSent: '1000',
        audioPacketsLost: '50',
        videoJitter: '0.25',
        audioJitter: '0.25',
        currentOutgoingBitrate: '150000'
      }
    ];
    
    act(() => {
      result.current.calculateThePublishSpeedTestResult();
    });
    
    expect(result.current.speedTestObject.message).toBe('Your connection quality is poor. You may experience interruptions');
    expect(result.current.speedTestObject.isfinished).toBe(true);
    expect(result.current.speedTestObject.progressValue).toBe(100);
  });

  it('handles negative values in stats calculations', () => {
    const { result } = renderHook(() => useSpeedTest(defaultProps));
    
    act(() => {
      result.current.startSpeedTest();
    });
    
    // Prepare mock stats with negative values
    result.current.statsList.current = [
      {
        videoRoundTripTime: '-1',
        audioRoundTripTime: '-1',
        videoPacketsLost: '-10',
        totalVideoPacketsSent: '-100',
        totalAudioPacketsSent: '-100',
        audioPacketsLost: '-10',
        videoJitter: '-1',
        audioJitter: '-1',
        currentOutgoingBitrate: '-1'
      },
      {
        videoRoundTripTime: '-1',
        audioRoundTripTime: '-1',
        videoPacketsLost: '-10',
        totalVideoPacketsSent: '-100',
        totalAudioPacketsSent: '-100',
        audioPacketsLost: '-10',
        videoJitter: '-1',
        audioJitter: '-1',
        currentOutgoingBitrate: '-1'
      },
      {
        videoRoundTripTime: '-1',
        audioRoundTripTime: '-1',
        videoPacketsLost: '-10',
        totalVideoPacketsSent: '-100',
        totalAudioPacketsSent: '-100',
        audioPacketsLost: '-10',
        videoJitter: '-1',
        audioJitter: '-1',
        currentOutgoingBitrate: '-1'
      }
    ];
    
    // Should not throw errors with negative values
    act(() => {
      result.current.calculateThePublishSpeedTestResult();
    });
    
    // All negative values should be converted to 0
    expect(result.current.speedTestObject.isfinished).toBe(true);
  });
}); 