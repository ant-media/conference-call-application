import React from "react";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import styled from "@mui/material/styles/styled";
import InfoButton from "./Components/InfoButton";
import MicButton from "./Components/MicButton";
import RequestPublishButton from "./Components/RequestPublishButton";
import CameraButton from "./Components/CameraButton";
import OptionButton from "./Components/OptionButton";
import ShareScreenButton from "./Components/ShareScreenButton";
import MessageButton from "./Components/MessageButton";
import ParticipantListButton from "./Components/ParticipantListButton";
import EndCallButton from "./Components/EndCallButton";
import TimeZone from "./Components/TimeZone";
import {AntmediaContext} from "../../App";
import PublisherRequestListButton from "./Components/PublisherRequestListButton";

const CustomizedGrid = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.palette.green[80],
  position: "absolute",
  bottom: 0,
  left: 0,
  padding: 16,
  width: "100%",
  zIndex: 2,
  height: 80,
}));
function Footer(props) {
  const antmedia = React.useContext(AntmediaContext);

    return (
        <CustomizedGrid
            container
            alignItems={"center"}
            justifyContent={{xs: "center", sm: "space-between"}}
        >
          <Grid item sx={{display: {xs: "none", sm: "block"}}}>
            <Grid container alignItems={"center"}>
              <Typography color="black" variant="body1">
                {antmedia.roomName}
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

                  {antmedia.onlyDataChannel === false ?
                  <Grid item xs={0}>
                    <CameraButton {...props} footer/>
                  </Grid>
                    : null}

                  {antmedia.onlyDataChannel === false ?
                  <Grid item xs={0}>
                    <MicButton footer/>
                  </Grid>
                      : null}

                  <Grid item xs={0}>
                    <MessageButton footer/>
                  </Grid>

                  {antmedia.onlyDataChannel === false ?
                  <Grid item xs={0}>
                    {" "}
                    <ShareScreenButton footer/>
                  </Grid>
                      : null}

                  {antmedia.onlyDataChannel === false ?
                  <Grid item xs={0}>
                      <ParticipantListButton footer />
                  </Grid>
                 : null}

                  {antmedia.admin === true ?
                    <Grid item xs={0}>
                      <PublisherRequestListButton footer />
                    </Grid>
                      : null}

                  {antmedia.onlyDataChannel !== false ?
                      <Grid item xs={0}>
                        <RequestPublishButton footer/>
                      </Grid>
                      : null}

                  <Grid item xs={0}>
                    <EndCallButton footer/>
                  </Grid>
                </Grid>
              </Grid>

          <Grid item sx={{display: {xs: "none", sm: "block"}}}>
            <TimeZone />
          </Grid>
        </CustomizedGrid>
    );
}

export default Footer;
