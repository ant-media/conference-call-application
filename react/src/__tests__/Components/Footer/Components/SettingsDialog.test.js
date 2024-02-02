import { render, fireEvent } from '@testing-library/react';
import { SettingsDialog } from "Components/Footer/Components/SettingsDialog";
import React from 'react';

// Mock the useContext hook for ConferenceContext
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

// Mock the ConferenceContext
jest.mock('pages/AntMedia', () => ({
  ConferenceContext: {
    Provider: ({ children }) => <div>{children}</div>,
    Consumer: ({ children }) => children({
      devices: [
        { kind: 'videoinput', deviceId: 'videoDeviceId', label: 'Video Device' },
        { kind: 'audioinput', deviceId: 'audioDeviceId', label: 'Audio Device' },
      ],
      selectedCamera: 'videoDeviceId',
      selectedMicrophone: 'audioDeviceId',
      selectedBackgroundMode: 'none',
      cameraSelected: jest.fn(),
      microphoneSelected: jest.fn(),
      setSelectedBackgroundMode: jest.fn(),
      handleBackgroundReplacement: jest.fn(),
      setVideoSendResolution: jest.fn(),
      videoSendResolution: 'auto',
    }),
  },
}));

jest.spyOn(document, 'getElementById').mockReturnValue({
  getAttribute: jest.fn(() => 'mockedWebSocketURL'),
});

describe('test SettingsDialog', () => {
  it('change camera', () => {
    // Mock the return value for useContext to provide the mocked context
    const mockContextValue = {
      devices: [
        { kind: 'videoinput', deviceId: 'videoDeviceId', label: 'Video Device' },
        { kind: 'audioinput', deviceId: 'audioDeviceId', label: 'Audio Device' },
      ],
      selectedCamera: 'videoDeviceId',
      selectedMicrophone: 'audioDeviceId',
      selectedBackgroundMode: 'none',
      cameraSelected: jest.fn(),
      microphoneSelected: jest.fn(),
      setSelectedBackgroundMode: jest.fn(),
      handleBackgroundReplacement: jest.fn(),
      setVideoSendResolution: jest.fn(),
      videoSendResolution: 'auto',
    };

    // Set the mocked context value for the specific context
    jest.requireMock('react').useContext.mockReturnValueOnce(mockContextValue);

    const onCloseMock = jest.fn();
    const component = render(<SettingsDialog open={true} onClose={onCloseMock} />);

    // Your test logic here...
  });
});
