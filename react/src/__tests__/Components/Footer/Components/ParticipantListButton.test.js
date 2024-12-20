// src/Button.test.js
import React from 'react';
import {act, render} from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import ParticipantListButton from 'Components/Footer/Components/ParticipantListButton';
import { random } from 'lodash';

// Mock the context value
const contextValue = {
  allParticipants: {},
  participantCount: 0,
  setParticipantCount: jest.fn()
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
        <ParticipantListButton />
      );
  });

  it('check the count on button', async () => {
    var noOfParticipants = random(1, 10);

    await act(()=>
    {
      contextValue.setParticipantCount(noOfParticipants)
      contextValue.participantCount = noOfParticipants;
    });

    const { container, getByText, getByRole } = render(
        <ParticipantListButton />
    );

      console.log(container.outerHTML);

    // eslint-disable-next-line testing-library/no-node-access
      const aElement = getByRole("button").querySelector('a');

      // Assert the value inside the <a> tag
      expect(aElement.textContent).toBe(''+noOfParticipants);
  });
});
