// src/DrawerButton.test.js
import React from 'react';
import { render } from '@testing-library/react';
import EffectsDrawer from "../../Components/EffectsDrawer";
import BecomePublisherConfirmationDialog from "../../Components/BecomePublisherConfirmationDialog";
import DrawerButton from "../../Components/DrawerButton";

// Mock the props
const props = {
  handleMessageDrawerOpen: jest.fn(),
  handleParticipantListOpen: jest.fn(),
  handleEffectsOpen: jest.fn(),
  setPublisherRequestListDrawerOpen: jest.fn(),
}

describe('Drawer Button Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });


  it('renders without crashing', () => {
    render(
      <DrawerButton
          {...props}
      />
    );
  });

});
