// src/PublisherRequestTab.test.js

import React from 'react';
import { render } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import PublisherRequestTab from "../../Components/PublisherRequestTab";

const contextValue = {
    initialized: true,
    setLocalVideo: jest.fn(),
    localVideoCreate: jest.fn(),
    setIsJoining: jest.fn(),
    joinRoom: jest.fn(),
    localVideo: {},
    setSpeedTestObject: jest.fn(),
    makeId: jest.fn(),
    requestSpeakerList: [],
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
            <PublisherRequestTab />
        );
    });

});
