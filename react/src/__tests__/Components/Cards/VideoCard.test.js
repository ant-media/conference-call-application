import React from 'react';
import { render } from '@testing-library/react';
import theme from "styles/theme";
import { ThemeProvider } from '@mui/material/styles';
import {ThemeList} from "styles/themeList";
import VideoCard from "../../../Components/Cards/VideoCard";

describe('VideoCard Component', () => {

  beforeEach(() => {
    // Reset the mock implementation before each test
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <VideoCard
              key={1}
              trackAssignment={[]}
              autoPlay
              name={""}
              style={{display: "none"}}
              streamName={"streamName"}
              isPublished={true}
              isPlayOnly={false}
              isMyMicMuted={false}
              isMyCamTurnedOff={false}
              allParticipants={{participantId: {name: "name"}}}
              setParticipantIdMuted={jest.fn()}
              turnOnYourMicNotification={jest.fn()}
              turnOffYourMicNotification={jest.fn()}
              turnOffYourCamNotification={jest.fn()}
              pinVideo={jest.fn()}
              isAdmin={true}
              publishStreamId={"publishStreamId"}
              localVideo={null}
              localVideoCreate={jest.fn()}
          />
        </ThemeProvider>
    );
  });

});
