// src/Components/Footer/Components/RequestPublishButton.test.js
import React from 'react';
import {act, render} from '@testing-library/react';
import PublisherRequestListButton from "../../../../Components/Footer/Components/PublisherRequestListButton";
import RequestPublishButton from "../../../../Components/Footer/Components/RequestPublishButton";

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

describe('Request Publish Button Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });


  it('renders without crashing', () => {
    render(
        <RequestPublishButton
            footer={true}
            rounded={false}
            handlePublisherRequest={jest.fn()}
        />
      );
  });

    it('check the button text', async () => {
      const fakeHandlePublisherRequest = jest.fn();
        const { container, getByTestId } = render(
            <RequestPublishButton
                footer={true}
                rounded={false}
                handlePublisherRequest={fakeHandlePublisherRequest}
            />
        );

        // Click the button
        act(() => {
            getByTestId("request-publish-button").click();
        });

        // Assert the function is called
        expect(fakeHandlePublisherRequest).toHaveBeenCalled();
    });
});
