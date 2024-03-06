// src/Button.test.js
import React from 'react';
import { render, fireEvent, queryByAttribute } from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import MoreOptionsButton from 'Components/Footer/Components/MoreOptionsButton';
import { random } from 'lodash';
import { assert } from 'workbox-core/_private';

// Mock the context value
const contextValue = {
  allParticipants: {},
  globals:{maxVideoTrackCount: 5},
};

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

describe('ParticipantList Button Component', () => {
  
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
        <MoreOptionsButton />
      );
  });

  it('click the button', () => {
    const { container, getByTestId } = render(
        <MoreOptionsButton />
    );

    console.log(container.outerHTML);

    const menuComponent = getByTestId('more-button-test');
    console.log(menuComponent);
    expect(menuComponent).toBeInTheDocument();
     
  });
});
