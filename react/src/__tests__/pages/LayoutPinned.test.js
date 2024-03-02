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
import { assert } from 'workbox-core/_private';

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
            <LayoutPinned />
        </ThemeProvider>
      );

    console.log(container.outerHTML);
  });

  it('test other cards not visible until limit', () => {
    process.env.REACT_APP_LAYOUT_OTHERS_CARD_VISIBILITY = true;
    var noOfParticipants = 4;

    for (let i = 0; i < noOfParticipants; i++) {
      contextValue.allParticipants[`p${i}`] = {id: i, name: `test${i}`};
      contextValue.participants.push({id: i, name: `test${i}`});
    }

    contextValue.pipinnedVideoId = 1;

    const { container, getAllByTestId, queryByTestId  } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
            <LayoutPinned />
        </ThemeProvider>
      );

    const videoCards = getAllByTestId('mocked-video-card');
    expect(videoCards).toHaveLength(4);

    const otherCard = queryByTestId('mocked-others-card');
    expect(otherCard).toBeNull();

    console.log(container.outerHTML);
  });

  it('test show other cards after limit', () => {
    process.env.REACT_APP_LAYOUT_OTHERS_CARD_VISIBILITY = true;
    var noOfParticipants = 10;

    for (let i = 0; i < noOfParticipants; i++) {
      contextValue.allParticipants[`p${i}`] = {id: i, name: `test${i}`};
      contextValue.participants.push({id: i, name: `test${i}`});
    }

    contextValue.pipinnedVideoId = 1;

    const { container, getAllByTestId, getByTestId  } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
            <LayoutPinned />
        </ThemeProvider>
      );

    const videoCards = getAllByTestId('mocked-video-card');
    expect(videoCards).toHaveLength(3);

    const otherCard = getByTestId('mocked-others-card');
    expect(otherCard).toBeTruthy();

    console.log(container.outerHTML);
  });
});
