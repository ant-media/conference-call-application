// src/Components/Footer/Components/FakeReconnectButton.test.js
import React from 'react';
import {act, render} from '@testing-library/react';
import FakeReconnectButton from "../../../../Components/Footer/Components/FakeReconnectButton";

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

describe('Fake Reconnect Button Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });


  it('renders without crashing', () => {
    render(
        <FakeReconnectButton
            footer={true}
            onFakeReconnect={jest.fn()}
        />
      );
  });

    it('check the button text', async () => {
      const fakeReconnect = jest.fn();
        const { container, getByTestId } = render(
            <FakeReconnectButton
                footer={true}
                onFakeReconnect={fakeReconnect}
            />
        );

        // Click the button
        act(() => {
            getByTestId("fake-reconnect-button").click();
        });

        // Assert the function is called
        expect(fakeReconnect).toHaveBeenCalled();
    });
});
