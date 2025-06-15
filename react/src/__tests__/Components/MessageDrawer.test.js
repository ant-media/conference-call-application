// src/MessageDrawer.test.js
import React from 'react';
import { render } from '@testing-library/react';
import EffectsDrawer from "../../Components/EffectsDrawer";
import BecomePublisherConfirmationDialog from "../../Components/BecomePublisherConfirmationDialog";
import MessageDrawer from "../../Components/MessageDrawer";

// Mock the props
const props = {
  handleMessageDrawerOpen: jest.fn(),
  handleParticipantListOpen: jest.fn(),
  handleEffectsOpen: jest.fn(),
  setPublisherRequestListDrawerOpen: jest.fn(),
  messages: [],
  sendMessage: jest.fn(),
  handleSetMessages: jest.fn(),
}

describe('Message Drawer Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });


  it('renders without crashing', () => {
    render(
      <MessageDrawer
          {...props}
      />
    );
  });

});
