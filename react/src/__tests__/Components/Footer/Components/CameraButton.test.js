// src/CameraButton.test.js
import React from 'react';
import { render } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import CameraButton from 'Components/Footer/Components/CameraButton';
import {useSnackbar} from 'notistack';

jest.mock('notistack', () => ({
  ...jest.requireActual('notistack'),
  useSnackbar: jest.fn(),
  SnackbarProvider: ({ children }) => <div></div>,
}));

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

const enqueueSnackbar = jest.fn();

describe('Camera Button Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();

    useSnackbar.mockImplementation(() => ({
      enqueueSnackbar: enqueueSnackbar,
      closeSnackbar: jest.fn(),
    }));
  });


  it('renders without crashing', () => {
    render(
      <CameraButton
          cameraButtonDisabled={true}
          isCamTurnedOff={true}
          onTurnOffCamera={jest.fn()}
          onTurnOnCamera= {jest.fn()}
      />
    );
  });

  it('test handleCameraToggle with camera is off', () => {
    let mockOnTurnOffCamera = jest.fn();
    let mockOnTurnOnCamera = jest.fn();

    const { getByTestId } = render(
        <CameraButton
            cameraButtonDisabled={false}
            isCamTurnedOff={false}
            onTurnOffCamera={mockOnTurnOffCamera}
            onTurnOnCamera= {mockOnTurnOnCamera}
        />
    );

    let cameraButton = getByTestId("camera-button");
    cameraButton.click();

    expect(mockOnTurnOffCamera).toHaveBeenCalled();

  });

  it('test handleCameraToggle with camera is on', () => {
    let mockOnTurnOffCamera = jest.fn();
    let mockOnTurnOnCamera = jest.fn();

    const { getByTestId } = render(
        <CameraButton
            cameraButtonDisabled={false}
            isCamTurnedOff={true}
            onTurnOffCamera={mockOnTurnOffCamera}
            onTurnOnCamera= {mockOnTurnOnCamera}
        />
    );

    let cameraButton = getByTestId("camera-button");
    cameraButton.click();

    expect(mockOnTurnOnCamera).toHaveBeenCalled();

  });

  it('check if camera button disabled if no cam available ', () => {
    const { container, getByText, getByRole } = render(
      <CameraButton
          cameraButtonDisabled={true}
          isCamTurnedOff={true}
          onTurnOffCamera={jest.fn()}
          onTurnOnCamera= {jest.fn()}
      />
    );

    console.log(container.outerHTML);

    const camButtonElement = getByRole("button");

    // Assert the button is disabled
    expect(camButtonElement).toBeDisabled();
  });

  it('check if camera button enabled if cam devices are available ', () => {
    const { container, getByText, getByRole } = render(
      <CameraButton
          cameraButtonDisabled={false}
          isCamTurnedOff={true}
          onTurnOffCamera={jest.fn()}
          onTurnOnCamera= {jest.fn()}
      />
    );

    console.log(container.outerHTML);

    const camButtonElement = getByRole("button");

    // Assert the button is enabled
    expect(camButtonElement).not.toBeDisabled();
  });

});
