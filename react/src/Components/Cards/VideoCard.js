import React, { useCallback, useContext, useEffect, useState, useRef } from "react";
import { alpha, styled } from "@mui/material/styles";
import { ConferenceContext } from "pages/AntMedia";
import DummyCard from "./DummyCard";
import { Grid, Typography, Box, Tooltip, Fab, useTheme } from "@mui/material";
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

const VideoCard = ({ trackAssignment, pinned, hidePin, name, isMobileView }) => {
    const conference = useContext(ConferenceContext);
    const { t } = useTranslation();
    const theme = useTheme();

    const [displayHover, setDisplayHover] = useState(false);
    const [isTalking, setIsTalking] = useState(false);
    const timeoutRef = useRef(null);

    const cardBtnStyle = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: { xs: "6vw", md: 32 },
        height: { xs: "6vw", md: 32 },
        borderRadius: "50%",
        position: "relative",
    };

    const refVideo = useCallback((node) => {
        if (node && trackAssignment.track) {
            node.srcObject = new MediaStream([trackAssignment.track]);
            node.play().catch((e) => console.error("Video playback failed:", e));
        }
    }, [trackAssignment.track]);

    const isMine = trackAssignment.isMine;
    const metaData = conference?.allParticipants?.[trackAssignment.streamId]?.metaData;

    const useAvatar = isMine
        ? conference?.isMyCamTurnedOff
        : !parseMetaData(metaData)?.isCameraOn && !parseMetaData(metaData)?.isScreenShared;

    const micMuted = isMine
        ? conference?.isMyMicMuted
        : parseMetaData(metaData)?.isMicMuted ?? true;

    const isTalkingFrameVisible =
        isTalking || conference.talkers.includes(trackAssignment.streamId);

    useEffect(() => {
        if (isMine && conference.isPublished && !conference.isPlayOnly) {
            conference.setAudioLevelListener(
                (value) => {
                    if (value >= 0.01) {
                        if (!isTalking) setIsTalking(true);
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = setTimeout(() => setIsTalking(false), 1500);
                    }
                },
                1000
            );
        }
        // Cleanup on unmount
        return () => clearTimeout(timeoutRef.current);
    }, [isMine, conference, isTalking]);

    const parseMetaData = (data) => {
        try {
            return JSON.parse(data || "{}");
        } catch {
            return {};
        }
    };

    const handlePinClick = () => {
        conference.pinVideo(trackAssignment.streamId);
    };

    const handleMicToggle = () => {
        const participant = {
            streamId: trackAssignment.streamId,
            streamName: name,
        };
        micMuted
            ? conference.turnOnYourMicNotification(participant.streamId)
            : conference.turnOffYourMicNotification(participant.streamId);
        conference.setParticipantIdMuted(participant);
    };

    const overlayButtonsGroup = () => (
        !hidePin && (
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
                <Grid container justifyContent="center" alignItems="center" wrap="nowrap">
                    <Grid item container justifyContent="center" alignItems="center" columnSpacing={0.5}>
                        {!isMobile && !isTablet && (
                            <Tooltip title={`${pinned ? t("unpin") : t("pin")} ${name}`} placement="top">
                                <Fab onClick={handlePinClick} color="primary" size="small">
                                    <SvgIcon
                                        size={36}
                                        name={pinned ? "unpin" : "pin"}
                                        color={theme.palette?.darkIconColor?.primary}
                                    />
                                </Fab>
                            </Tooltip>
                        )}
                        {!isMine && (
                            <Tooltip
                                title={`${micMuted ? t("mic is muted") : t("mic is on")} ${name}`}
                                placement="top"
                            >
                                <Fab onClick={handleMicToggle} color="primary" size="small">
                                    <SvgIcon
                                        size={36}
                                        name={micMuted ? "muted-microphone" : "microphone"}
                                        color={theme.palette?.iconColor?.primary}
                                    />
                                </Fab>
                            </Tooltip>
                        )}
                    </Grid>
                </Grid>
            </Grid>
        )
    );

    const avatarOrPlayer = () => (
        <>
            {useAvatar ? <DummyCard /> : (
                <CustomizedVideo
                    ref={refVideo}
                    playsInline
                    muted
                    style={{ transform: isMine ? "rotateY(180deg)" : "none", objectFit: "contain" }}
                />
            )}
        </>
    );

    return (
        <Grid
            container
            style={{ height: "100%", width: "100%", position: "relative" }}
            onMouseEnter={() => setDisplayHover(true)}
            onMouseLeave={() => setDisplayHover(false)}
        >
            {overlayButtonsGroup()}
            <Box
                className="single-video-card"
                id={`card-${trackAssignment.streamId || ""}`}
                style={{
                    height: isMobileView ? "40%" : "100%",
                    width: isMobileView ? "20%" : "100%",
                    position: "relative",
                    borderRadius: 4,
                    margin: isMobileView ? 30 : 0,
                    overflow: "hidden",
                }}
            >
                {avatarOrPlayer()}
                {isTalkingFrameVisible && <div className="talking-indicator-light" />}
                {name && (
                    <Typography className="name-indicator" color="#fff" align="left">
                        {name}
                    </Typography>
                )}
            </Box>
        </Grid>
    );
};

export default VideoCard;