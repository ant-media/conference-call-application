/* eslint-disable react-hooks/exhaustive-deps */
import VideoCard from "Components/Cards/VideoCard";
import OthersCard from "Components/Cards/OthersCard";
import React from "react";
import { ConferenceContext } from "./AntMedia";


function LayoutPinned (props) {
  const conference = React.useContext(ConferenceContext);

  const pinnedParticipant = conference.participants.find((v) => v.id === conference.pinnedVideoId)

  let MAX_VIDEO_AT_SIDE = 4;
  const showOthers = Object.keys(conference.allParticipants).length > MAX_VIDEO_AT_SIDE; 
  let playingParticipantsCount = 0;
  
  //if we need to show others card, then we don't show the last video to hold place for the others card
  const maxPlayingParticipantsCount = showOthers ? MAX_VIDEO_AT_SIDE - 1 : Math.min(conference.participants.length, MAX_VIDEO_AT_SIDE);
  const playingParticipants = [];

  const pinnedVideo = () => {
    if(pinnedParticipant !== undefined) {
      playingParticipants.push(conference.participants.find(e => e.id === pinnedParticipant.id));
    }
    return (
      pinnedParticipant ? (
        <div className="single-video-container pinned keep-ratio">
          <VideoCard
              id={pinnedParticipant?.id}
              streamId={pinnedParticipant.streamId}
              track={
                pinnedParticipant?.track
              }
              autoPlay
              name={
                pinnedParticipant?.name
              }
              pinned
              onHandlePin={() => {
                conference.pinVideo(
                  pinnedParticipant.id,
                  pinnedParticipant.videoLabel
                );
              }}
          />
        </div>
      ) : null
    )
  }

  const videoCards = () => {
    return (
      <>
      {
      // eslint-disable-next-line
      conference.participants.map((element, index) => {
        if(element !== pinnedParticipant && playingParticipantsCount < maxPlayingParticipantsCount) { 
          playingParticipantsCount ++;
          playingParticipants.push(element);
          return (
              <div className="unpinned" key={index}>
                <div className="single-video-container">
                  <VideoCard
                      id={element.id}
                      streamId={element.streamId}
                      track={element.track}
                      label={element.label}
                      autoPlay
                      name={element.name}
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
        <div className="unpinned">
        <div className="single-video-container  others-tile-wrapper">
        <OthersCard 
          playingParticipants = {playingParticipants}
        />
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      {pinnedVideo()}
      <div id="unpinned-gallery">
        {videoCards()}
        {othersCard()}
      </div>
    </>
  );
};

export default LayoutPinned;
