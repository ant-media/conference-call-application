/* eslint-disable react-hooks/exhaustive-deps */
import VideoCard from "Components/Cards/VideoCard";
import OthersCard from "Components/Cards/OthersCard";
import React from "react";
import { ConferenceContext } from "./AntMedia";

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
  const conference = React.useContext(ConferenceContext);

  const aspectRatio = 16 / 9;
  const [cardWidth, setCardWidth] = React.useState(500*aspectRatio);
  const [cardHeight, setCardHeight] = React.useState(500);

  React.useEffect(() => {
    const videoCount = conference.videoTrackAssignments.length+1


    const {width, height} = calculateLayout(
        props.width,
        props.height,
        videoCount,
        aspectRatio
    );

    setCardWidth(width - 8);
    setCardHeight(height - 8);

    //console.log("***** W:"+cardWidth+" H:"+cardHeight+" props.width:"+props.width+" width:"+width+" cols:"+cols+" vc:"+videoCount);
  }, [conference.videoTrackAssignments, props.width, props.height, conference.participantUpdated]);

  const showOthers = Object.keys(conference.allParticipants).length > conference.globals.desiredTileCount;
  let trackCount = conference.globals.desiredTileCount - 1; //remove you
  conference.updateMaxVideoTrackCount(showOthers ? trackCount - 1 : trackCount); //remove others if we show

  const playingParticipantsCount = conference.videoTrackAssignments.length;
  const playingParticipants = conference.videoTrackAssignments.slice(0, playingParticipantsCount);

  const videoCards = () => {
    return (
      <>
        {
          playingParticipants.map((element, index) => {
            let isPlayOnly
            try {
              isPlayOnly = JSON.parse(conference?.allParticipants[element?.streamId]?.metaData)?.isPlayOnly;
            } catch (e) {
              isPlayOnly = false;
            }

            let participantName = conference?.allParticipants[element?.streamId]?.name;

            if (participantName === "" || typeof participantName === 'undefined' || isPlayOnly || participantName === "Anonymous") {
              return null;
            }

            //console.log("cw:"+cardWidth+" ch:"+cardHeight);
            return (
              <div
                  className="single-video-container not-pinned"
                  key={index}
                  style={{
                    width: cardWidth + "px",
                    height: cardHeight + "px",
                  }}
              >
                <VideoCard
                    trackAssignment={element}
                    autoPlay
                    name={participantName}
                />
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
        {conference?.videoTrackAssignments.length === 0 ? <p>{process.env.REACT_APP_PLAY_ONLY_ROOM_EMPTY_MESSAGE}</p> : null}
        {videoCards()}
        {process.env.REACT_APP_LAYOUT_OTHERS_CARD_VISIBILITY === 'true' ? othersCard() : null}
      </>
    )
};

export default LayoutTiled;
