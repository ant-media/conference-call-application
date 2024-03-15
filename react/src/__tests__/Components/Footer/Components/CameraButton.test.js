// src/CameraButton.test.js
import React from 'react';
import { render } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import CameraButton from 'Components/Footer/Components/CameraButton';

// Mock the context value
const contextValue = {
  cameraButtonDisabled: true,
};

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

describe('Camera Button Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();

    React.useContext.mockImplementation(input => {
      if (input === ConferenceContext) {
        return contextValue;
      }
      return jest.requireActual('react').useContext(input);
    });
  });


  it('renders without crashing', () => {
    render(
      <CameraButton />
    );
  });

  it('check if camera button disabled if no cam available ', () => {

    contextValue.cameraButtonDisabled = true;

    const { container, getByText, getByRole } = render(
      <CameraButton />
    );

    console.log(container.outerHTML);

    const camButtonElement = getByRole("button");

    // Assert the button is disabled
    expect(camButtonElement).toBeDisabled();
  });

  it('check if camera button enabled if cam devices are available ', () => {

    contextValue.cameraButtonDisabled = false;

    const { container, getByText, getByRole } = render(
      <CameraButton />
    );

    console.log(container.outerHTML);

    const camButtonElement = getByRole("button");

    // Assert the button is enabled
    expect(camButtonElement).not.toBeDisabled();
  });

});
