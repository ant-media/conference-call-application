// src/EffectsDrawer.test.js
import React from 'react';
import { render } from '@testing-library/react';
import EffectsDrawer from "../../../../Components/EffectsDrawer";

// Mock the props
const props = {
  effectsDrawerOpen: false,
  setVirtualBackgroundImage: jest.fn(),
  handleBackgroundReplacement: jest.fn(),
  handleMessageDrawerOpen: jest.fn(),
  handleParticipantListOpen: jest.fn(),
  handleEffectsOpen: jest.fn(),
  setPublisherRequestListDrawerOpen: jest.fn(),
}

const mockOpfsRoot = {
  values: jest.fn(() => ({
    [Symbol.asyncIterator]: async function* () {
      yield { name: 'file1.txt' };
      yield { name: 'file2.txt' };
    },
  })),
};

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

describe('Camera Button Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();

    Object.defineProperty(navigator, 'storage', {
      value: {
        getDirectory: jest.fn().mockResolvedValue(mockOpfsRoot),
      },
      writable: true,
    });
  });


  it('renders without crashing', () => {
    render(
      <EffectsDrawer
          {...props}
      />
    );
  });

});
