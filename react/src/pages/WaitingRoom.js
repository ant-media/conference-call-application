import React, { useContext } from "react";
import { Grid, Typography, Button, TextField, Container } from "@mui/material";
import VideoCard from "Components/Cards/VideoCard";
import MicButton, {
  CustomizedBtn,
  roundStyle,
} from "Components/Footer/Components/MicButton";
import CameraButton from "Components/Footer/Components/CameraButton";
import { useParams } from "react-router-dom";
import { AntmediaContext } from "App";
import { useTranslation } from "react-i18next";
import { SettingsDialog } from "Components/Footer/Components/SettingsDialog";
import { SvgIcon } from "Components/SvgIcon";

function WaitingRoom(props) {
  const { id } = useParams();
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectFocus, setSelectFocus] = React.useState(null);

  const roomName = id;
  const antmedia = useContext(AntmediaContext);
  React.useEffect(() => {
    antmedia.mediaManager.localVideo = document.getElementById("localVideo");
    antmedia.mediaManager.localVideo.srcObject =
      antmedia.mediaManager.localStream;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function joinRoom() {
    antmedia.joinRoom(roomName, undefined);
    props.handleChangeRoomStatus("meeting");
  }
  const handleDialogOpen = (focus) => {
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
      />
      <Grid
        container
        spacing={4}
        justifyContent="space-between"
        alignItems={"center"}
      >
        <Grid item md={7} alignSelf="stretch">
          <Grid
            container
            className="waiting-room-video"
            sx={{ position: "relative" }}
          >
            <VideoCard id="localVideo" autoPlay muted hidePin={true} />
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
                <CameraButton rounded />
              </Grid>
              <Grid item>
                <MicButton rounded />
              </Grid>
              <Grid item sx={{ position: "absolute", bottom: 16, right: 16 }}>
                <CustomizedBtn
                  variant="contained"
                  color="secondary"
                  sx={roundStyle}
                  onClick={() => handleDialogOpen()}
                >
                  <SvgIcon size={40} name={"settings"} color={"white"} />
                </CustomizedBtn>
              </Grid>
            </Grid>
          </Grid>
          <Typography align="center" color="#DDFFFC" sx={{ mt: 2 }}>
            {t(
              "You can choose whether to open your camera and microphone before you get into room"
            )}
          </Typography>
        </Grid>
        <Grid item md={4}>
          <Grid container justifyContent={"center"}>
            <Grid container justifyContent={"center"}>
              <Typography variant="h5" align="center" color={"white"}>
                {t("What's your name?")}
              </Typography>
            </Grid>
            <Grid
              container
              justifyContent={"center"}
              sx={{ mt: { xs: 1, md: 2.5 } }}
            >
              <Typography
                variant="h6"
                align="center"
                color={"white"}
                fontWeight={"400"}
                style={{ fontSize: 18 }}
              >
                {t(
                  "Please enter your name, this will be visible to the host and other participants."
                )}{" "}
              </Typography>
            </Grid>

            <form
              onSubmit={() => {
                joinRoom();
              }}
            >
              <Grid item xs={12} sx={{ mt: 3, mb: 4 }}>
                <TextField
                  autoFocus
                  required
                  fullWidth
                  color="primary"
                  value={props.streamName}
                  variant="outlined"
                  onChange={(e) => props.handleStreamName(e.target.value)}
                  placeholder={t("Your name")}
                />
              </Grid>
              <Grid container justifyContent={"center"}>
                <Grid item sm={6} xs={12}>
                  <Button
                    fullWidth
                    color="secondary"
                    variant="contained"
                    type="submit"
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
