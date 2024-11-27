import React, { useCallback, useContext, useEffect, useState, useRef } from "react";
import { alpha, styled } from "@mui/material/styles";
import { ConferenceContext } from "pages/AntMedia";
import DummyCard from "./DummyCard";
import { Grid, Typography, useTheme, Box, Tooltip, Fab } from "@mui/material";
import { SvgIcon } from "../SvgIcon";
import { useTranslation } from "react-i18next";
import { isMobile, isTablet } from "react-device-detect";

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
    const [displayHover, setDisplayHover] = useState(false);
    const [isTalking, setIsTalking] = useState(false);
    const theme = useTheme();
    const timeoutRef = useRef(null);

    const refVideo = useCallback((node) => {
        if (node && props.trackAssignment.track) {
            node.srcObject = new MediaStream([props.trackAssignment.track]);
            node.play().catch((e) => console.error("Video playback failed:", e));
        }
    }, [props.trackAssignment.track]);

    const cardBtnStyle = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: { xs: "6vw", md: 32 },
        height: { xs: "6vw", md: 32 },
        borderRadius: "50%",
        position: "relative",
    };

    const isMine = props.trackAssignment?.isMine;
    const isVideoTrack = props.trackAssignment.track?.kind === "video";

    const parseMetaData = (metaData, key) => {
        if (!metaData) return false;
        try {
            const parsed = JSON.parse(metaData);
            return parsed[key] || false;
        } catch {
            return false;
        }
    };

    const micMuted = isMine
        ? conference?.isMyMicMuted
        : parseMetaData(
            conference?.allParticipants?.[props.trackAssignment.streamId]?.metaData,
            "isMicMuted"
        );

    const useAvatar = isMine
        ? conference?.isMyCamTurnedOff
        : !parseMetaData(
            conference?.allParticipants?.[props.trackAssignment.streamId]?.metaData,
            "isCameraOn"
        ) &&
        !parseMetaData(
            conference?.allParticipants?.[props.trackAssignment.streamId]?.metaData,
            "isScreenShared"
        );

    useEffect(() => {
        if (isMine && conference.isPublished && !conference.isPlayOnly) {
            conference.setAudioLevelListener((value) => {
                if (value >= 0.01) {
                    if (!isTalking) setIsTalking(true);
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = setTimeout(() => setIsTalking(false), 1500);
                }
            }, 1000);
        }
        return () => clearTimeout(timeoutRef.current);
    }, [conference, isTalking, isMine]);

    const renderOverlayButtons = () => {
        if (!props.hidePin) {
            const shouldShowTooltip = !isMobile && !isTablet;
            return (
                <Grid
                    container
                    justifyContent="center"
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
                        justifyContent="center"
                        alignItems="center"
                        style={{ height: "100%" }}
                    >
                        {shouldShowTooltip && (
                            <Tooltip
                                title={`${props.pinned ? t("unpin") : t("pin")} ${props.name}`}
                                placement="top"
                            >
                                <Fab
                                    onClick={() => conference.pinVideo(props.trackAssignment.streamId)}
                                    color="primary"
                                    size="small"
                                >
                                    <SvgIcon
                                        size={36}
                                        name={props.pinned ? "unpin" : "pin"}
                                        color={theme.palette?.darkIconColor?.primary}
                                    />
                                </Fab>
                            </Tooltip>
                        )}
                    </Grid>
                </Grid>
            );
        }
        return null;
    };

    const renderAvatarOrPlayer = () => (
        <>
            {useAvatar ? (
                <Grid style={{ height: "100%" }} container>
                    <DummyCard />
                </Grid>
            ) : (
                <Grid
                    container
                    style={{
                        height: "100%",
                        transform: isMine ? "rotateY(180deg)" : "none",
                    }}
                >
                    <CustomizedVideo
                        {...props}
                        track={props.trackAssignment.track}
                        label={props.trackAssignment.videoLabel}
                        id={props.trackAssignment.streamId}
                        ref={refVideo}
                        playsInline
                        muted
                        style={{ objectFit: "contain" }}
                    />
                </Grid>
            )}
        </>
    );

    const renderParticipantStatus = () => (
        <Grid
            container
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
                        <CustomizedBox sx={cardBtnStyle}>
                            <SvgIcon
                                size={32}
                                name="muted-microphone"
                                color={theme.palette?.iconColor?.primary}
                            />
                        </CustomizedBox>
                    </Grid>
                </Tooltip>
            )}
        </Grid>
    );

    const setLocalVideo = () => {
        let tempLocalVideo = document.getElementById((typeof conference?.publishStreamId === "undefined")? "localVideo" : conference?.publishStreamId);
        if(props.trackAssignment.isMine && conference.localVideo !== tempLocalVideo) {
            conference?.localVideoCreate(tempLocalVideo);
        }
    }

    return (
        <Grid
            container
            style={{
                height: "100%",
                width: "100%",
                position: "relative",
            }}
            onMouseEnter={() => setDisplayHover(true)}
            onMouseLeave={() => setDisplayHover(false)}
        >
            {renderOverlayButtons()}
            <div
                className="single-video-card"
                style={{
                    height: props.isMobileView ? "40%" : "100%",
                    width: props.isMobileView ? "20%" : "100%",
                    position: "relative",
                    borderRadius: 4,
                    overflow: "hidden",
                }}
            >
                {renderAvatarOrPlayer()}
                {renderParticipantStatus()}
                {setLocalVideo()}
            </div>
        </Grid>
    );
};

export default VideoCard;
