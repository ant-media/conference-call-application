// src/Button.test.js
import React from 'react';
import { render, fireEvent, queryByAttribute } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import MoreOptionsButton from 'Components/Footer/Components/MoreOptionsButton';
import { random } from 'lodash';
import { assert } from 'workbox-core/_private';

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

describe('ParticipantList Button Component', () => {
  
  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });
  

  it('renders without crashing', () => {
    render(
        <MoreOptionsButton
            isPlayOnly={false}
            isScreenShared={false}
            handleStartScreenShare={jest.fn()}
            handleStopScreenShare={jest.fn()}
            showEmojis={false}
            setShowEmojis={jest.fn()}
            messageDrawerOpen={false}
            toggleSetNumberOfUnreadMessages={jest.fn()}
            handleMessageDrawerOpen={jest.fn()}
            participantListDrawerOpen={false}
            handlePublisherRequestListOpen={jest.fn()}
            publisherRequestListDrawerOpen={false}
            handlePublisherRequest={jest.fn()}
            handleBackgroundReplacement={jest.fn()}
            microphoneSelected={jest.fn()}
            devices={[]}
            selectedCamera={'default'}
            cameraSelected={jest.fn()}
            selectedMicrophone={'default'}
            selectedBackgroundMode={'default'}
            setSelectedBackgroundMode={jest.fn()}
            videoSendResolution={'default'}
            setVideoSendResolution={jest.fn()}
            globals={{}}
            handleParticipantListOpen={jest.fn()}
        />
      );
  });

  it('click the button', () => {
    const { container, getByTestId } = render(
        <MoreOptionsButton
            isPlayOnly={false}
            isScreenShared={false}
            handleStartScreenShare={jest.fn()}
            handleStopScreenShare={jest.fn()}
            showEmojis={false}
            setShowEmojis={jest.fn()}
            messageDrawerOpen={false}
            toggleSetNumberOfUnreadMessages={jest.fn()}
            handleMessageDrawerOpen={jest.fn()}
            participantListDrawerOpen={false}
            handlePublisherRequestListOpen={jest.fn()}
            publisherRequestListDrawerOpen={false}
            handlePublisherRequest={jest.fn()}
            handleBackgroundReplacement={jest.fn()}
            microphoneSelected={jest.fn()}
            devices={[]}
            selectedCamera={'default'}
            cameraSelected={jest.fn()}
            selectedMicrophone={'default'}
            selectedBackgroundMode={'default'}
            setSelectedBackgroundMode={jest.fn()}
            videoSendResolution={'default'}
            setVideoSendResolution={jest.fn()}
            globals={{}}
            handleParticipantListOpen={jest.fn()}
        />
    );

    console.log(container.outerHTML);

    // eslint-disable-next-line testing-library/prefer-screen-queries
    const menuComponent = getByTestId('more-button-test');
    console.log(menuComponent);
    expect(menuComponent).toBeInTheDocument();
     
  });
});
