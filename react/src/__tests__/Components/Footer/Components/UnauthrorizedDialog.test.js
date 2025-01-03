// src/UnauthrorizedDialog.test.js
import React from 'react';
import { render } from '@testing-library/react';
import {UnauthrorizedDialog} from "../../../../Components/Footer/Components/UnauthorizedDialog";

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

describe('Unauthrorized Dialog Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });


  it('renders without crashing', () => {
    render(
      <UnauthrorizedDialog
          open={false}
          onClose={jest.fn()}
      />
    );
  });

});
