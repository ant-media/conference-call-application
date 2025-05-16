// src/FakeParticipantButton.test.js
import React from 'react';
import { render } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import FakeParticipantButton from "../../../../Components/Footer/Components/FakeParticipantButton";

// Mock the context value
const contextValue = {
  setLeftTheRoom: jest.fn(),
};

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

describe('Fake Participant Button Component', () => {

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
      <FakeParticipantButton />
    );
  });

});
