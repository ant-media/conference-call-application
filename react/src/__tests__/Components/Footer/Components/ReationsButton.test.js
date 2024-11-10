// src/ReactionsButton.test.js
import React from 'react';
import { render } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import ReactionsButton from 'Components/Footer/Components/ReactionsButton';

// Mock the context value
const contextValue = {
  showEmojis: true,
};

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

describe('Reactions Button Component', () => {

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
      <ReactionsButton />
    );
  });

});
