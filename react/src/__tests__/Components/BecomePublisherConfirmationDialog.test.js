// src/BecomePublisherConfirmationDialog.test.js
import React from 'react';
import { render } from '@testing-library/react';
import EffectsDrawer from "../../Components/EffectsDrawer";
import BecomePublisherConfirmationDialog from "../../Components/BecomePublisherConfirmationDialog";

// Mock the props
const props = {
}

describe('Become Publisher Confirmation Dialog Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });


  it('renders without crashing', () => {
    render(
      <BecomePublisherConfirmationDialog
          {...props}
      />
    );
  });

});
