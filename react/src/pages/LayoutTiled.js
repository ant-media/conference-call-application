/* eslint-disable */
import VideoCard from "Components/Cards/VideoCard";
import OthersCard from "Components/Cards/OthersCard";
import React from "react";
import TalkingIndicator from "../Components/TalkingIndicator";

function calculateLayout(
  containerWidth,
  containerHeight,
  videoCount,
  aspectRatio
) {
  let bestLayout = {
    area: 0,
    cols: 0,
    rows: 0,
    width: 0,
    height: 0,
  };
  // brute-force search layout where video occupy the largest area of the container
  for (let cols = 1; cols <= videoCount; cols++) {
    const rows = Math.ceil(videoCount / cols);
    const hScale = containerWidth / (cols * aspectRatio);
    const vScale = containerHeight / rows;
    let width;
    let height;
    if (hScale <= vScale) {
      width = Math.floor(containerWidth / cols);
      height = Math.floor(width / aspectRatio);
    } else {
      height = Math.floor(containerHeight / rows);
      width = Math.floor(height * aspectRatio);
    }
    const area = width * height;
    if (area > bestLayout.area) {
      bestLayout = {
        area,
        width,
        height,
        rows,
        cols,
      };
    }
  }
  return bestLayout;
}

function LayoutTiled(props) {

  const aspectRatio = 16 / 9;
  const [cardWidth, setCardWidth] = React.useState(500*aspectRatio);
  const [cardHeight, setCardHeight] = React.useState(500);

  React.useEffect(() => {
    const videoCount = props?.videoTrackAssignments.length+1


    const {width, height} = calculateLayout(
        props.width,
        props.height,
        videoCount,
        aspectRatio
    );

    setCardWidth(width - 8);
    setCardHeight(height - 8);

    //console.log("***** W:"+cardWidth+" H:"+cardHeight+" props.width:"+props.width+" width:"+width+" cols:"+cols+" vc:"+videoCount);
  }, [props?.videoTrackAssignments, props.width, props.height, props?.participantUpdated]);

  const showOthers = Object.keys(props?.allParticipants).length > props?.globals.desiredTileCount;
  let trackCount = props?.globals.desiredTileCount - 1; //remove you
  props?.updateMaxVideoTrackCount(showOthers ? trackCount - 1 : trackCount); //remove others if we show

  const playingParticipantsCount = props?.videoTrackAssignments.length;
  const playingParticipants = props?.videoTrackAssignments.slice(0, playingParticipantsCount);

  const videoCards = () => {
    return (
      <>
        {
          playingParticipants.map((element, index) => {
            let isPlayOnly
            try {
              isPlayOnly = JSON.parse(props?.allParticipants[element?.streamId]?.metaData)?.isPlayOnly;
            } catch (e) {
              isPlayOnly = false;
            }

            let participantName = props?.allParticipants[element?.streamId]?.name;

            if (participantName === "" || typeof participantName === 'undefined' || isPlayOnly || participantName === "Anonymous") {
              return null;
            }

            //console.log("cw:"+cardWidth+" ch:"+cardHeight);
            /* istanbul ignore next */
            return (
              <div
                  className="single-video-container not-pinned"
                  key={index}
                  style={{
                    width: cardWidth + "px",
                    height: cardHeight + "px",
                  }}
              >
                <div style={{position: "relative", width: "100%", height: "100%"}}>
                  <TalkingIndicator
                      trackAssignment={element}
                      isTalking={props?.isTalking}
                      streamId={element.streamId}
                      talkers={props?.talkers}
                      setAudioLevelListener={props?.setAudioLevelListener}
                  />
                  <VideoCard
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
                      pinVideo={props?.pinVideo}
                      isAdmin={props?.isAdmin}
                      publishStreamId={props?.publishStreamId}
                      localVideo={props?.localVideo}
                      localVideoCreate={(tempLocalVideo) => props?.localVideoCreate(tempLocalVideo)}
                  />
                </div>
              </div>
              )
          })
        }
      </>
    );
  }

  const othersCard = () => {
    return (
      <>
        {showOthers ? (
              <div
                  className="single-video-container not-pinned others-tile-wrapper"
                  style={{
                    width: cardWidth + "px",
                    height: cardHeight + "px",
                    maxWidth: cardWidth + "px",
                  }}
              >
                <OthersCard
                    publishStreamId={props?.publishStreamId}
                    allParticipants={props?.allParticipants}
                    playingParticipants = {playingParticipants}
                />
              </div>
            ) : null
        }
      </>
    );
  }

  return (
      <>
        {props?.videoTrackAssignments.length === 0 ? <p>{process.env.REACT_APP_PLAY_ONLY_ROOM_EMPTY_MESSAGE}</p> : null}
        {videoCards()}
        {process.env.REACT_APP_LAYOUT_OTHERS_CARD_VISIBILITY === 'true' ? othersCard() : null}
      </>
    )
};

export default LayoutTiled;
