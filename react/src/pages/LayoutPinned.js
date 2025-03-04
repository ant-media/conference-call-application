/* eslint-disable */
import VideoCard from "Components/Cards/VideoCard";
import OthersCard from "Components/Cards/OthersCard";
import React from "react";
import {isMobile} from "react-device-detect";
import TalkingIndicator from "../Components/TalkingIndicator";

function LayoutPinned (props) {

  const pinnedParticipant = props.videoTrackAssignments.find(e => e.streamId === props.pinnedParticipant?.streamId);

  let MAX_VIDEO_AT_SIDE = 4;

  let trackCount = Math.min(props.globals.desiredTileCount-1, MAX_VIDEO_AT_SIDE);

  const showOthers = Object.keys(props.allParticipants).length > trackCount + 1; //one video is pinned

  props.updateMaxVideoTrackCount(showOthers ? trackCount - 1 : trackCount);


  let playingParticipantsCount = 0;

  //if we need to show others card, then we don't show the last video to hold place for the others card. but should show you.
  const maxPlayingParticipantsCount = showOthers ? Math.max(2, trackCount) : Math.min(props.videoTrackAssignments.length, MAX_VIDEO_AT_SIDE);
  const playingParticipants = [];

  const pinnedVideo = () => {
    let pinnedParticipantName;
    if(pinnedParticipant !== undefined) {
      playingParticipants.push(props.videoTrackAssignments.find(e => e.streamId === pinnedParticipant.streamId));
      pinnedParticipantName = props?.allParticipants[pinnedParticipant.streamId]?.name;
    }
    /* istanbul ignore next */
    return (
      pinnedParticipant ? (
        <div className="single-video-container pinned keep-ratio">
          <div style={{position: "relative", width: "100%", height: "100%"}}>
            <TalkingIndicator
                trackAssignment={pinnedParticipant}
                isTalking={props?.isTalking}
                streamId={pinnedParticipant.streamId}
                talkers={props?.talkers}
                setAudioLevelListener={props?.setAudioLevelListener}
            />
            <VideoCard
              trackAssignment={pinnedParticipant}
              autoPlay
              name={
                pinnedParticipantName
              }
              pinned
              streamName={props?.streamName}
              isPublished={props?.isPublished}
              isPlayOnly={props?.isPlayOnly}
              isMyMicMuted={props?.isMyMicMuted}
              isMyCamTurnedOff={props?.isMyCamTurnedOff}
              allParticipants={props?.allParticipants}
              setParticipantIdMuted={(participant) => props?.setParticipantIdMuted(participant)}
              turnOnYourMicNotification={(streamId) =>props?.turnOnYourMicNotification(streamId)}
              turnOffYourMicNotification={(streamId) =>props?.turnOffYourMicNotification(streamId)}
              turnOffYourCamNotification={(streamId) =>props?.turnOffYourCamNotification(streamId)}
              pinVideo={(streamId)=>props?.pinVideo(streamId)}
              unpinVideo={props?.unpinVideo}
              isAdmin={props?.isAdmin}
              publishStreamId={props?.publishStreamId}
              localVideo={props?.localVideo}
              localVideoCreate={(tempLocalVideo) => props?.localVideoCreate(tempLocalVideo)}
            />
          </div>
        </div>
      ) : null
    )
  }

  const videoCards = (isMobileView) => {
    return (
      <>
      {
      // eslint-disable-next-line
      props.videoTrackAssignments.map((element, index) => {

        let isPlayOnly;

        try {
          isPlayOnly = JSON.parse(props?.allParticipants[element?.streamId]?.metaData)?.isPlayOnly;
        } catch (e) {
          isPlayOnly = false;
        }

        let participantName = props?.allParticipants[element?.streamId]?.name;

        if (participantName === "" || typeof participantName === 'undefined' || isPlayOnly || participantName === "Anonymous") {
          return null;
        }

        if(element?.streamId !== pinnedParticipant?.streamId && playingParticipantsCount < maxPlayingParticipantsCount) {
          playingParticipantsCount ++;
          playingParticipants.push(element);
          /* istanbul ignore next */
          return (
              <div className="unpinned" key={index}>
                <div className="single-video-container">
                  <div style={{position: "relative", width: "100%", height: "100%"}}>
                    <TalkingIndicator
                        trackAssignment={element}
                        isTalking={props?.isTalking}
                        streamId={element.streamId}
                        talkers={props?.talkers}
                        setAudioLevelListener={props?.setAudioLevelListener}
                    />
                    <VideoCard
                        isMobileView={isMobileView}
                        trackAssignment={element}
                        autoPlay
                        name={participantName}
                        streamName={props?.streamName}
                        isPublished={props?.isPublished}
                        isPlayOnly={props?.isPlayOnly}
                        isMyMicMuted={props?.isMyMicMuted}
                        isMyCamTurnedOff={props?.isMyCamTurnedOff}
                        allParticipants={props?.allParticipants}
                        setParticipantIdMuted={(participant) => props?.setParticipantIdMuted(participant)}
                        turnOnYourMicNotification={(streamId) =>props?.turnOnYourMicNotification(streamId)}
                        turnOffYourMicNotification={(streamId) =>props?.turnOffYourMicNotification(streamId)}
                        turnOffYourCamNotification={(streamId) =>props?.turnOffYourCamNotification(streamId)}
                        pinVideo={(streamId)=>props?.pinVideo(streamId)}
                        unpinVideo={props?.unpinVideo}
                        isAdmin={props?.isAdmin}
                        publishStreamId={props?.publishStreamId}
                        localVideo={props?.localVideo}
                        localVideoCreate={(tempLocalVideo) => props?.localVideoCreate(tempLocalVideo)}
                    />
                  </div>
                  </div>
                </div>
                );
                }
                })}
              </>
          );
        }

        const othersCard = () => {
          /* istanbul ignore next */
          return (
              <>
                {showOthers ? (
                    <div className="unpinned">
                      <div className="single-video-container  others-tile-wrapper">
                        <OthersCard
                            publishStreamId={props?.publishStreamId}
                            allParticipants={props?.allParticipants}
                            playingParticipants={playingParticipants}
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
            {props?.videoTrackAssignments.length === 0 ? <p>{process.env.REACT_APP_PLAY_ONLY_ROOM_EMPTY_MESSAGE}</p> : null}
            {videoCards(false)}
            {process.env.REACT_APP_LAYOUT_OTHERS_CARD_VISIBILITY === 'true' ? othersCard() : null}
          </div>
          : <><div id="unpinned-gallery">
            {props?.videoTrackAssignments.length === 0 ? <p>{process.env.REACT_APP_PLAY_ONLY_ROOM_EMPTY_MESSAGE}</p> : null}
            {process.env.REACT_APP_LAYOUT_OTHERS_CARD_VISIBILITY === 'true' ? othersCard() : null}
          </div>
            {videoCards(true)}
          </>}
    </>
  );
};

export default LayoutPinned;
