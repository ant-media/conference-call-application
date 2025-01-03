// src/ReactionsButton.test.js
import React from 'react';
import { render } from '@testing-library/react';
import ReactionsButton from "../../../../Components/Footer/Components/ReactionsButton";

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

describe('Reactions Button Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });


  it('renders without crashing', () => {
    render(
      <ReactionsButton
          rounded={false}
          footer={true}
          showEmojis={false}
          setShowEmojis = {jest.fn()}
      />
    );
  });

});
