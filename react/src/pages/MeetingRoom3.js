/* eslint-disable react-hooks/exhaustive-deps */
import VideoCard from "Components/Cards/VideoCard";
import React, { useEffect } from "react";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Footer from "Components/Footer/Footer";
import { styled } from "@mui/material/styles";
import { ConferenceContext } from "./AntMedia";

const CustomizedAvatar = styled(Avatar)(({ theme }) => ({
  border: `3px solid ${theme.palette.green[85]} !important`,
  color: "#fff",
  width: 44,
  height: 44,
  [theme.breakpoints.down("md")]: {
    width: 34,
    height: 34,
    fontSize: 16,
  },
}));

const CustomizedAvatarGroup = styled(AvatarGroup)(({ theme }) => ({
  "& div:not(.regular-avatar)": {
    border: `3px solid ${theme.palette.green[85]} !important`,
    backgroundColor: theme.palette.green[80],
    color: "#fff",
    width: 44,
    height: 44,
    [theme.breakpoints.down("md")]: {
      width: 34,
      height: 34,
      fontSize: 14,
    },
  },
}));

function debounce(fn, ms) {
  let timer;
  return (_) => {
    clearTimeout(timer);
    timer = setTimeout((_) => {
      timer = null;
      fn.apply(this, arguments);
    }, ms);
  };
}

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

const MeetingRoom3 = React.memo((props) => {
  const conference = React.useContext(ConferenceContext);


  const allParticipantsExceptLocal = conference.allParticipants;
  delete allParticipantsExceptLocal[conference.publishStreamId];

  const filterAndSortOthersTile = (all, showing) => {
    const participantIds = showing.map(({id}) => id);
    //const othersIds2 = all.filter((p) => !participantIds.includes(p.streamId)); // FIXME: why is this not working?
    const othersIds = Object.entries(all).filter(([k,v]) => !participantIds.includes(v.streamId));
    return othersIds.sort((a, b) => a.streamName.localeCompare(b.streamName));
  };

  useEffect(() => {
    let localVid = document.getElementById("localVideo");
    if (localVid) {
      conference.setLocalVideo(document.getElementById("localVideo"));
    }
  }, [conference.pinnedVideoId]);

  function handleGalleryResize(calcDrawer) {
    const gallery = document.getElementById("meeting-gallery");

    if (calcDrawer) {
      if (conference.messageDrawerOpen || conference.participantListDrawerOpen) {
        gallery.classList.add("drawer-open");
      } else {
        gallery.classList.remove("drawer-open");
      }
    }
    const aspectRatio = 16 / 9;
    const screenWidth = gallery.getBoundingClientRect().width;

    const screenHeight = gallery.getBoundingClientRect().height;
    const videoCount = document.querySelectorAll(
        "#meeting-gallery .single-video-container.not-pinned"
    ).length;

    const {width, height, cols} = calculateLayout(
        screenWidth,
        screenHeight,
        videoCount,
        aspectRatio
    );

    let Width = width - 8;
    let Height = height - 8;

    gallery.style.setProperty("--width", `calc(100% / ${cols})`);
    gallery.style.setProperty("--maxwidth", Width + "px");
    gallery.style.setProperty("--height", Height + "px");
    gallery.style.setProperty("--cols", cols + "");
  }

  React.useEffect(() => {
    handleGalleryResize(false);
  }, [conference.participants, conference.pinnedVideoId, conference.participantUpdated]);

  React.useEffect(() => {
    handleGalleryResize(true);
  }, [conference.messageDrawerOpen, conference.participantListDrawerOpen]);

  React.useEffect(() => {
    const debouncedHandleResize = debounce(handleGalleryResize, 500);
    window.addEventListener("resize", debouncedHandleResize);

    return (_) => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
  });

  const getUnpinnedParticipants = () => {
    const array = [
      conference.pinnedVideoId !== "localVideo" && {id: "localVideo"},
      ...conference.participants.filter((v) => v.id !== conference.pinnedVideoId),
    ];
    const filtered = array.filter(Boolean);
    return filtered;
  };

  const OthersTile = (maxGroup, othersArray = []) => {
    let others = [];
    if (othersArray?.length > 0) {
      others = othersArray;
    } else {
      others = filterAndSortOthersTile(
          allParticipantsExceptLocal,
          conference.participants
      );
    }

    return (
        <div className="others-tile-inner">
          <CustomizedAvatarGroup max={maxGroup} sx={{justifyContent: "center"}}>
            {others.map(({name, streamName}, index) => {
              let username = name || streamName;
              if (username?.length > 0) {
                const nameArr = username.split(" ");
                const secondLetter = nameArr.length > 1 ? nameArr[1][0] : "";
                const initials =
                    `${nameArr[0][0]}${secondLetter}`.toLocaleUpperCase();

                return (
                    <CustomizedAvatar
                        key={index}
                        alt={username}
                        className="regular-avatar"
                        sx={{
                          bgcolor: "green.50",
                          color: "#fff",
                          fontSize: {xs: 16, md: 22},
                        }}
                    >
                      {initials}
                    </CustomizedAvatar>
                );
              } else {
                return null;
              }
            })}
          </CustomizedAvatarGroup>
          <Typography sx={{mt: 2, color: "#ffffff"}}>
            {others.length} other{others.length > 1 ? "s" : ""}
          </Typography>
        </div>
    );
  };

  const returnUnpinnedGallery = () => {
    //pinned tile
    let unpinnedParticipants = getUnpinnedParticipants();

    const showAsOthersLimitPinned = 5;
    const showAsOthersSliceIndexPinned = showAsOthersLimitPinned - 2;

    const slicePinnedTiles =
        unpinnedParticipants.length + 1 > showAsOthersLimitPinned;

    let slicedParticipants = [];
    if (slicePinnedTiles) {
      slicedParticipants = unpinnedParticipants.slice(
          0,
          showAsOthersSliceIndexPinned
      );
      unpinnedParticipants = unpinnedParticipants.slice(
          showAsOthersSliceIndexPinned
      );
    } else {
      slicedParticipants = unpinnedParticipants;
    }

    return slicedParticipants.length > 0 ? (
        <>
          {slicedParticipants.map(({id, videoLabel, track, name, streamId}, index) => {
            if (id !== "localVideo") {
              return (
                  <div className="unpinned" key={index}>
                    <div className="single-video-container">
                      <VideoCard
                          onHandlePin={() => {
                            conference.pinVideo(streamId, videoLabel);
                          }}
                          id={streamId}
                          track={track}
                          autoPlay
                          name={name}
                      />
                    </div>
                  </div>
              );
            } else if (conference.isPlayOnly === false) {
              return (
                  <div className="unpinned">
                    <div className="single-video-container " key={index}>
                      <VideoCard
                          onHandlePin={() => {
                            conference.pinVideo("localVideo", "localVideo");
                          }}
                          id="localVideo"
                          autoPlay
                          name="You"
                          muted
                      />
                    </div>
                  </div>
              );
            } else {
              return null;
            }
          })}
          {sliceTiles ? (
              <div className="unpinned">
                <div className="single-video-container  others-tile-wrapper">
                  {OthersTile(2)}
                </div>
              </div>
          ) : (
              slicePinnedTiles && (
                  <div className="unpinned">
                    <div className="single-video-container  others-tile-wrapper">
                      {OthersTile(2, unpinnedParticipants)}
                    </div>
                  </div>
              )
          )}
        </>
    ) : (
        <Typography variant="body2" sx={{color: "green.50", mt: 3}}>
          No other participants.
        </Typography>
    );
  };

  //main tile other limit set, max count
  const showAsOthersLimit = conference.globals.maxVideoTrackCount + 1; // the total video cards i want to see on screen including my local video card and excluding the others tile. if this is set to 2, user will see 3 people and 1 "others card" totaling to 4 cards and 2x2 grid.
  //with 2 active video participants + 1 me + 1 card
  const sliceTiles = Object.keys(allParticipantsExceptLocal).length + 1 > showAsOthersLimit; //plus 1 is me

  const pinLayout = conference.pinnedVideoId !== null ? true : false;
  // const testPart = [{ name: 'a' }, { name: 'a' }];

  const pinnedVideo = pinLayout && conference.participants.find((v) => v.id === conference.pinnedVideoId)

  return (
        <>
          {conference.audioTracks.map((audio, index) => (
              <VideoCard
                  key={index}
                  onHandlePin={() => {
                  }}
                  id={audio.streamId}
                  track={audio.track}
                  autoPlay
                  name={""}
                  style={{display: "none"}}
              />
          ))}
          <div id="meeting-gallery" style={{height: "calc(100vh - 80px)"}}>
            {!pinLayout && ( // if not pinned layout show me first as a regular video
                <>
                  { conference.isPlayOnly === false ?
                  <div
                      className="single-video-container not-pinned"
                      style={{
                        width: "var(--width)",
                        height: "var(--height)",
                        maxWidth: "var(--maxwidth)",
                      }}
                  >
                    <VideoCard
                        onHandlePin={() => {
                          conference.pinVideo("localVideo", "localVideo");
                        }}
                        id="localVideo"
                        autoPlay
                        name="You"
                        muted
                        hidePin={conference.participants.length === 0}
                    />
                  </div> : null}
                  {conference.participants
                      .map(({id, videoLabel, track, name, streamId}, index) => (
                          <>
                            <div
                                className="single-video-container not-pinned"
                                key={index}
                                style={{
                                  width: "var(--width)",
                                  height: "var(--height)",
                                  maxWidth: "var(--maxwidth)",
                                }}
                            >
                              <VideoCard
                                  onHandlePin={() => {
                                    conference.pinVideo(streamId, videoLabel);
                                  }}
                                  id={streamId}
                                  track={track}
                                  autoPlay
                                  name={name}
                              />
                            </div>
                          </>
                      ))}
                  {sliceTiles && conference.participants.length > 0 && (
                      <div
                          className="single-video-container not-pinned others-tile-wrapper"
                          style={{
                            width: "var(--width)",
                            height: "var(--height)",
                            maxWidth: "var(--maxwidth)",
                          }}
                      >
                        {OthersTile(4)}
                      </div>
                  )}
                </>
            )}
            {pinLayout && (
                <>
                  {conference.pinnedVideoId === "localVideo" ? (
                      // pinned myself
                      // ${participants.length === 0 ? ' no-participants ' : ''}
                      <div className="single-video-container pinned keep-ratio">
                        <VideoCard
                            onHandlePin={() => {
                              conference.pinVideo("localVideo", "localVideo");
                            }}
                            id="localVideo"
                            autoPlay
                            name="You"
                            muted
                            pinned
                        />
                      </div>
                  ) : (
                      //pinned participant
                      pinnedVideo && (
                          <div className="single-video-container pinned keep-ratio">
                            <VideoCard
                                id={pinnedVideo?.id}
                                track={
                                  pinnedVideo?.track
                                }
                                autoPlay
                                name={
                                  pinnedVideo?.name
                                }
                                pinned
                                onHandlePin={() => {
                                  conference.pinVideo(
                                    pinnedVideo.id,
                                    pinnedVideo.videoLabel
                                  );
                                }}
                            />
                          </div>
                      )
                  )}
                  <div id="unpinned-gallery">{returnUnpinnedGallery()}</div>
                </>
            )}
          </div>
          <Footer {...props} />
        </>
    )
});

export default MeetingRoom3;
