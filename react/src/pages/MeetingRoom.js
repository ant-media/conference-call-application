/* eslint-disable react-hooks/exhaustive-deps */
import VideoCard from "Components/Cards/VideoCard";
import React, { useContext, useEffect } from "react";

import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Footer from "Components/Footer/Footer";
import { AntmediaContext } from "App";
import { SettingsContext } from "pages/AntMedia";

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
  const { drawerOpen, pinnedVideoId, pinVideo, audioTracks } = settings;
  const { participants } = props;
  console.log("participants: ", participants);

  useEffect(() => {
    if (document.getElementById("localVideo")) {
      antmedia.mediaManager.localVideo = document.getElementById("localVideo");
      antmedia.mediaManager.localVideo.srcObject =
        antmedia.mediaManager.localStream;
    }
  }, [pinnedVideoId, participants]);

  function handleGalleryResize(calcDrawer) {
    const gallery = document.getElementById("meeting-gallery");

    if (calcDrawer) {
      if (drawerOpen) {
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

    const { width, height, cols } = calculateLayout(
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
  }, [drawerOpen]);

  React.useEffect(() => {
    const debouncedHandleResize = debounce(handleGalleryResize, 500);
    window.addEventListener("resize", debouncedHandleResize);

    return (_) => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
  });

  function stringToColor(string) {
    let hash = 0;
    let i;

    /* eslint-disable no-bitwise */
    for (i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = "#";

    for (i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    /* eslint-enable no-bitwise */

    return color;
  }

  const getUnpinnedParticipants = () => {
    const array = [
      pinnedVideoId !== "localVideo" && { id: "localVideo" },
      ...participants.filter((v) => v.id !== pinnedVideoId),
    ];
    const filtered = array.filter(Boolean);
    return filtered;
  };

  const returnUnpinnedGallery = () => {
    //pinned tile
    const unpinnedParticipants = getUnpinnedParticipants();

    const showAsOthersLimitPinned = 4;
    const showAsOthersSliceIndexPinned = showAsOthersLimitPinned - 2;

    const slicePinnedTiles =
      unpinnedParticipants.length + 1 > showAsOthersLimitPinned;

    let slicedParticipants = [];
    if (slicePinnedTiles) {
      slicedParticipants = unpinnedParticipants.slice(
        0,
        showAsOthersSliceIndexPinned
      );
    } else {
      slicedParticipants = unpinnedParticipants;
    }

    return (
      <>
        {slicedParticipants.map(({ id, track, name }, index) => {
          if (id !== "localVideo") {
            return (
              <div className="unpinned">
                <div className="single-video-container" key={index}>
                  <VideoCard
                    onHandlePin={() => {
                      pinVideo(id);
                    }}
                    id={id}
                    track={track}
                    autoPlay
                    name={name}
                  />
                </div>
              </div>
            );
          } else {
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
          }
        })}
        {slicePinnedTiles && participants.length > 0 && (
          <div className="unpinned">
            <div className="single-video-container  others-tile-wrapper">
              <div className="others-tile-inner">
                <AvatarGroup max={4} sx={{ justifyContent: "center" }}>
                  {unpinnedParticipants
                    .slice(showAsOthersSliceIndexPinned)
                    .map(({ name }, index) => {
                      if (name.length > 0) {
                        const nameArr = name.split(" ");
                        const secondLetter =
                          nameArr.length > 1 ? nameArr[1][0] : "";
                        const initials =
                          `${nameArr[0][0]}${secondLetter}`.toLocaleUpperCase();

                        return (
                          <Avatar
                            key={index}
                            alt={name}
                            sx={{
                              bgcolor: stringToColor(name),
                            }}
                          >
                            {initials}
                          </Avatar>
                        );
                      } else {
                        return null;
                      }
                    })}
                </AvatarGroup>
                <Typography sx={{ mt: 2, color: "#AFF3EE80" }}>
                  {
                    unpinnedParticipants.slice(showAsOthersSliceIndexPinned)
                      .length
                  }{" "}
                  other{unpinnedParticipants.length - 2 > 0 ? "s" : ""}
                </Typography>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  //main tile
  const showAsOthersLimit = 6;
  const showAsOthersSliceIndex = showAsOthersLimit - 2;
  const sliceTiles = participants.length + 1 > showAsOthersLimit; //plus 1 is me

  //plus 1 is me

  const pinLayout = pinnedVideoId !== null ? true : false;

  return (
    <>
      {audioTracks.map((audio, index) => (
        <VideoCard
          onHandlePin={() => {}}
          id={audio.streamId}
          track={audio.track}
          autoPlay
          name={""}
          style={{ display: "none" }}
        />
      ))}
      <div id="meeting-gallery" style={{ height: "calc(100vh - 80px)" }}>
        {!pinLayout && ( // if not pinned layout show me first as a regular video
          <>
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
            </div>
            {participants
              .slice(
                0,
                sliceTiles ? showAsOthersSliceIndex : participants.length
              )
              .map(({ id, track, name }, index) => (
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
                        pinVideo(id);
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
                <div className="others-tile-inner">
                  <AvatarGroup max={4} sx={{ justifyContent: "center" }}>
                    {participants
                      .slice(showAsOthersSliceIndex + 1)
                      .map(({ name }, index) => {
                        if (name.length > 0) {
                          const nameArr = name.split(" ");
                          const secondLetter =
                            nameArr.length > 1 ? nameArr[1][0] : "";
                          const initials =
                            `${nameArr[0][0]}${secondLetter}`.toLocaleUpperCase();

                          return (
                            <Avatar
                              key={index}
                              alt={name}
                              sx={{
                                bgcolor: stringToColor(name),
                              }}
                            >
                              {initials}
                            </Avatar>
                          );
                        } else {
                          return null;
                        }
                      })}
                  </AvatarGroup>
                  <Typography sx={{ mt: 2, color: "#AFF3EE80" }}>
                    {participants.length - 2} other
                    {participants.length - 2 > 0 ? "s" : ""}
                  </Typography>
                </div>
              </div>
            )}
          </>
        )}
        {pinLayout && ( // if not pinned layout show me first as a regular video
          <>
            {pinnedVideoId === "localVideo" ? (
              // pinned myself
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
              participants
                .filter((v) => v.id === pinnedVideoId)
                .map(({ id, track, name }, index) => (
                  <>
                    <div
                      className="single-video-container pinned keep-ratio"
                      key={`pin-${index}`}
                    >
                      <VideoCard
                        id={id}
                        track={track}
                        autoPlay
                        name={name}
                        pinned
                        onHandlePin={() => {
                          pinVideo(id);
                        }}
                      />
                    </div>
                  </>
                ))
            )}
            <div id="unpinned-gallery">{returnUnpinnedGallery()}</div>
          </>
        )}
      </div>
      <Footer {...props} />
    </>
  );
});

export default MeetingRoom;
