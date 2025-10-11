/* eslint-disable react-hooks/exhaustive-deps */
import VideoCard from "Components/Cards/VideoCard";
import OthersCard from "Components/Cards/OthersCard";
import React from "react";
import { ConferenceContext } from "./AntMedia";

function LayoutPinned (props) {
  const conference = React.useContext(ConferenceContext);

  const pinnedParticipant = conference.videoTrackAssignments.find(e => e.streamId === props.pinnedParticipant?.streamId);

  let MAX_VIDEO_AT_SIDE = 4;

  let trackCount = Math.min(conference.globals.desiredTileCount-1, MAX_VIDEO_AT_SIDE);

  const showOthers = Object.keys(conference.allParticipants).length > trackCount + 1; //one video is pinned

  conference.updateMaxVideoTrackCount(showOthers ? trackCount - 1 : trackCount);


  let playingParticipantsCount = 0;

  //if we need to show others card, then we don't show the last video to hold place for the others card. but should show you.
  const maxPlayingParticipantsCount = showOthers ? Math.max(2, trackCount) : Math.min(conference.videoTrackAssignments.length, MAX_VIDEO_AT_SIDE);
  const playingParticipants = [];

  const pinnedVideo = () => {
    let pinnedParticipantName;
    if(pinnedParticipant !== undefined) {
      playingParticipants.push(conference.videoTrackAssignments.find(e => e.streamId === pinnedParticipant.streamId));
      pinnedParticipantName = conference?.allParticipants[pinnedParticipant.streamId]?.name;
    }
    return (
      pinnedParticipant && pinnedParticipant.trackId ? (
        <div className="single-video-container pinned keep-ratio">
          <VideoCard
            trackAssignment={pinnedParticipant}
              autoPlay
              name={
                pinnedParticipantName
              }
              pinned
              onHandlePin={() => {
                conference.pinVideo(
                  pinnedParticipant.streamId
                );
              }}
          />
        </div>
      ) : null
    )
  }

  const videoCards = (isMobileView) => {
    const pinnedParticipantName = conference?.allParticipants[pinnedParticipant?.streamId]?.name;
    const sortSharingStreamToTop = (a, b) => {
      const participantA = conference.allParticipants[a.streamId];
      const participantB = conference.allParticipants[b.streamId];

      // if participant info is not available, don't change order
      if (!participantA || !participantB) {
        return 0;
      }

      const pinnedParticipantDetails = conference.allParticipants[pinnedParticipant?.streamId];

      // Check if the pinned participant is sharing their screen.
      if (pinnedParticipantDetails?.isScreenShared) {
        // The screen share streamId is usually in the format {base_stream_id}_presentation.
        const screenSharerBaseStreamId = pinnedParticipant.streamId.replace('_presentation', '');

        // We want to move the screen sharer's main video feed to the top of the unpinned participants.
        if (participantA.streamId === screenSharerBaseStreamId) {
          return -1; // a should be sorted before b
        }
        if (participantB.streamId === screenSharerBaseStreamId) {
          return 1; // b should be sorted before a
        }
      }

      // For other cases, sort alphabetically by name for a consistent order.
      if (participantA.name < participantB.name) {
        return -1;
      }
      if (participantA.name > participantB.name) {
        return 1;
      }

      return 0;
    }
    return (
      <>
      {
      // eslint-disable-next-line
      conference.videoTrackAssignments.sort(sortSharingStreamToTop).filter(element => element.trackId).map((element, index) => {

        let isPlayOnly;

        try {
          isPlayOnly = JSON.parse(conference?.allParticipants[element?.streamId]?.metaData)?.isPlayOnly;
        } catch (e) {
          isPlayOnly = false;
        }

        let participantName = conference?.allParticipants[element?.streamId]?.name;

        if (participantName === "" || typeof participantName === 'undefined' || isPlayOnly || participantName === "Anonymous") {
          return null;
        }

        if(element?.streamId !== pinnedParticipant?.streamId && playingParticipantsCount < maxPlayingParticipantsCount) {
          playingParticipantsCount ++;
          playingParticipants.push(element);
          return (
              <div className="unpinned" key={index}>
                <div className="single-video-container">
                  <VideoCard
                      isMobileView={isMobileView}
                    trackAssignment={element}
                      autoPlay
                      name={participantName}
                  />
                </div>
              </div>
          );
        }
      })}
      </>
    );
  }

  const othersCard = () => {
    return (
      <>
      {showOthers ? (
        <div className="unpinned">
        <div className="single-video-container  others-tile-wrapper">
        <OthersCard
          playingParticipants = {playingParticipants}
        />
        </div>
      </div>
        ) : null
      }
      </>
    );
  }

  return (
    <>
      {pinnedVideo()}
      { (!props?.isMobile) ?
          <div id="unpinned-gallery">
            {conference?.videoTrackAssignments.length === 0 ? <p>{process.env.REACT_APP_PLAY_ONLY_ROOM_EMPTY_MESSAGE}</p> : null}
            {videoCards(false)}
            {process.env.REACT_APP_LAYOUT_OTHERS_CARD_VISIBILITY === 'true' ? othersCard() : null}
          </div>
          : <><div id="unpinned-gallery">
            {conference?.videoTrackAssignments.length === 0 ? <p>{process.env.REACT_APP_PLAY_ONLY_ROOM_EMPTY_MESSAGE}</p> : null}
            {process.env.REACT_APP_LAYOUT_OTHERS_CARD_VISIBILITY === 'true' ? othersCard() : null}
          </div>
            {videoCards(true)}
          </>}
    </>
  );
};

export default LayoutPinned;
