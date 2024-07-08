import React, {useContext} from "react";
import {Box, Button, CircularProgress, Container, Grid, Modal, TextField, Tooltip, Typography,} from "@mui/material";
import VideoCard from "Components/Cards/VideoCard";
import MicButton, {CustomizedBtn, roundStyle,} from "Components/Footer/Components/MicButton";
import CameraButton from "Components/Footer/Components/CameraButton";
import {useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import SettingsDialog from "Components/Footer/Components/SettingsDialog";

import {SvgIcon} from "Components/SvgIcon";
import {useSnackbar} from "notistack";
import {ConferenceContext} from "./AntMedia";
import {getUrlParameter} from "@antmedia/webrtc_adaptor";
import {isComponentMode, getRoomNameAttribute} from "utils";
import {useTheme} from "@mui/material/styles";


function getPublishStreamId() {
    const dataRoomName = document.getElementById("root")?.getAttribute("data-publish-stream-id");
    return (dataRoomName) ? dataRoomName : getUrlParameter("streamId");
}

var enterDirectly = getUrlParameter("enterDirectly");
if (enterDirectly == null || typeof enterDirectly === "undefined") {
    enterDirectly = false;
}

function WaitingRoom(props) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const id = (isComponentMode()) ? getRoomNameAttribute() : useParams().id;
    const publishStreamId = getPublishStreamId()
    const {t} = useTranslation();
    const [dialogOpen, setDialogOpen] = React.useState(false);

    const [selectFocus, setSelectFocus] = React.useState(null);

    const [isSpeedTestModalVisible, setSpeedTestModelVisibility] = React.useState(props.isSpeedTestModalVisibleForTestPurposes ? props.isSpeedTestModalVisibleForTestPurposes : false);

    const [speedTestModalButtonVisibility, setSpeedTestModalButtonVisibility] = React.useState(props.speedTestModalButtonVisibilityForTestPurposes ? props.speedTestModalButtonVisibilityForTestPurposes : false);

    const theme = useTheme();

    const roomName = id;

    const conference = useContext(ConferenceContext);
    window.conference = conference;
    const {enqueueSnackbar} = useSnackbar();

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
        if (!conference.isPlayOnly && conference.initialized) {
            const tempLocalVideo = document.getElementById("localVideo");
            conference?.localVideoCreate(tempLocalVideo);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conference.initialized]);

    function joinRoom(e) {
        if (conference.localVideo === null && conference.isPlayOnly === false) {
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
            streamId = conference.streamName.replace(/[\W_]/g, "") + "_" + conference.makeid(10);
            console.log("generatedStreamId:" + streamId);
        } else {
            streamId = publishStreamId;
        }

        if (process.env.REACT_APP_SPEED_TEST_BEFORE_JOINING_THE_ROOM === 'true' && enterDirectly === false) {
            let speedTestObjectDefault = {};
            speedTestObjectDefault.message = "Please wait while we are testing your connection speed";
            speedTestObjectDefault.isfinished = false;
            speedTestObjectDefault.isfailed = false;
            speedTestObjectDefault.errorMessage = "";
            speedTestObjectDefault.progressValue = 10;

            conference?.setSpeedTestObject(speedTestObjectDefault);
            if (conference.speedTestStreamId) {
                conference.speedTestStreamId.current = streamId;
            }

            setSpeedTestModelVisibility(true);
            conference?.startSpeedTest();
        } else {
            conference?.setIsJoining(true);
            conference?.joinRoom(roomName, streamId);
            if (conference?.isPlayOnly) {
                conference?.setWaitingOrMeetingRoom("meeting");
                setDialogOpen(false);
                conference?.setIsJoining(false);
            }
        }
    }

    React.useEffect(() => {
        if (conference?.speedTestObject?.isfinished === true) {
            setSpeedTestModalButtonVisibility(true);
        }
    }, [conference?.speedTestObject]);

    const handleDialogOpen = (focus) => {
        if (conference.localVideo === null) {
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
        conference?.setSpeedTestObject({
            message: "Please wait while we are testing your connection speed",
            isfinished: false
        });
        setSpeedTestModalButtonVisibility(false);
        setSpeedTestModelVisibility(false);
        conference?.setIsJoining(true);
        if (conference?.speedTestStreamId) {
            conference?.joinRoom(roomName, conference?.speedTestStreamId.current);
        } else {
            conference?.joinRoom(roomName, conference?.makeId(10));
        }
        if (conference?.isPlayOnly) {
            conference?.setWaitingOrMeetingRoom("meeting");
            setDialogOpen(false);
            conference?.setIsJoining(false);
        }
    }

    const speedTestModalCloseButton = () => {
        conference?.setSpeedTestObject({
            message: "Please wait while we are testing your connection speed",
            isfinished: false,
            isfailed: false,
            errorMessage: "",
            progressValue: 10
        });
        setSpeedTestModalButtonVisibility(false);
        setSpeedTestModelVisibility(false);
    }

    function CircularProgressWithLabel(
        props
    ) {
        return (
            <Box sx={conference?.speedTestObject?.isfailed ?
                {visibility: "hidden", position: 'relative', display: 'inline-flex'} : {
                    visibility: "visible",
                    position: 'relative',
                    display: 'inline-flex'
                }}>
                <CircularProgress variant="determinate" {...props} />
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
                        visibility={conference?.speedTestObject?.isfailed ? "hidden" : speedTestModalButtonVisibility ? "hidden" : "visible"}
                    >{`${Math.round(props.value)}%`}</Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Container>
            <SettingsDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                selectFocus={selectFocus}
                handleBackgroundReplacement={conference.handleBackgroundReplacement}
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
                                sx={{mt: 2, color: "white", marginTop: '12px', marginBottom: '21px'}}>
                        {conference?.speedTestObject?.message}
                    </Typography>
                    <Box sx={conference?.speedTestObject?.isfailed ? {
                        visibility: "hidden", display: 'flex', justifyContent: 'center', alignItems: 'center'
                    } : {visibility: "visible", display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                        <CircularProgressWithLabel sx={(speedTestModalButtonVisibility) ? {
                            visibility: "hidden"
                        } : {visibility: "visible"}} value={conference?.speedTestObject?.progressValue}/>
                    </Box>
                    <Typography id="modal-modal-description" sx={{
                        mt: 2,
                        color: "white",
                        marginTop: '12px',
                        marginBottom: '21px',
                        visibility: conference?.speedTestObject?.isfailed ? "visible" : "hidden"
                    }}>
                        {conference?.speedTestObject?.errorMessage}
                    </Typography>
                    <Button sx={(speedTestModalButtonVisibility) ? {visibility: "visible"} : {visibility: "hidden"}}
                            onClick={() => {
                                speedTestModalCloseButton();
                            }}>Close</Button>
                    <Button
                        sx={(conference?.speedTestObject?.isfailed) ? {visibility: "visible"} : {visibility: "hidden"}}
                        onClick={() => {
                            //conference?.startSpeedTest();
                            speedTestModalCloseButton();
                        }}>Close</Button>
                    <Button sx={(speedTestModalButtonVisibility) ? {visibility: "visible"} : {visibility: "hidden"}}
                            onClick={() => {
                                speedTestModalJoinButton();
                            }}>Join</Button>
                </Box>
            </Modal>

            <Grid
                container
                spacing={4}
                justifyContent="space-between"
                alignItems={"center"}
            >

                {conference.isPlayOnly === false ?
                    <Grid item md={7} alignSelf="stretch">
                        <Grid
                            container
                            className="waiting-room-video"
                            sx={{position: "relative"}}
                        >
                            <VideoCard trackAssignment={tempVTA} autoPlay muted hidePin={true}/>

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
                                    <CameraButton rounded/>
                                </Grid>
                                <Grid item>
                                    <MicButton rounded/>
                                </Grid>
                                <Grid item sx={{position: "absolute", bottom: 16, right: 16}}>
                                    <Tooltip title={t("More options")} placement="top">
                                        <CustomizedBtn
                                            variant="contained"
                                            color="secondary"
                                            sx={roundStyle}
                                            onClick={() => handleDialogOpen()}
                                        >
                                            <SvgIcon size={40} name={"settings"} color={"white"}/>
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
                    </Grid>
                    : null}

                <Grid item md={conference.isPlayOnly === false ? 4 : 12}>
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
                                        value={conference.streamName}
                                        variant="outlined"
                                        placeholder={t("Your name")}
                                        readOnly={true}
                                        id="participant_name"
                                    />
                                    : <TextField
                                        autoFocus
                                        required
                                        fullWidth
                                        color="primary"
                                        value={conference.streamName}
                                        variant="outlined"
                                        onChange={(e) => conference.setStreamName(e.target.value)}
                                        placeholder={t("Your name")}
                                        id="participant_name"
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
                                    >
                                        {t("I'm ready to join")}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </Grid>
                </Grid>
            </Grid>
        </Container>
    );
}

export default WaitingRoom;
