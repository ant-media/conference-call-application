/* eslint-disable react-hooks/exhaustive-deps */
import VideoCard from "Components/Cards/VideoCard";
import OthersCard from "Components/Cards/OthersCard";
import React from "react";
import { ConferenceContext } from "./AntMedia";
import {isMobile} from "react-device-detect";


function LayoutPinned (props) {
  const conference = React.useContext(ConferenceContext);

  const pinnedParticipant = conference.videoTrackAssignments.find(e => e.streamId === props.pinnedParticipant?.streamId);

  let MAX_VIDEO_AT_SIDE = 4;

  let trackCount = Math.min(conference.globals.desiredMaxVideoTrackCount-1, MAX_VIDEO_AT_SIDE);

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
      pinnedParticipant ? (
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
    return (
      <>
      {
      // eslint-disable-next-line
      conference.videoTrackAssignments.map((element, index) => {

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
      { (!isMobile) ?
          <div id="unpinned-gallery">
            {conference?.videoTrackAssignments.length === 0 ? <p>There is no active publisher right now.</p> : null}
            {videoCards(false)}
            {process.env.REACT_APP_LAYOUT_OTHERS_CARD_VISIBILITY === 'true' ? othersCard() : null}
          </div>
          : <><div id="unpinned-gallery">
            {conference?.videoTrackAssignments.length === 0 ? <p>There is no active publisher right now.</p> : null}
            {process.env.REACT_APP_LAYOUT_OTHERS_CARD_VISIBILITY === 'true' ? othersCard() : null}
          </div>
            {videoCards(true)}
          </>}
    </>
  );
};

export default LayoutPinned;
