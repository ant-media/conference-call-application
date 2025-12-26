// src/ShareScreenButton.test.js
import React from 'react';
import { render } from '@testing-library/react';
import ShareScreenButton from "../../../../Components/Footer/Components/ShareScreenButton";

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

describe('Share Screen Button Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });


  it('renders without crashing', () => {
    render(
      <ShareScreenButton
          footer={true}
          isScreenShared={false}
          handleStartScreenShare={jest.fn()}
          handleStopScreenShare={jest.fn()}
      />
    );
  });

});
