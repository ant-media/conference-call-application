import React, { useCallback, useContext, useEffect } from "react";
import { alpha, styled } from "@mui/material/styles";
import { ConferenceContext } from "pages/AntMedia";
import DummyCard from "./DummyCard";
import { Grid, Typography, useTheme, Box, Tooltip, Fab } from "@mui/material";
import { SvgIcon } from "../SvgIcon";
import { useTranslation } from "react-i18next";
import { isMobile, isTablet } from 'react-device-detect';

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

function VideoCard(props) {
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

  const refVideo = useCallback( (node) => {
      if (node && props.trackAssignment.track) {
        node.srcObject = new MediaStream([props.trackAssignment.track]);
        node.play().then(()=> {}).catch((e) => { console.log("play failed because ", e)});
      }
    },
    [props.trackAssignment.track]
  );

  let useAvatar = true;
  if(props?.trackAssignment.isMine) {
    useAvatar = conference?.isMyCamTurnedOff;
  }
  else if (props.trackAssignment.track?.kind === "video") {
    let broadcastObject = conference?.allParticipants[props?.trackAssignment.streamId];
    let metaData = broadcastObject?.metaData;
    useAvatar = !parseMetaDataAndGetIsCameraOn(metaData) && !parseMetaDataAndGetIsScreenShared(metaData);
  }

  function isJsonString(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  function parseMetaDataAndGetIsCameraOn(metaData) {
    if (!metaData) return false;
    return (isJsonString(metaData)) ? JSON.parse(metaData).isCameraOn : false;
  }

  function parseMetaDataAndGetIsScreenShared(metaData) {
    if (!metaData) return false;
    return (isJsonString(metaData)) ? JSON.parse(metaData).isScreenShared : false;
  }

  function parseMetaDataAndGetIsMicMuted(metaData) {
    if (!metaData) return true;
    return (isJsonString(metaData)) ? JSON.parse(metaData).isMicMuted : true;
  }

  const micMuted = (props?.trackAssignment.isMine) ? conference?.isMyMicMuted : parseMetaDataAndGetIsMicMuted(conference?.allParticipants[props?.trackAssignment.streamId]?.metaData);

  const [isTalking, setIsTalking] = React.useState(false);


  const timeoutRef = React.useRef(null);

  const mirrorView = props?.trackAssignment.isMine;
  //const isScreenSharing =
  //  conference?.isScreenShared ||
  //  conference?.screenSharedVideoId === props?.trackAssignment.streamId;
  //conference?.isScreenShared means am i sharing my screen
  //conference?.screenSharedVideoId === props?.trackAssignment.streamId means is someone else sharing their screen
  useEffect(() => {
    if (props?.trackAssignment.isMine && conference.isPublished && !conference.isPlayOnly) {
      conference.setAudioLevelListener((value) => {
        // sounds under 0.01 are probably background noise
        if (value >= 0.01) {
          if (isTalking === false) setIsTalking(true);
          clearInterval(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            setIsTalking(false);
          }, 1500);
        }
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conference.isPublished]);

    const overlayButtonsGroup = () => {
        if (process.env.REACT_APP_VIDEO_OVERLAY_ADMIN_MODE_ENABLED === "true") {
        return (!props.hidePin && (
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
                    wrap='nowrap'
                >
                    <Grid
                        item
                        container
                        justifyContent={"center"}
                        alignItems="center"
                        columnSpacing={0.5}
                    >
                      {(!isMobile) && (!isTablet) ?
                        <Tooltip
                            title={`${props.pinned ? t("unpin") : t("pin")} ${props.name
                            }`}
                            placement="top"
                        >
                            <Fab
                                onClick={() => {
                                  conference.pinVideo(props.trackAssignment.streamId);
                                }}
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
                        : null }

                        { !props?.trackAssignment.isMine && conference.isAdmin && conference.isAdmin === true ?
                            <Grid item>
                                {!useAvatar ?
                                    <Tooltip
                                        title={`Camera on ${
                                            props.name
                                        }`}
                                        placement="top"
                                    >
                                        <Fab
                                            onClick={()=>{
                                                let participant = {};
                                                participant.streamId=props.trackAssignment.streamId;
                                                participant.streamName=props.name;
                                                conference?.setParticipantIdMuted(participant);
                                                conference?.turnOffYourCamNotification(participant.streamId);
                                            }}
                                            color="primary"
                                            aria-label="add"
                                            size="small"
                                        >
                                            <SvgIcon
                                                size={36}
                                                name={"camera"}
                                                color={theme.palette.grey[80]}
                                            />
                                        </Fab>
                                    </Tooltip>
                                    :
                                    <Tooltip
                                        title={`Camera off ${
                                            props.name
                                        }`}
                                        placement="top"
                                    >
                                        <Fab
                                            color="error"
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
                                }
                            </Grid>
                            : null }

                        {(!props?.trackAssignment.isMine && conference.isAdmin && conference.isAdmin === true) ?
                            <Grid item>
                                {!micMuted ?
                                    <Tooltip
                                        title={`Microphone on ${props.name
                                        }`}
                                        placement="top"
                                    >
                                        <Fab
                                            onClick={() => {
                                                let participant = {};
                                                participant.streamId=props.trackAssignment.streamId;
                                                participant.streamName=props.name;
                                                conference?.setParticipantIdMuted(participant);
                                                conference?.turnOffYourMicNotification(participant.streamId);
                                            }}
                                            color="primary"
                                            aria-label="add"
                                            size="small"
                                        >
                                            <SvgIcon
                                                size={36}
                                                name={"microphone"}
                                                color={theme.palette.grey[80]}
                                            />
                                        </Fab>
                                    </Tooltip>
                                    : <Tooltip
                                        title={`Microphone off ${
                                            props.name
                                        }`}
                                        placement="top"
                                    >
                                        <Fab
                                            onClick={()=>{
                                                let participant = {};
                                                participant.streamId=props.trackAssignment.streamId;
                                                participant.streamName=props.name;
                                                conference?.setParticipantIdMuted(participant);
                                                conference?.turnOnYourMicNotification(participant.streamId);
                                            }}
                                            color="error"
                                            aria-label="add"
                                            size="small"
                                        >
                                            <SvgIcon
                                                size={36}
                                                name={"muted-microphone"}
                                                color={theme.palette.grey[80]}
                                            />
                                        </Fab>
                                    </Tooltip> }
                            </Grid>
                            : null }
                    </Grid>
                </Grid>
            </Grid>
        ))
    } else {
    return (!props.hidePin && (
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
          wrap='nowrap'
        >
          <Grid
            item
            container
            justifyContent={"center"}
            alignItems="center"
            columnSpacing={0.5}
          >
            {(!isMobile) && (!isTablet) ?
            <Tooltip
              title={`${props.pinned ? t("unpin") : t("pin")} ${props.name
                }`}
              placement="top"
            >
              <Fab
                onClick={() => {conference.pinVideo(props.trackAssignment.streamId);}}
                color="primary"
                aria-label="add"
                size="small"
              >
                <SvgIcon
                  size={36}
                  name={props.pinned ? "unpin" : "pin"}
                  color={theme.palette.grey[80]}
                />
              </Fab>
            </Tooltip>
            : null }

            {(!props?.trackAssignment.isMine && !micMuted) ?
              <Grid item>
                <Tooltip
                  title={`Microphone off ${props.name
                    }`}
                  placement="top"
                >
                  <Fab
                    onClick={() => {
                        let participant = {};
                        participant.streamId=props.trackAssignment.streamId;
                        participant.streamName=props.name;
                      conference?.setParticipantIdMuted(participant);
                        conference?.turnOffYourMicNotification(participant.streamId);
                        conference?.setMuteParticipantDialogOpen(true);

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
              : null}
          </Grid>
        </Grid>
      </Grid>
    ))
  }}

  const avatarOrPlayer = () => {
    return (
      <>
        <Grid
          sx={useAvatar ? {} : { display: "none" }}
          style={{ height: "100%" }}
          container
        >
          <DummyCard />
        </Grid>

        <Grid
          container
          sx={useAvatar ? { display: "none" } : {}}
          style={{
            height: "100%",
            transform: mirrorView ? "rotateY(180deg)" : "none",
          }}
        >
          <CustomizedVideo
            {...props}
            track={props.trackAssignment.track}
            label={props.trackAssignment.videoLabel}
            id={props.trackAssignment.streamId}
            style={{ objectFit: "contain" }}
            ref={refVideo}
            playsInline
            muted={true} // mute the video because we are playing the audio separately
          />
        </Grid>
      </>
    )
  }

  const overlayParticipantStatus = () => {
    return (
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
        {micMuted && (
          <Tooltip title={t("mic is muted")} placement="top">
            <Grid item>
              <CustomizedBox
                id={"mic-muted-"+props.trackAssignment.streamId}
                sx={cardBtnStyle}>
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
    );
  }

  const overlayVideoTitle = () => {
    return (
      props.name && (
        <div className="name-indicator">
          <Typography color="white" align="left" className="name">
            {props.name}{" "}
            {process.env.NODE_ENV === "development"
              ? `${props?.trackAssignment.isMine
                ? props.trackAssignment.streamId +
                " " +
                conference.streamName
                : props.trackAssignment.streamId + " " + props.trackAssignment.track?.id
              }`
              : ""}
          </Typography>
        </div>
      )
    );
  }

  const isTalkingFrame = () => {
    return (
      <div
        className="talking-indicator-light"
        style={{
          borderColor: theme.palette.themeColor[20],
          ...(isTalking || conference.talkers.includes(props.trackAssignment.streamId)
            ? {}
            : { display: "none" }),
        }}
      />
    );
  }

  const setLocalVideo = () => {
    let tempLocalVideo = document.getElementById((typeof conference?.publishStreamId === "undefined")? "localVideo" : conference?.publishStreamId);
    if(props?.trackAssignment.isMine && conference.localVideo !== tempLocalVideo) {
      conference?.localVideoCreate(tempLocalVideo);
    }
  };

  return props?.trackAssignment.isMine || props.trackAssignment.track?.kind !== "audio" ? (
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

        {overlayButtonsGroup()}

        <div
          className={`single-video-card`}
          id={'card-'+(props.trackAssignment.streamId !== undefined ? props?.trackAssignment.streamId : "")}
          style={{
            height: (props.isMobileView === true) ? "40%" : "100%",
            width: (props.isMobileView === true) ? "20%" : "100%",
            position: "relative",
            borderRadius: 4,
            margin: (props.isMobileView === true) ? 30 : 0,
            overflow: "hidden",
          }}
        >
          {avatarOrPlayer()}

          {setLocalVideo()}

          {overlayParticipantStatus()}

          {isTalkingFrame()}

          {overlayVideoTitle()}

        </div>
      </Grid>
    </>
  ) : (
    //for audio tracks
    <>
      <video
        style={{ display: "none" }}
        {...props}
        ref={refVideo}
        playsInline
      ></video>
    </>
  );
};

export default VideoCard;
