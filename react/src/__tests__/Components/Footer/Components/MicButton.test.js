// src/MicButton.test.js
import React from 'react';
import { render } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import MicButton from 'Components/Footer/Components/MicButton';

// Mock the context value
const contextValue = {
  microphoneButtonDisabled: true,
};

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

describe('Microphone Button Component', () => {

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
      <MicButton />
    );
  });

  it('check if microphone button disabled if no mic device available ', () => {

    contextValue.microphoneButtonDisabled = true;

    const { container, getByText, getByRole } = render(
      <MicButton />
    );

    console.log(container.outerHTML);

    const micButtonElement = getByRole("button");

    // Assert the button is disabled
    expect(micButtonElement).toBeDisabled();
  });

  it('check if microphone button enabled if mic devices are available ', () => {

    contextValue.microphoneButtonDisabled = false;

    const { container, getByText, getByRole } = render(
      <MicButton />
    );

    console.log(container.outerHTML);

    const micButtonElement = getByRole("button");

    // Assert the button is enabled
    expect(micButtonElement).not.toBeDisabled();
  });

});
