import React from "react";
import {
    Box,
    Button,
    CircularProgress,
    Container,
    Grid,
    Modal,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import VideoCard from "Components/Cards/VideoCard";
import MicButton, {roundStyle,} from "Components/Footer/Components/MicButton";
import CameraButton from "Components/Footer/Components/CameraButton";
import {useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import SettingsDialog from "Components/Footer/Components/SettingsDialog";
import {CustomizedBtn} from "Components/CustomizedBtn";

import {SvgIcon} from "Components/SvgIcon";
import {useSnackbar} from 'notistack';
import {getUrlParameter} from "@antmedia/webrtc_adaptor";
import {getRootAttribute, isComponentMode} from "utils";
import {useTheme} from "@mui/material/styles";
import {WebinarRoles} from "../WebinarRoles";
import TalkingIndicator from "../Components/TalkingIndicator";
import {UnitTestContext} from "./AntMedia";


function getPublishStreamId() {
    const dataRoomName = document.getElementById("root")?.getAttribute("data-publish-stream-id");
    return (dataRoomName) ? dataRoomName : getUrlParameter("streamId");
}

var enterDirectly = getUrlParameter("enterDirectly");
if (enterDirectly == null || typeof enterDirectly === "undefined") {
    enterDirectly = false;
}

var skipSpeedTest = getUrlParameter("skipSpeedTest");
if (skipSpeedTest == null || typeof skipSpeedTest === "undefined") {
    skipSpeedTest = false;
}

function WaitingRoom(props) {
    // eslint-disable-next-line
    const id = (isComponentMode()) ? getRootAttribute("data-room-name") : useParams().id;
    const publishStreamId = getPublishStreamId()
    const {t} = useTranslation();
    const [dialogOpen, setDialogOpen] = React.useState(false);

    const [selectFocus, setSelectFocus] = React.useState(null);

    const [isSpeedTestModalVisible, setSpeedTestModelVisibility] = React.useState(props.isSpeedTestModalVisibleForTestPurposes ? props.isSpeedTestModalVisibleForTestPurposes : false);

    const [speedTestModalButtonVisibility, setSpeedTestModalButtonVisibility] = React.useState(props.speedTestModalButtonVisibilityForTestPurposes ? props.speedTestModalButtonVisibilityForTestPurposes : false);

    const theme = useTheme();

    const roomName = id;

    const {enqueueSnackbar} = useSnackbar();

    window.conference = React.useContext(UnitTestContext);

    // This is a temporary video track assignment for local video
    // It is used to show local video in the waiting room
    // After we get publish stream id, we will create real video track assignment
    const tempVTA = {
        videoLabel: "localVideo",
        track: null,
        streamId: "localVideo",
        isMine: true
    };


    React.useEffect(() => {

        if (!props?.isPlayOnly && props?.initialized) {
            const tempLocalVideo = document.getElementById("localVideo");
            props?.localVideoCreate(tempLocalVideo);
        }

        // eslint-disable-next-line
    }, [props?.initialized]);

    function joinRoom(e) {
        let isVideoTrackHealthy = props?.checkVideoTrackHealth();
        if (!isVideoTrackHealthy) {
            enqueueSnackbar(
                {
                    message: t(
                        "Your camera is not working properly. Please check your camera settings"
                    ),
                    variant: "error",
                    icon: <SvgIcon size={24} name={"muted-camera"} color="#fff"/>,
                },
                {
                    autoHideDuration: 1500,
                }
            );
            return;
        }
        if (props?.localVideo === null && props?.isPlayOnly === false) {
            e.preventDefault();
            enqueueSnackbar(
                {
                    message: t(
                        "You need to allow microphone and camera permissions before joining"
                    ),
                    variant: "info",
                    icon: <SvgIcon size={24} name={"muted-microphone"} color="#fff"/>,
                },
                {
                    autoHideDuration: 1500,
                }
            );
            return;
        }
        let streamId;
        if (publishStreamId === null || publishStreamId === undefined) {
            streamId = props?.streamName.replace(/[\W_]/g, "") + "_" + props?.makeid(10);
            console.log("generatedStreamId:" + streamId);
        } else {
            streamId = publishStreamId;
        }

        if (process.env.REACT_APP_SPEED_TEST_BEFORE_JOINING_THE_ROOM === 'true' && enterDirectly === false && skipSpeedTest == false) {
            if (props?.speedTestStreamId) {
                props.speedTestStreamId.current = streamId;
            }

            // If speed test already completed in background, join directly
            if (props?.speedTestObject?.isfinished === true) {
                props?.setIsJoining(true);
                props?.joinRoom(roomName, streamId);
                if (props?.isPlayOnly) {
                    setDialogOpen(false);
                }
                return;
            }

            // If speed test is still running or not started, show the modal
            setSpeedTestModelVisibility(true);

            // Only start speed test if not already running (progress is at initial state)
            if (!props?.speedTestObject?.progressValue || props?.speedTestObject?.progressValue <= 10) {
                let speedTestObjectDefault = {};
                speedTestObjectDefault.message = "Please wait while we are testing your connection speed";
                speedTestObjectDefault.isfinished = false;
                speedTestObjectDefault.isfailed = false;
                speedTestObjectDefault.errorMessage = "";
                speedTestObjectDefault.progressValue = 10;
                props?.setSpeedTestObject(speedTestObjectDefault);
                props?.startSpeedTest();
            }
        } else {
            props?.setIsJoining(true);
            props?.joinRoom(roomName, streamId);
            if (props?.isPlayOnly) {
                setDialogOpen(false);
            }
        }
    }

    React.useEffect(() => {
        if (props?.speedTestObject?.isfinished === true) {
            setSpeedTestModalButtonVisibility(true);
        }
    }, [props?.speedTestObject]);

    const handleDialogOpen = (focus) => {
        if (props?.localVideo === null) {
            enqueueSnackbar(
                {
                    message: t(
                        "You need to allow microphone and camera permissions before changing settings"
                    ),
                    variant: "info",
                    icon: <SvgIcon size={24} name={"muted-microphone"} color="#fff"/>,
                },
                {
                    autoHideDuration: 1500,
                }
            );
            return;
        }
        setSelectFocus(focus);
        setDialogOpen(true);
    };
    const handleDialogClose = (value) => {
        setDialogOpen(false);
    };

    const speedTestModalJoinButton = () => {
        props?.setSpeedTestObject({
            message: "Please wait while we are testing your connection speed",
            isfinished: false
        });
        setSpeedTestModalButtonVisibility(false);
        setSpeedTestModelVisibility(false);
        props?.setIsJoining(true);
        if (props?.speedTestStreamId) {
            props?.joinRoom(roomName, props.speedTestStreamId.current);
        } else {
            props?.joinRoom(roomName, props?.makeId(10));
        }
        if (props?.isPlayOnly) {
            props?.setWaitingOrMeetingRoom("meeting");
            setDialogOpen(false);
            props?.setIsJoining(false);
        }
    }

    const speedTestModalCloseButton = () => {
        props?.setSpeedTestObject({
            message: "Please wait while we are testing your connection speed",
            isfinished: false,
            isfailed: false,
            errorMessage: "",
            progressValue: 10
        });
        
        setSpeedTestModalButtonVisibility(false);
        setSpeedTestModelVisibility(false);
        props?.stopSpeedTest();
    }

    function CircularProgressWithLabel(
        propsLocal
    ) {
        return (
            <Box sx={props?.speedTestObject?.isfailed ?
                {visibility: "hidden", position: 'relative', display: 'inline-flex'} : {visibility: "visible",position: 'relative', display: 'inline-flex'}}>
                <CircularProgress variant="determinate" {...propsLocal} />
                <Box
                    sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography
                        variant="caption"
                        component="div"
                        color="themeColor.100"
                        visibility={props?.speedTestObject?.isfailed ? "hidden" : speedTestModalButtonVisibility ? "hidden" : "visible"}
                    >{`${Math.round(propsLocal.value)}%`}</Typography>
                </Box>
            </Box>
        );
    }

    /* istanbul ignore next */
    return (
        <Container
            id="waiting-room"
        >
            <SettingsDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                selectFocus={selectFocus}
                handleBackgroundReplacement={props.handleBackgroundReplacement}
                microphoneSelected={(mic) => props?.microphoneSelected(mic)}
                devices={props?.devices}
                selectedCamera={props?.selectedCamera}
                cameraSelected={(camera) => props?.cameraSelected(camera)}
                selectedMicrophone={props?.selectedMicrophone}
                selectedBackgroundMode={props?.selectedBackgroundMode}
                setSelectedBackgroundMode={(mode) => props?.setSelectedBackgroundMode(mode)}
                videoSendResolution={props?.videoSendResolution}
                setVideoSendResolution={(resolution) => props?.setVideoSendResolution(resolution)}
            />

            <Modal
                open={isSpeedTestModalVisible}
                onClose={() => {
                }}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'themeColor.70',
                    border: '2px solid #000',
                    boxShadow: 24,
                    pt: 2,
                    px: 4,
                    pb: 3,
                    textAlign: "center",
                }}>
                    <Typography id="modal-modal-title" variant="h6" component="h2" sx={{position: "center"}}>
                        Connection Test
                    </Typography>
                    <Typography id="modal-modal-description"
                                sx={{mt: 2, color: theme.palette.text.primary, marginTop: '12px', marginBottom: '21px',
                                    display: props?.speedTestObject?.errorMessage !== "" ? "none" : "block"

                                }}>
                        {props?.speedTestObject?.message}
                    </Typography>
                    <Box sx={props?.speedTestObject?.isfailed ? {
                          display: 'none', justifyContent: 'center', alignItems: 'center'
                    } : { display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                        <CircularProgressWithLabel
                             id={"speed-test-modal-circle-progress-bar"}
                             sx={(speedTestModalButtonVisibility) ? {
                             display: 'none'
                        } : {display: 'block'}} value={props?.speedTestObject?.progressValue ?? ""}/>
                    </Box>
                    <Typography id="modal-modal-error-description" sx={{
                        mt: 2,
                        color: theme.palette.text.primary,
                        marginTop: '12px',
                        marginBottom: '21px',
                        display: props?.speedTestObject?.isfailed ? "block" : "none"
                        
                    }}>
                        {props?.speedTestObject?.errorMessage}
                    </Typography>
    
                    <Button
                        id={"speed-test-modal-close-button"}
                        sx={(props?.speedTestObject?.isfailed || speedTestModalButtonVisibility) ? {display: "inline-flex"} : {display:"none"}}
                        onClick={() => {
                            speedTestModalCloseButton();
                        }}>Close</Button>
                    <Button
                        id={"speed-test-modal-join-button"}
                        sx={(speedTestModalButtonVisibility) ? {display: "inline-flex"} : {display: "none"}}
                            onClick={() => {
                                speedTestModalJoinButton();
                            }}>Join</Button>
                </Box>
            </Modal>

            <Grid
                container
                spacing={4}
                justifyContent={props?.role !== WebinarRoles.TempListener ? "space-between" : "center"}
                alignItems={"center"}
            >

                {props.isPlayOnly === false ?
                    <Grid item md={7} alignSelf="stretch">
                        <Grid
                            container
                            className="waiting-room-video"
                            sx={{position: "relative"}}
                        >
                            <div style={{position: "relative", width: "100%", height: "100%"}}>
                                <TalkingIndicator
                                    trackAssignment={tempVTA}
                                    isTalking={props?.isTalking}
                                    streamId={props?.publishStreamId}
                                    talkers={props?.talkers}
                                    setAudioLevelListener={props?.setAudioLevelListener}
                                />
                                <VideoCard
                                    trackAssignment={tempVTA}
                                    autoPlay
                                    muted
                                    hidePin={true}
                                    streamName={props?.streamName}
                                    isPublished={props?.isPublished}
                                    isPlayOnly={props?.isPlayOnly}
                                    isMyMicMuted={props?.isMyMicMuted}
                                    isMyCamTurnedOff={props?.isMyCamTurnedOff}
                                    allParticipants={props?.allParticipants}
                                    setParticipantIdMuted={(participant) => props?.setParticipantIdMuted(participant)}
                                    turnOnYourMicNotification={(streamId) =>props?.turnOnYourMicNotification(streamId)}
                                    turnOffYourMicNotification={(streamId) =>props?.turnOffYourMicNotification(streamId)}
                                    turnOffYourCamNotification={(streamId) =>props?.turnOffYourCamNotification(streamId)}
                                    pinVideo={(streamId)=>props?.pinVideo(streamId)}
                                    isAdmin={props?.isAdmin}
                                    publishStreamId={props?.publishStreamId}
                                    localVideo={props?.localVideo}
                                    localVideoCreate={(tempLocalVideo) => props?.localVideoCreate(tempLocalVideo)}
                                />
                            </div>

                                <Grid
                                    container
                                    columnSpacing={2}
                                    justifyContent="center"
                                    alignItems="center"
                                    sx={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        p: 2,
                                        zIndex: 10,
                                    }}
                                >
                                    <Grid item>
                                        <CameraButton
                                            rounded={true}
                                            footer={false}
                                            isCamTurnedOff={props?.isMyCamTurnedOff}
                                            cameraButtonDisabled={props?.cameraButtonDisabled}
                                            onTurnOffCamera={props?.checkAndTurnOffLocalCamera}
                                            onTurnOnCamera={props?.checkAndTurnOnLocalCamera}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <MicButton
                                            rounded={true}
                                            footer={false}
                                            isMicMuted={props?.isMyMicMuted}
                                            toggleMic={props?.toggleMic}
                                            microphoneButtonDisabled={props?.microphoneButtonDisabled}
                                        />
                                    </Grid>
                                    <Grid item sx={{position: "absolute", bottom: 16, right: 16}}>
                                        <Tooltip title={t("More options")} placement="top">
                                            <CustomizedBtn
                                                variant="contained"
                                                color="secondary"
                                                sx={roundStyle}
                                                onClick={() => handleDialogOpen()}
                                                id="waiting-room-more-options"
                                            >
                                                <SvgIcon size={40} name={"settings"}
                                                         color={theme.palette?.iconColor?.primary}/>
                                            </CustomizedBtn>
                                        </Tooltip>
                                    </Grid>
                                </Grid>
                        </Grid>
                        <Typography align="center" color={theme.palette?.chatText} sx={{mt: 2}}>
                            {t(
                                "You can choose whether to open your camera and microphone before you get into room"
                            )}
                        </Typography>
                        {props?.role === WebinarRoles.TempListener ? (
                            <form
                                data-testid="temp-listener-join-form"
                                onSubmit={(e) => {
                                e.preventDefault();
                                joinRoom(e);
                            }}>
                            <Grid container justifyContent={"center"}>
                                <Grid item sm={6} xs={12}>
                                    <Button
                                        fullWidth
                                        color="secondary"
                                        variant="contained"
                                        type="submit"
                                        id="room_join_button"
                                    >
                                        {t("I'm ready to join")}
                                    </Button>
                                </Grid>
                            </Grid>
                            </form>) : null}
                    </Grid>
                    : null}

                {props?.role !== WebinarRoles.TempListener ? (
                <Grid item md={props?.isPlayOnly === false ? 4 : 12}>
                    <Grid container justifyContent={"center"}>
                        <Grid container justifyContent={"center"}>
                            <Typography variant="h5" align="center">
                                {t("What's your name?")}
                            </Typography>
                        </Grid>
                        <Grid
                            container
                            justifyContent={"center"}
                            sx={{mt: {xs: 1, md: 2.5}}}
                        >
                            <Typography
                                variant="h6"
                                align="center"
                                fontWeight={"400"}
                                style={{fontSize: 18}}
                            >
                                {t(
                                    "Please enter your name. This will be visible to the host and other participants."
                                )}{" "}
                            </Typography>
                        </Grid>

                        <form
                            data-testid="join-form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                joinRoom(e);
                            }}
                        >
                            <Grid item xs={12} sx={{mt: 3, mb: 4}}>
                                {process.env.REACT_APP_WAITING_ROOM_PARTICIPANT_NAME_READONLY === 'true' ?
                                    <TextField
                                        autoFocus
                                        required
                                        fullWidth
                                        color="primary"
                                        value={props?.streamName ?? ""}
                                        variant="outlined"
                                        placeholder={t("Your name")}
                                        readOnly={true}
                                        id="participant_name"
                                        autocomplete="given-name"
                                    />
                                    : <TextField
                                        autoFocus
                                        required
                                        fullWidth
                                        color="primary"
                                        value={props?.streamName ?? ""}
                                        variant="outlined"
                                        onChange={(e) => props?.setStreamName(e.target.value)}
                                        placeholder={t("Your name")}
                                        id="participant_name"
                                        autocomplete="given-name"
                                    />}
                            </Grid>
                            <Grid container justifyContent={"center"}>
                                <Grid item sm={6} xs={12}>
                                    <Button
                                        fullWidth
                                        color="secondary"
                                        variant="contained"
                                        type="submit"
                                        id="room_join_button"
                                        data-testid="join-room-button"
                                    >
                                        {t("I'm ready to join")}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </Grid>
                </Grid>
                ) : null}
            </Grid>
        </Container>
    );
}

export default WaitingRoom;
