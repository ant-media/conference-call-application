import React, { useCallback, useState, useRef } from "react";
import { alpha, styled } from "@mui/material/styles";
import DummyCard from "./DummyCard";
import { Grid, Typography, useTheme, Box, Tooltip, Fab } from "@mui/material";
import { SvgIcon } from "../SvgIcon";
import { useTranslation } from "react-i18next";
import { isMobile, isTablet } from "react-device-detect";
import {parseMetaData} from "../../utils";

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
    const { t } = useTranslation();
    const [displayHover, setDisplayHover] = useState(false);
    const theme = useTheme();

    const refVideo = useCallback((node) => {
        if (node && props.trackAssignment.track) {
            const newStream = new MediaStream([props.trackAssignment.track]);
            if (node.srcObject !== newStream) {
                node.srcObject = newStream;
                node.play().catch((e) =>
                    console.error("Video playback failed:", e)
                );
            }
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

    const micMuted = isMine
        ? props?.isMyMicMuted
        : parseMetaData(
            props?.allParticipants?.[props.trackAssignment.streamId]?.metaData,
            "isMicMuted"
        );

    const useAvatar = isMine
        ? props?.isMyCamTurnedOff
        : !parseMetaData(
            props?.allParticipants?.[props.trackAssignment.streamId]?.metaData,
            "isCameraOn"
        ) &&
        !parseMetaData(
            props?.allParticipants?.[props.trackAssignment.streamId]?.metaData,
            "isScreenShared"
        );



    // istanbul ignore next
    const OverlayButton = ({ title, icon, color, onClick, label }) => (
        // istanbul ignore next
        <Tooltip title={title} placement="top" style={{margin: '2px'}}>
            <Fab onClick={onClick} color={color} aria-label={label} size="small">
                <SvgIcon size={36} name={icon} color={theme.palette?.iconColor?.primary} />
            </Fab>
        </Tooltip>
    );

    const AdministrativeButtons = ({ micMuted, useAvatar }) => {
        const handleToggleMic = () => {
            const participant = {
                streamId: props.trackAssignment.streamId,
                streamName: props.name,
            };
            props?.setParticipantIdMuted(participant);
            micMuted
                ? props?.turnOnYourMicNotification(participant.streamId)
                : props?.turnOffYourMicNotification(participant.streamId);
        };

        const handleToggleCam = () => {
            const participant = {
                streamId: props.trackAssignment.streamId,
                streamName: props.name,
            };
            props?.setParticipantIdMuted(participant);
            props?.turnOffYourCamNotification(participant.streamId);
        };

        return (
            <>
                {(!useAvatar && process.env.REACT_APP_VIDEO_OVERLAY_ADMIN_MODE_ENABLED === "true") && (
                    <OverlayButton
                        title={`Camera ${useAvatar ? "off" : "on"} ${props.name}`}
                        icon={useAvatar ? "camera-off" : "camera"}
                        color={useAvatar ? "error" : "primary"}
                        label={useAvatar ? "turn-on-camera" : "turn-off-camera"}
                        onClick={handleToggleCam}
                    />
                )}
                <OverlayButton
                    title={`Microphone ${micMuted ? "on" : "off"} ${props.name}`}
                    icon={micMuted ? "muted-microphone" : "microphone"}
                    color={micMuted ? "error" : "primary"}
                    label={micMuted ? "unmute" : "mute"}
                    onClick={handleToggleMic}
                />
            </>
        );
    };

    const PinButton = () => (
        <OverlayButton
            title={`${props.pinned ? t("unpin") : t("pin")} ${props.name}`}
            icon={props.pinned ? "unpin" : "pin"}
            color="primary"
            label={props.pinned ? "unpin" : "pin"}
            onClick={() => {
                if(props.pinned) {
                    props?.unpinVideo(true);
                } 
                else {
                    props?.pinVideo(props.trackAssignment.streamId);
                }
            }}
        />
    );

    const renderOverlayButtons = useCallback(() => {
        if (props.hidePin) return null;

        const isAdminMode =
            process.env.REACT_APP_VIDEO_OVERLAY_ADMIN_MODE_ENABLED === "true";
        const isAdministrativeButtonsVisible =
            !props?.trackAssignment.isMine && (!isAdminMode || props?.isAdmin);

        return (
            <Grid
                container
                justifyContent="center"
                alignItems="center"
                className="pin-overlay"
                sx={{
                    opacity: displayHover ? 1 : 0,
                    pointerEvents: displayHover ? "auto" : "none",
                    transition: "opacity 0.3s ease",
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    zIndex: 100,
                }}
            >
                <Grid container justifyContent="center" alignItems="center" wrap="nowrap">
                    <Grid
                        item
                        container
                        justifyContent="center"
                        alignItems="center"
                        columnSpacing={0.5}
                    >
                        {!isMobile && !isTablet && <PinButton props={props} />}
                        {isAdministrativeButtonsVisible && (
                            <AdministrativeButtons props={props} micMuted={micMuted} useAvatar={useAvatar}/>
                        )}
                    </Grid>
                </Grid>
            </Grid>
        );
    }, [displayHover, props]);

    const videoStyle = React.useMemo(() => ({
        objectFit: "contain",
    }), []);

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
                        transform: isMine && props?.mirrorCamera ? "rotateY(180deg)" : "none",
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
                        style={videoStyle}
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
                        <CustomizedBox
                            id={"mic-muted-"+props.trackAssignment.streamId}
                            sx={cardBtnStyle}>
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

    React.useEffect(() => {
        let tempLocalVideo = document.getElementById(
            typeof props?.publishStreamId === "undefined"
                ? "localVideo"
                : props?.publishStreamId
        );
        if (props.trackAssignment.isMine && props?.localVideo !== tempLocalVideo) {
            props?.localVideoCreate(tempLocalVideo);
        }
    }, [props.trackAssignment.isMine, props.publishStreamId, props.localVideo, props.localVideoCreate]);

    const overlayVideoTitle = () => {
        return (
            props.name && (
                <div className="name-indicator">
                    <Typography color="#fff" align="left" className="name">
                        {props.name}{" "}
                        {process.env.NODE_ENV === "development"
                            ? `${props?.trackAssignment.isMine
                                ? props.trackAssignment.streamId +
                                " " +
                                props?.streamName
                                : props.trackAssignment.streamId + " " + props.trackAssignment.track?.id
                            }`
                            : ""}
                    </Typography>
                </div>
            )
        );
    }

    const filterVideoProps = (props) => {
        const allowedProps = [
            'autoPlay',
            'controls',
            'loop',
            'muted',
            'playsInline',
            'poster',
            'preload',
            'src',
            'width',
            'height',
        ];
        return Object.keys(props)
            .filter((key) => allowedProps.includes(key))
            .reduce((obj, key) => {
                obj[key] = props[key];
                return obj;
            }, {});
    };

    const videoProps = filterVideoProps(props);

    const handleMouseEnter = useCallback(() => {
        setDisplayHover(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setDisplayHover(false);
    }, []);

    const cardStyle = React.useMemo(() => ({
        height: "100%",
        width: "100%",
        position: "relative",
        borderRadius: 4,
        overflow: "hidden",
    }), []);

    return isMine || isVideoTrack ? (
        <>
        <Grid
            container
            style={{
                height: "100%",
                width: "100%",
                position: "relative",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {renderOverlayButtons()}
            <div
                className="single-video-card"
                id={'card-'+(props.trackAssignment.streamId !== undefined ? props?.trackAssignment.streamId : "")}
                style={cardStyle}
            >
                {renderAvatarOrPlayer()}
                {renderParticipantStatus()}
                {overlayVideoTitle()}
            </div>
        </Grid>
        </>
    ) : (
        //for audio tracks
        <>
            <video
                style={{ display: "none" }}
                {...videoProps}
                ref={refVideo}
                playsInline
            ></video>
        </>
    );
};

export default React.memo(VideoCard);
