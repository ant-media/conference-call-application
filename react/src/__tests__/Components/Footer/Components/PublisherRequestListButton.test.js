// src/Components/Footer/Components/PublisherRequestListButton.test.js
import React from 'react';
import {act, render} from '@testing-library/react';
import PublisherRequestListButton from "../../../../Components/Footer/Components/PublisherRequestListButton";

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

describe('Publisher Request List Button Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });


  it('renders without crashing', () => {
    render(
        <PublisherRequestListButton
            footer={true}
            publisherRequestListDrawerOpen={true}
            handlePublisherRequestListOpen={jest.fn()}
            requestSpeakerList={[]}
        />
      );
  });

    it('check the button text', async () => {
      const fakeHandlePublisherRequestListOpen = jest.fn();
        const { container, getByTestId } = render(
            <PublisherRequestListButton
                footer={true}
                publisherRequestListDrawerOpen={true}
                handlePublisherRequestListOpen={fakeHandlePublisherRequestListOpen}
                requestSpeakerList={[]}
            />
        );

        // Click the button
        act(() => {
            getByTestId("publisher-request-list-button").click();
        });

        // Assert the function is called
        expect(fakeHandlePublisherRequestListOpen).toHaveBeenCalled();
    });
});
