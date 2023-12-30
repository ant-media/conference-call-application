/* eslint-disable react-hooks/exhaustive-deps */
import VideoCard from "Components/Cards/VideoCard";
import React, { useContext, useEffect } from "react";
import { AntmediaContext } from "App";
import { SettingsContext } from "pages/AntMedia";

import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Footer from "Components/Footer/Footer";
import { styled } from "@mui/material/styles";

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

const MeetingRoom = React.memo((props) => {
  const antmedia = useContext(AntmediaContext);

  const settings = useContext(SettingsContext);
  const { messageDrawerOpen, participantListDrawerOpen, publisherRequestListDrawerOpen, pinnedVideoId, pinVideo, audioTracks, globals, observerMode } =
    settings;
  const { participants, allParticipants, myLocalData } = props;

  const allParticipantsExceptLocal = allParticipants.filter(
      (p) => p.streamId !== myLocalData?.streamId
  );

  const filterAndSortOthersTile = (all, showing) => {
    const participantIds = showing.map(({id}) => id);
    const othersIds = all.filter((p) => !participantIds.includes(p.streamId));
    return othersIds.sort((a, b) => a.streamName.localeCompare(b.streamName));
  };

  useEffect(() => {
    let localVid = document.getElementById("localVideo");
    if (localVid) {
      antmedia.mediaManager.localVideo = document.getElementById("localVideo");
      antmedia.mediaManager.localVideo.srcObject =
          antmedia.mediaManager.localStream;
    }
  }, [pinnedVideoId]);

  function handleGalleryResize(calcDrawer) {
    const gallery = document.getElementById("meeting-gallery");

    if (calcDrawer) {
      if (messageDrawerOpen || participantListDrawerOpen || publisherRequestListDrawerOpen) {
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
  }, [participants, pinnedVideoId]);

  React.useEffect(() => {
    handleGalleryResize(true);
  }, [messageDrawerOpen, participantListDrawerOpen, publisherRequestListDrawerOpen]);

  React.useEffect(() => {
    const debouncedHandleResize = debounce(handleGalleryResize, 500);
    window.addEventListener("resize", debouncedHandleResize);

    return (_) => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
  });

  const getUnpinnedParticipants = () => {
    const array = [
      pinnedVideoId !== "localVideo" && {id: "localVideo"},
      ...participants.filter((v) => v.id !== pinnedVideoId),
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
          participants
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

    return unpinnedParticipants.length > 0 ? (
        <>
          {unpinnedParticipants.map(({id, videoLabel, track, name, streamId}, index) => {
            if (id !== "localVideo" && streamId !== antmedia?.roomName) {
              return (
                  <div className="unpinned" key={index}>
                    <div className="single-video-container">
                      <VideoCard
                          onHandlePin={() => {
                            pinVideo(id, videoLabel);
                          }}
                          id={id}
                          track={track}
                          autoPlay
                          name={name}
                      />
                    </div>
                  </div>
              );
            } else if (antmedia.onlyDataChannel === false) {
              return (
                  <div className="unpinned">
                    <div className="single-video-container " key={index}>
                      <VideoCard
                          onHandlePin={() => {
                            pinVideo("localVideo");
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
        </>
    ) : (
        <Typography variant="body2" sx={{color: "green.50", mt: 3}}>
          No other participants.
        </Typography>
    );
  };

  //main tile other limit set, max count
  const showAsOthersLimit = globals.maxVideoTrackCount + 1; // the total video cards i want to see on screen including my local video card and excluding the others tile. if this is set to 2, user will see 3 people and 1 "others card" totaling to 4 cards and 2x2 grid.
  //with 2 active video participants + 1 me + 1 card
  const sliceTiles = allParticipantsExceptLocal.length + 1 > showAsOthersLimit; //plus 1 is me

  const pinLayout = pinnedVideoId !== null;

  const pinnedParticipant = participants.find((v) => v.id === pinnedVideoId);
  // const testPart = [{ name: 'a' }, { name: 'a' }];
  return (
        <>
          {audioTracks.map((audio, index) => (
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
                  { antmedia.onlyDataChannel === false ?
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
                          pinVideo("localVideo");
                        }}
                        id="localVideo"
                        autoPlay
                        name="You"
                        muted
                        hidePin={participants.length === 0}
                    />
                  </div> : null}
                  {participants
                      .filter((p) => p.streamId !== antmedia?.roomName)
                      .map(({id, videoLabel, track, name}, index) => (
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
                                    pinVideo(id, videoLabel);
                                  }}
                                  id={id}
                                  track={track}
                                  autoPlay
                                  name={name}
                              />
                            </div>
                          </>
                      ))}
                  {sliceTiles && participants.length > 0 && (
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
                  {pinnedVideoId === "localVideo" ? (
                      // pinned myself
                      // ${participants.length === 0 ? ' no-participants ' : ''}
                      <div className="single-video-container pinned keep-ratio">
                        <VideoCard
                            onHandlePin={() => {
                              pinVideo("localVideo");
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

                    pinnedParticipant && (
                          <div className="single-video-container pinned keep-ratio">
                            <VideoCard
                                id={pinnedParticipant?.id}
                                track={pinnedParticipant?.track}
                                autoPlay
                                name={pinnedParticipant?.name}
                                pinned
                                onHandlePin={() => {
                                  pinVideo(
                                    pinnedParticipant?.id,
                                    pinnedParticipant?.videoLabel
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
          { observerMode === false ?
          <Footer {...props} /> : null }
        </>
    )
});

export default MeetingRoom;
