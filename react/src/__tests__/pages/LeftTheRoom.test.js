// src/LeftTheRoom.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import theme from "styles/theme";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";
import LeftTheRoom from "../../pages/LeftTheRoom";

// Mock the context value
const contextValue = {
  allParticipants: {},
  videoTrackAssignments: [{id: 1, name: 'test'}],
  globals: {desiredTileCount: 10},
  handleLeaveFromRoom: jest.fn(),
};

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

describe('Left The Room Component', () => {
  
  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();

    React.useContext.mockImplementation(input => {
      if (input === ConferenceContext) {
        return contextValue;
      } 
      return jest.requireActual('react').useContext(input);
    });
  });
  

  it('renders without crashing', () => {
    const { container, getByText, getByRole } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
            <LeftTheRoom />
        </ThemeProvider>
      );

    console.log(container.outerHTML);
  });
});
