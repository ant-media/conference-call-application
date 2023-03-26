import React, { memo, useCallback, useContext, useEffect } from "react";
import { alpha, styled } from "@mui/material/styles";
import { ConferenceContext } from "pages/AntMedia";
import DummyCard from "./DummyCard";
import { Grid, Typography, useTheme, Box, Tooltip, Fab } from "@mui/material";
import { SvgIcon } from "../SvgIcon";
import { useTranslation } from "react-i18next";
const CustomizedVideo = styled("video")({
  borderRadius: 4,
  width: "100%",
  height: "100%",
  objectPosition: "center",
  backgroundColor: "transparent",
});
const CustomizedBox = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.gray[90], 0.3),
}));

const VideoCard = memo(({ srcObject, hidePin, onHandlePin, ...props }) => {
  const conference = useContext(ConferenceContext);

  const { t } = useTranslation();
  const [displayHover, setDisplayHover] = React.useState(false);
  const theme = useTheme();

  const cardBtnStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: { xs: "6vw", md: 32 },
    height: { xs: "6vw", md: 32 },
    borderRadius: "50%",
    position: "relative",
  };

  const refVideo = useCallback(
    (node) => {
      if (node && props.track) {
        node.srcObject = new MediaStream([props.track]);
      }
    },
    [props.track]
  );

  React.useEffect(() => {
    if (props.track?.kind === "video" && !props.track.onended) {
      props.track.onended = (event) => {
        conference?.globals?.trackEvents.push({track:props.track.id,event:"removed"});
        if (conference.participants.length > conference?.globals?.maxVideoTrackCount) {
          console.log("video before:"+JSON.stringify(conference.participants));
          conference.setParticipants((oldParts) => {
            return oldParts.filter(
              (p) => !(p.id === props.id || p.videoLabel === props.id)
            );
          });
          console.log("video after:"+JSON.stringify(conference.participants));

        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.track]);

  let isOff = conference?.cam?.find(
    (c) => c.eventStreamId === props?.id && !c?.isCameraOn
  );

  // if i sharing my screen.
  if (
    conference.isScreenShared === true &&
    props?.id === "localVideo" &&
    conference?.cam.find(
      (c) => c.eventStreamId === "localVideo" && c.isCameraOn === false
    )
  ) {
    isOff = false;
  }
  // screenSharedVideoId is the id of the screen share video.
  if (
    conference.screenSharedVideoId === props?.id &&
    conference?.cam.find(
      (c) => c.eventStreamId === props?.id && c.isCameraOn === false
    )
  ) {
    isOff = false;
  }
  const mic = conference?.mic?.find((m) => m.eventStreamId === props?.id);

  const [isTalking, setIsTalking] = React.useState(false);
  const timeoutRef = React.useRef(null);

  const isLocal = props?.id === "localVideo";
  const mirrorView = isLocal && !conference?.isScreenShared;
  const isScreenSharing =
    conference?.isScreenShared ||
    conference?.screenSharedVideoId === props?.id;
  //conference?.isScreenShared means am i sharing my screen
  //conference?.screenSharedVideoId === props?.id means is someone else sharing their screen
  useEffect(() => {
    if (isLocal && conference.isPublished && !conference.isPlayOnly) {
      conference.setAudioLevelListener((value) => {
        // sounds under 0.01 are probably background noise
        if (value >= 0.01) {
          if (isTalking === false) setIsTalking(true);
          clearInterval(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            setIsTalking(false);
          }, 1000);
          conference.updateAudioLevel(
            Math.floor(value * 100)
          );
        }
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conference.isPublished]);

  return isLocal || props.track?.kind !== "audio" ? (
    <>
      <Grid
        container
        style={{
          height: "100%",
          width: "100%",
          position: "relative",
        }}
        onMouseEnter={() => setDisplayHover(true)}
        onMouseLeave={(e) => setDisplayHover(false)}
      >
        {!hidePin && (
          <Grid
            container
            justifyContent={"center"}
            alignItems="center"
            className="pin-overlay"
            sx={{
              opacity: displayHover ? 1 : 0,
              transition: "opacity 0.3s ease",
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              zIndex: 100,
            }}
          >
            <Grid
              container
              justifyContent={"center"}
              alignItems="center"
              style={{ height: "100%" }}
              spacing={2}
            >
              <Grid item>
                <Tooltip
                  title={`${props.pinned ? t("unpin") : t("pin")} ${
                    props.name
                  }`}
                  placement="top"
                >
                  <Fab
                    onClick={onHandlePin}
                    color="primary"
                    aria-label="add"
                    size="small"
                  >
                    <SvgIcon
                      size={36}
                      name={props.pinned ? t("unpin") : t("pin")}
                      color={theme.palette.grey[80]}
                    />
                  </Fab>
                </Tooltip>

                { props.id !== 'localVideo' && false?
              <Grid item>
                <Tooltip
                    title={`Camera off ${
                        props.name
                    }`}
                    placement="top"
                >
                  <Fab
                      onClick={()=>{
                        conference.handleSendMessage("admin*publisher_room*"+props.id+"*CLOSE_YOUR_CAMERA");
                      }}
                      color="primary"
                      aria-label="add"
                      size="small"
                  >
                    <SvgIcon
                        size={36}
                        name={"camera-off"}
                        color={theme.palette.grey[80]}
                    />
                  </Fab>
                </Tooltip>
              </Grid>
              : null }

              { props.id !== 'localVideo' ?
              <Grid item>
                <Tooltip
                    title={`Microphone off ${
                        props.name
                    }`}
                    placement="top"
                >
                  <Fab
                      onClick={()=>{
                        conference.turnOffYourMicNotification(props.id);
                      }}
                      color="primary"
                      aria-label="add"
                      size="small"
                  >
                    <SvgIcon
                        size={36}
                        name={"muted-microphone"}
                        color={theme.palette.grey[80]}
                    />
                  </Fab>
                </Tooltip>
              </Grid>
              : null }


              </Grid>
            </Grid>
          </Grid>
        )}



        <div
          className={`single-video-card`}
          // style={{
          //   ...(isTalking || conference.talkers.includes(props.id) ? {
          //     outline: `thick solid ${theme.palette.primary.main}`,
          //     borderRadius: '10px'
          //   } : {})
          // }}
        >
          <Grid
            sx={isOff ? {} : { display: "none" }}
            style={{ height: "100%" }}
            container
          >
            <DummyCard />
          </Grid>

          <Grid
            container
            sx={isOff ? { display: "none" } : {}}
            style={{
              height: "100%",
              transform: mirrorView ? "rotateY(180deg)" : "none",
            }}
          >
            <CustomizedVideo
              {...props}
              style={{ objectFit: isScreenSharing ? "contain" : "cover" }}
              ref={refVideo}
              playsInline
            ></CustomizedVideo>
          </Grid>

          <div
            className="talking-indicator-light"
            style={{
              ...(isTalking || conference.talkers.includes(props.id)
                ? {}
                : { display: "none" }),
            }}
          ></div>

          <Grid
            container
            className="video-card-btn-group"
            columnSpacing={1}
            direction="row-reverse"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              p: { xs: 1, md: 2 },
              zIndex: 9,
            }}
          >
            {mic && mic.isMicMuted && (
              <Tooltip title={t("mic is muted")} placement="top">
                <Grid item>
                  <CustomizedBox sx={cardBtnStyle}>
                    <SvgIcon size={32} name={"muted-microphone"} color="#fff" />
                  </CustomizedBox>
                </Grid>
              </Tooltip>
            )}
            {/* <Grid item>
              <Box sx={cardBtnStyle}>
                <SvgIcon size={36} name={'voice-indicator'} color={theme.palette.grey[80]} />
              </Box>
            </Grid>
             */}
            {props.pinned && (
              <Tooltip title={t("pinned by you")} placement="top">
                <Grid item>
                  <CustomizedBox sx={cardBtnStyle}>
                    <SvgIcon size={36} name={"unpin"} color="#fff" />
                  </CustomizedBox>
                </Grid>
              </Tooltip>
            )}
          </Grid>
          {props.name && (
            <div className="name-indicator">
              <Typography color="white" align="left" className="name">
                {props.name}{" "}
                {process.env.NODE_ENV === "development"
                  ? `${
                      isLocal
                        ? conference.publishStreamId +
                          " " +
                          props.id +
                          " " +
                          conference.streamName
                        : props.id + " " + props.track?.id
                    }`
                  : ""}
              </Typography>
            </div>
          )}
        </div>
      </Grid>
    </>
  ) : (
    <>
      <video
        style={{ display: "none" }}
        {...props}
        ref={refVideo}
        playsInline
      ></video>
    </>
  );
});

export default VideoCard;
