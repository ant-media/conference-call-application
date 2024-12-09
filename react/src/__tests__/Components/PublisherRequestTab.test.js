// src/PublisherRequestTab.test.js

import React from 'react';
import { render } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import PublisherRequestTab from "../../Components/PublisherRequestTab";
import theme from "../../styles/theme";
import {ThemeList} from "../../styles/themeList";
import {ThemeProvider} from "@mui/material";

const contextValue = {
    initialized: true,
    setLocalVideo: jest.fn(),
    localVideoCreate: jest.fn(),
    setIsJoining: jest.fn(),
    joinRoom: jest.fn(),
    localVideo: {},
    setSpeedTestObject: jest.fn(),
    makeId: jest.fn(),
    requestSpeakerList: [
        "test1",
        "test2",
    ],
    setRequestSpeakerList: jest.fn(),
    approveBecomeSpeakerRequest: jest.fn(),
    rejectBecomeSpeakerRequest: jest.fn(),
};

// Mock the useContext hook
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: jest.fn(),
}));

describe('Publisher Request Tab Component', () => {

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
        render(
            <ThemeProvider theme={theme(ThemeList.Green)}>
                <PublisherRequestTab />
            </ThemeProvider>
        );
    });

    it('renders the publisher request items', () => {
        const { getByText } = render(
            <ThemeProvider theme={theme(ThemeList.Green)}>
                <PublisherRequestTab />
            </ThemeProvider>
        );

        expect(getByText('test1')).toBeInTheDocument();
        expect(getByText('test2')).toBeInTheDocument();
    });

    it('calls the approveBecomeSpeakerRequest function when the allow button is clicked', () => {
        const { getByTestId } = render(
            <ThemeProvider theme={theme(ThemeList.Green)}>
                <PublisherRequestTab />
            </ThemeProvider>
        );

        getByTestId('approve-become-speaker-test1').click();
        expect(contextValue.approveBecomeSpeakerRequest).toHaveBeenCalledWith('test1');
    });

    it('calls the rejectBecomeSpeakerRequest function when the deny button is clicked', () => {
        const { getByTestId } = render(
            <ThemeProvider theme={theme(ThemeList.Green)}>
                <PublisherRequestTab />
            </ThemeProvider>
        );

        getByTestId('reject-become-speaker-test1').click();
        expect(contextValue.rejectBecomeSpeakerRequest).toHaveBeenCalledWith('test1');
    });

});
