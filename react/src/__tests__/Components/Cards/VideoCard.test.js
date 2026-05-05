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

  it('applies mirror transform when isMine and mirrorCamera is true', () => {
    const trackAssignment = {
      videoLabel: "localVideo",
      track: null,
      streamId: "localVideo",
      isMine: true
    };

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <VideoCard
              trackAssignment={trackAssignment}
              autoPlay
              name={"TestUser"}
              streamName={"streamName"}
              isPublished={true}
              isPlayOnly={false}
              isMyMicMuted={false}
              isMyCamTurnedOff={false}
              allParticipants={{}}
              setParticipantIdMuted={jest.fn()}
              turnOnYourMicNotification={jest.fn()}
              turnOffYourMicNotification={jest.fn()}
              turnOffYourCamNotification={jest.fn()}
              pinVideo={jest.fn()}
              isAdmin={false}
              publishStreamId={"localVideo"}
              localVideo={null}
              localVideoCreate={jest.fn()}
              mirrorCamera={true}
          />
        </ThemeProvider>
    );

    const videoContainer = container.querySelector('.single-video-card > div');
    expect(videoContainer.style.transform).toBe('rotateY(180deg)');
  });

  it('does not apply mirror transform when isMine and mirrorCamera is false', () => {
    const trackAssignment = {
      videoLabel: "localVideo",
      track: null,
      streamId: "localVideo",
      isMine: true
    };

    const { container } = render(
        <ThemeProvider theme={theme(ThemeList.Green)}>
          <VideoCard
              trackAssignment={trackAssignment}
              autoPlay
              name={"TestUser"}
              streamName={"streamName"}
              isPublished={true}
              isPlayOnly={false}
              isMyMicMuted={false}
              isMyCamTurnedOff={false}
              allParticipants={{}}
              setParticipantIdMuted={jest.fn()}
              turnOnYourMicNotification={jest.fn()}
              turnOffYourMicNotification={jest.fn()}
              turnOffYourCamNotification={jest.fn()}
              pinVideo={jest.fn()}
              isAdmin={false}
              publishStreamId={"localVideo"}
              localVideo={null}
              localVideoCreate={jest.fn()}
              mirrorCamera={false}
          />
        </ThemeProvider>
    );

    const videoContainer = container.querySelector('.single-video-card > div');
    expect(videoContainer.style.transform).toBe('none');
  });

});
