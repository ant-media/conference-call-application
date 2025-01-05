// src/Button.test.js
import React from 'react';
import {act, render} from '@testing-library/react';
import { ConferenceContext } from 'pages/AntMedia';
import ParticipantListButton from 'Components/Footer/Components/ParticipantListButton';
import { random } from 'lodash';

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
        <ParticipantListButton
            participantCount={0}
            participantListDrawerOpen={false}
            handleParticipantListOpen={jest.fn()}
        />
      );
  });

  it('check the count on button', async () => {
    var noOfParticipants = random(1, 10);

    const { container, getByText, getByRole } = render(
        <ParticipantListButton
            participantCount={noOfParticipants}
            participantListDrawerOpen={false}
            handleParticipantListOpen={jest.fn()}
        />
    );

      console.log(container.outerHTML);

    // eslint-disable-next-line testing-library/no-node-access
      const aElement = getByRole("button").querySelector('a');

      // Assert the value inside the <a> tag
      expect(aElement.textContent).toBe(''+noOfParticipants);
  });
});
