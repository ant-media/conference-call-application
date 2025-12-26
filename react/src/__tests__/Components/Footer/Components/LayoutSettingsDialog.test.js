// src/Components/Footer/Components/LayoutSettingsDialog.test.js
import React from 'react';
import {render} from '@testing-library/react';
import {LayoutSettingsDialog} from "../../../../Components/Footer/Components/LayoutSettingsDialog";

// Mock the useContext hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
}));

describe('Layout Settings Dialog Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });


  it('renders without crashing', () => {
    render(
        <LayoutSettingsDialog
            open={true}
            onClose={jest.fn()}
            globals={{
              maxVideoTrackCount: 6,
              desiredTileCount: 6,
              trackEvents: [],
            }}
            allParticipants={{
                "participant-1": {
                role: "host",
                participantID: "participant-1",
                streamID: "stream-1",
                videoTrack: "video-track-1",
                audioTrack: "audio-track-1",
                videoLabel: "label-1",
            },
            }}
            pinVideo={jest.fn()}
            handleSetDesiredTileCount={jest.fn()}
        />
      );
  });
});
