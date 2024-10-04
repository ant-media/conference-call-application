// src/Button.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import LayoutTiled from 'pages/LayoutTiled';
import { random } from 'lodash';
import theme from "styles/theme";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";
import VideoCard from 'Components/Cards/VideoCard';
import { assert } from 'workbox-core/_private';

// Mock the context value
const contextValue = {
  allParticipants: {},
  videoTrackAssignments: [{id: 1, name: 'test'}],
  globals: {desiredMaxVideoTrackCount: 10},
  updateMaxVideoTrackCount: jest.fn(),
};

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

jest.mock('Components/Cards/VideoCard', () => ({ value }) => <div data-testid="mocked-video-card">{value}</div>);
jest.mock('Components/Cards/OthersCard', () => ({ value }) => <div data-testid="mocked-others-card">{value}</div>);


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
            <LayoutTiled />
        </ThemeProvider>
      );

    console.log(container.outerHTML);
  });

  
  it('set the max video count', () => {
    process.env.REACT_APP_LAYOUT_OTHERS_CARD_VISIBILITY = true;

    const { container, getAllByTestId, getByTestId  } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
            <LayoutTiled />
        </ThemeProvider>
      );

      expect(contextValue.updateMaxVideoTrackCount).toHaveBeenCalledWith(9);

  });
});
