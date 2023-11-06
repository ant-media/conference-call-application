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
    const videoCount = Object.keys(conference.participants).length+1

    
    const {width, height} = calculateLayout(
        props.width,
        props.height,
        videoCount,
        aspectRatio
    );

    setCardWidth(width - 8);
    setCardHeight(height - 8);

    //console.log("***** W:"+cardWidth+" H:"+cardHeight+" props.width:"+props.width+" width:"+width+" cols:"+cols+" vc:"+videoCount);
  }, [conference.participants, props.width, props.height, conference.participantUpdated]);

  const showOthers = Object.keys(conference.allParticipants).length > conference.globals.maxVideoTrackCount; 

  //if we need to show others card, then we don't show the last video to hold place for the others card
  const playingParticipantsCount = showOthers ? conference.participants.length - 1 : conference.participants.length;
  const playingParticipants = conference.participants.slice(0, playingParticipantsCount);
  
  const videoCards = () => {
    return (
      <>
        {
          playingParticipants.map((element, index) => {
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
                    id={element.id}
                    streamId={element.streamId}
                    track={element.track}
                    label={element.label}
                    autoPlay
                    name={element.name}
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
        {videoCards()}
        {othersCard()}
      </>
    )
};

export default LayoutTiled;
