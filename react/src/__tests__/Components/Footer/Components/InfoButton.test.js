// src/InfoButton.test.js
import React from 'react';
import { render } from '@testing-library/react';
import InfoButton from "../../../../Components/Footer/Components/InfoButton";

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

describe('Info Button Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });


  it('renders without crashing', () => {
    render(
      <InfoButton
          isPlayOnly={false}
      />
    );
  });

});
