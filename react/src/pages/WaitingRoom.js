import React, { useContext } from "react";
import {
  Grid,
  Typography,
  Button,
  TextField,
  Container,
  Tooltip,
  Modal
} from "@mui/material";
import VideoCard from "Components/Cards/VideoCard";
import MicButton, {
  CustomizedBtn,
  roundStyle,
} from "Components/Footer/Components/MicButton";
import CameraButton from "Components/Footer/Components/CameraButton";
import { useParams } from "react-router-dom";
import { AntmediaContext, AntmediaSpeedTestContext, SpeedTestObjectContext } from "App";
import { useTranslation } from "react-i18next";
import { SettingsDialog } from "Components/Footer/Components/SettingsDialog";
import { SvgIcon } from "Components/SvgIcon";
import { useSnackbar } from "notistack";
import {MediaSettingsContext} from "./AntMedia";
import {Box} from "@mui/system";
import { getRoomNameAttribute ,getRootAttribute } from "../utils";



function WaitingRoom(props) {
  const { id } = useParams();
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectFocus, setSelectFocus] = React.useState(null);

  let timer;
  const [count, setCount] = React.useState(0);
  const [buttonVisibility, setButtonVisibility] = React.useState({visibility: "hidden"});

  //const roomName = id;
  const roomName =  getRootAttribute("data-room-name");
  const antmedia = useContext(AntmediaContext);
  const mediaSettings = useContext(MediaSettingsContext);
  const { roomJoinMode } = mediaSettings;
  const antmediaSpeedTest = useContext(AntmediaSpeedTestContext);
  const speedTestObject = useContext(SpeedTestObjectContext);
  const { enqueueSnackbar } = useSnackbar();
  const { speedTestBeforeLogin, speedTestBeforeLoginModal, setSpeedTestBeforeLoginModal, setLeftTheRoom } = React.useContext(MediaSettingsContext);

  React.useEffect(() => 
  {
    if(!antmedia.onlyDataChannel) {
      antmedia.mediaManager.localVideo = document.getElementById("localVideo");
      antmedia.mediaManager.localVideo.srcObject =
          antmedia.mediaManager.localStream;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateCount = () => {
    timer = !timer && setInterval(() => {
      setCount(count + 1)
    }, 5000)
  };

  React.useEffect(() => {
    updateCount()

    if (speedTestObject.isfinished === true) {
      setButtonVisibility({visibility: "visible"});
    } else {
      setButtonVisibility({visibility: "hidden"});
    }

    return () => clearInterval(timer)
  }, )

  function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  function joinRoom(e) {
    var generatedStreamId = props.streamName.replace(/[\W_]/g, "") + "_" + makeid(10);
    console.log("generatedStreamId:"+generatedStreamId);
    if (antmedia.mediaManager.localStream === null && antmedia.onlyDataChannel === false) {
      e.preventDefault();
      enqueueSnackbar(
        {
          message: t(
            "You need to allow microphone and camera permissions before joining"
          ),
          variant: "info",
          icon: <SvgIcon size={24} name={"muted-microphone"} color="#fff" />,
        },
        {
          autoHideDuration: 1500,
        }
      );
      return;
    } else if (speedTestBeforeLogin && antmedia.onlyDataChannel !== true) {
      antmediaSpeedTest.publish(generatedStreamId + "SpeedTest", "");
      e.preventDefault();
      setSpeedTestBeforeLoginModal(true);
    } else if (speedTestBeforeLogin) {
      antmediaSpeedTest.play(roomName + "SpeedTest", "");
      e.preventDefault();
      setSpeedTestBeforeLoginModal(true);
    } else {
      antmedia.joinRoom(roomName, generatedStreamId, roomJoinMode);
      props.handleChangeRoomStatus("meeting");
    }
  }
  const handleDialogOpen = (focus) => {
    if (false && antmedia.mediaManager.localStream === null) {
      enqueueSnackbar(
        {
          message: t(
            "You need to allow microphone and camera permissions before changing settings"
          ),
          variant: "info",
          icon: <SvgIcon size={24} name={"muted-microphone"} color="#fff" />,
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

  return (
        <Container>
          <SettingsDialog
              open={dialogOpen}
              onClose={handleDialogClose}
              selectFocus={selectFocus}
              handleBackgroundReplacement={props.handleBackgroundReplacement}
          />


          <Grid
              container
              spacing={4}
              justifyContent="space-between"
              alignItems={"center"}
          >

            { antmedia.onlyDataChannel === false ?
            <Grid item md={7} alignSelf="stretch">
              <Grid
                  container
                  className="waiting-room-video"
                  sx={{position: "relative"}}
              >
                <VideoCard id="localVideo" autoPlay muted hidePin={true}/>

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
              <Typography align="center" color="black" sx={{mt: 2}}>
                {t(
                    "You can choose whether to open your camera and microphone before you get into room"
                )}
              </Typography>
            </Grid>
            : null}

            <Modal
                open={speedTestBeforeLoginModal}
                onClose={()=>{console.log("close")}}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
              {/* spead text MSG */}
              <Box sx = {{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                bgcolor: 'green.70',
                border: '2px solid #000',
                boxShadow: 24,
                pt: 2,
                px: 4,
                pb: 3,
              }}>
                <Typography id="modal-modal-title" variant="h6" component="h2"   sx={{position: "center"}}>
                  Connection Test
                </Typography>
                <Typography id="modal-modal-description" sx={{ mt: 2, color: "black" }}>
                  {speedTestObject.message}
                </Typography>
                <Button sx={buttonVisibility} onClick={()=>{
                  setSpeedTestBeforeLoginModal(false);
                  setLeftTheRoom(true);
                  speedTestObject.message = "Please wait while we are testing your connection speed";
                  speedTestObject.isfinished = false;
                }}>Close</Button>
                <Button sx={buttonVisibility} onClick={()=>{
                  antmedia.joinRoom(roomName, undefined, roomJoinMode);
                  props.handleChangeRoomStatus("meeting");
                  speedTestObject.message = "Please wait while we are testing your connection speed";
                  speedTestObject.isfinished = false;
                }}>Join</Button>
              </Box>
            </Modal>

            <Grid item md={antmedia.onlyDataChannel === false ? 4 : 12}>
              <Grid container justifyContent={"center"}>
              <Grid container justifyContent={"center"}>
                  <Typography variant="h5"  color="black" align="center">
                    {t("Welcome")}
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
                    {" "}
                  </Typography>
                </Grid>
                <form
                    onSubmit={(e) => {
                      joinRoom(e);
                    }}
                >
                  <Grid item xs={12} sx={{mt: 3, mb: 4}}>
                    <TextField
                        autoFocus
                        required
                        fullWidth
                        value={props.streamName}
                        variant="outlined"
                        // onChange={(e) => props.handleStreamName(e.target.value)}
                        placeholder={t("Your name")}
                        readOnly={true}
                        id="participant_name"
                        inputProps={{ style: { color: "black" } }}
                    />
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
