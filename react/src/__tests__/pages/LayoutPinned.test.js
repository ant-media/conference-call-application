// src/Button.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import LayoutPinned from 'pages/LayoutPinned';
import { random } from 'lodash';
import theme from "styles/theme";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";
import VideoCard from 'Components/Cards/VideoCard';

// Mock the context value
const contextValue = {
  allParticipants: {},
  participants: [{id: 1, name: 'test'}],
};

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

jest.mock('Components/Cards/VideoCard', () => ({ value }) => <div data-testid="mocked-child">{value}</div>);


describe('Pinned Layout Component', () => {
  
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
            <LayoutPinned />
        </ThemeProvider>
      );

    console.log(container.outerHTML);
  });
});
