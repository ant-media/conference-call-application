// src/FakeParticipantButton.test.js
import React from 'react';
import { render } from '@testing-library/react';
import FakeParticipantButton from "../../../../Components/Footer/Components/FakeParticipantButton";

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

describe('Fake Participant Button Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });


  it('renders without crashing', () => {
    render(
      <FakeParticipantButton
          increment={false}
          onAction={jest.fn()}
      />
    );
  });

});
