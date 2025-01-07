// src/RoomCreationPasswordDialog.test.js
import React from 'react';
import { render } from '@testing-library/react';
import {RoomCreationPasswordDialog} from "../../../../Components/Footer/Components/RoomCreationPasswordDialog";

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

describe('Room Creation Password Dialog Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });


  it('renders without crashing', () => {
    render(
      <RoomCreationPasswordDialog
          onClose={jest.fn()}
          password={"pasword"}
          onPasswordChange={jest.fn()}
          open={true}
          onCreateRoomClicked={jest.fn()}
      />
    );
  });

});
