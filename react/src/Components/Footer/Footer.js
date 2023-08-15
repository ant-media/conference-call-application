import React from "react";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import styled from "@mui/material/styles/styled";
import InfoButton from "./Components/InfoButton";
import MicButton from "./Components/MicButton";
import CameraButton from "./Components/CameraButton";
import OptionButton from "./Components/OptionButton";
import ShareScreenButton from "./Components/ShareScreenButton";
import MessageButton from "./Components/MessageButton";
import ParticipantListButton from "./Components/ParticipantListButton";
import EndCallButton from "./Components/EndCallButton";
import TimeZone from "./Components/TimeZone";
import { useParams } from "react-router-dom";
import { ConferenceContext } from 'pages/AntMedia';

function getRoomName() {
  // if it returns data-room-name element, it means that we are using conference app in component mode
  return document.getElementById("root").getAttribute("data-room-name");
}

const getCustomizedGridStyle = (theme) => {
  let customizedGridStyle = {
    backgroundColor: theme.palette.green[80],
    position: "fixed",
    bottom: 0,
    left: 0,
    padding: 16,
    width: "100vw",
    zIndex: 2,
    height: 80,
  };

  if (getRoomName()) {
    customizedGridStyle.position = "absolute";
    customizedGridStyle.width = "100%";
  }

  return customizedGridStyle;
}

const CustomizedGrid = styled(Grid)(({ theme }) => (getCustomizedGridStyle(theme)));

function Footer(props) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const id = (getRoomName()) ? getRoomName() : useParams().id;
  const conference = React.useContext(ConferenceContext);

    return (
        <CustomizedGrid
            container
            alignItems={"center"}
            justifyContent={{xs: "center", sm: "space-between"}}
        >
          <Grid item sx={{display: {xs: "none", sm: "block"}}}>
            <Grid container alignItems={"center"}>
              <a href="https://antmedia.io/circle" alt="Circle" target="_blank" rel="noreferrer">
                <img src="./favicon-32x32.png" alt="Antmedia Circle" style={{width: '22px', marginRight: 4}}/>
              </a>
              <Typography color="#ffffff" variant="body1">
                {id}
              </Typography>
              <InfoButton/>
            </Grid>
          </Grid>
              <Grid item>
                <Grid
                    container
                    justifyContent="center"
                    columnSpacing={{xs: 1, sm: 2}}
                >
                  <Grid item xs={0}>
                    <OptionButton footer/>
                  </Grid>

                  {conference.isPlayOnly === false ?
                  <Grid item xs={0}>
                    <CameraButton {...props} footer/>
                  </Grid>
                    : null}

                  {conference.isPlayOnly === false ?
                  <Grid item xs={0}>
                    <MicButton footer/>
                  </Grid>
                      : null}

                  {conference.isPlayOnly === false ?
                  <Grid item xs={0}>
                    {" "}
                    <ShareScreenButton footer/>
                  </Grid>
                      : null}

                  <Grid item xs={0}>
                    <MessageButton footer/>
                  </Grid>
                  <Grid item xs={0}>
                      <ParticipantListButton footer />
                  </Grid>
                  <Grid item xs={0}>
                    <EndCallButton footer/>
                  </Grid>
                </Grid>
              </Grid>

          <Grid item sx={{display: {xs: "none", sm: "block"}}}>
            <TimeZone/>
          </Grid>
        </CustomizedGrid>
    );
}

export default Footer;
