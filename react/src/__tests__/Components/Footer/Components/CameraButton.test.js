// src/CameraButton.test.js
import React from 'react';
import { render } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import CameraButton from 'Components/Footer/Components/CameraButton';

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

describe('Camera Button Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
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
