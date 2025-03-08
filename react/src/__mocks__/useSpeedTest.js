import { useRef } from 'react';

const mockSpeedTestStreamId = useRef('test-stream-id-12345');
const mockStatsList = useRef([]);
const mockSpeedTestCounter = useRef(0);

const mockSpeedTestResults = {
  message: "Your connection is Great!",
  isfinished: true,
  isfailed: false,
  errorMessage: "",
  progressValue: 100
};

const useSpeedTest = jest.fn().mockImplementation(() => {
  return {
    startSpeedTest: jest.fn(),
    stopSpeedTest: jest.fn(),
    speedTestResults: mockSpeedTestResults,
    speedTestInProgress: false,
    speedTestProgress: 100,
    speedTestStreamId: mockSpeedTestStreamId,
    setAndFillPlayStatsList: jest.fn(),
    setAndFillPublishStatsList: jest.fn(),
    speedTestCounter: mockSpeedTestCounter,
    statsList: mockStatsList,
    calculateThePlaySpeedTestResult: jest.fn(),
    processUpdatedStatsForPlaySpeedTest: jest.fn()
  };
});

export default useSpeedTest; 