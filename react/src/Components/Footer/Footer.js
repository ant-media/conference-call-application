import React from "react";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material";
import InfoButton from "./Components/InfoButton";
import MicButton from "./Components/MicButton";
import CameraButton from "./Components/CameraButton";
import OptionButton from "./Components/OptionButton";
import ShareScreenButton from "./Components/ShareScreenButton";
import MessageButton from "./Components/MessageButton";
import ParticipantListButton from "./Components/ParticipantListButton";
import EndCallButton from "./Components/EndCallButton";
import FakeParticipantButton from "./Components/FakeParticipantButton";
import TimeZone from "./Components/TimeZone";
import { useParams } from "react-router-dom";
import { ConferenceContext } from 'pages/AntMedia';
import {getRoomNameAttribute, isComponentMode} from 'utils';
import { isMobile, isTablet } from 'react-device-detect';
import ReactionsButton from "./Components/ReactionsButton";
import MoreOptionsButton from "./Components/MoreOptionsButton";
import FakeReconnectButton from "./Components/FakeReconnectButton";

const getCustomizedGridStyle = (theme) => {
  let customizedGridStyle = {
    backgroundColor: theme.palette.themeColor[80],
    position: "fixed",
    bottom: 0,
    left: 0,
    padding: 16,
    width: "100vw",
    zIndex: 101,
  };

  if (isComponentMode()) {
    customizedGridStyle.position = "absolute";
    customizedGridStyle.width = "100%";
  }

  return customizedGridStyle;
}

const CustomizedGrid = styled(Grid)(({ theme }) => (getCustomizedGridStyle(theme)));

function Footer(props) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const id = (isComponentMode()) ? getRoomNameAttribute() : useParams().id;
  const conference = React.useContext(ConferenceContext);

  const mobileBreakpoint = 900;

  const [, setIsRecordingTextVisible] = React.useState(false);

  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  React.useEffect(() => {
    //debugger;
    if (conference.isRecordPluginActive === true && conference.isEnterDirectly === false && conference.isPlayOnly === false) {
      setIsRecordingTextVisible(true);
    } else {
      setIsRecordingTextVisible(false);
    }
  }, [conference.isRecordPluginActive, conference.isEnterDirectly, conference.isPlayOnly]);

    return (
        <CustomizedGrid
            container
            alignItems={"center"}
            justifyContent={{xs: "center", sm: "space-between"}}
        >
          <Grid item sx={{display: {xs: "none", sm: "block"}}}>
            <Grid container alignItems={"center"}>
              <a href={process.env.REACT_APP_FOOTER_LOGO_ON_CLICK_URL} alt="Circle" target="_blank" rel="noreferrer">
                <img src="./favicon-32x32.png" alt="Antmedia Circle" style={{width: '22px', marginRight: 4}}/>
              </a>
              <Typography color="#ffffff" variant="body1">
                {id}
              </Typography>
              <InfoButton/>
            </Grid>
          </Grid>
          {conference.isPlayOnly === false || conference.isEnterDirectly === false ?
              <Grid item>
                <Grid
                    container
                    justifyContent="center"
                    columnSpacing={{xs: 1, sm: 2}}
                >
                  {process.env.REACT_APP_FOOTER_OPTION_BUTTON_VISIBILITY === 'true' ?
                  <Grid item xs={0}>
                    <OptionButton footer/>
                  </Grid>
                  : null}

                  {conference.isPlayOnly === false
                    && process.env.REACT_APP_FOOTER_CAMERA_BUTTON_VISIBILITY === 'true' ?
                  <Grid item xs={0}>
                    <CameraButton {...props} footer/>
                  </Grid>
                    : null}

                  {conference.isPlayOnly === false
                    && process.env.REACT_APP_FOOTER_MIC_BUTTON_VISIBILITY === 'true' ?
                  <Grid item xs={0}>
                    <MicButton footer/>
                  </Grid>
                      : null}
                  {(conference.isPlayOnly === false) && (!isMobile) && (!isTablet) && (process.env.REACT_APP_FOOTER_SCREEN_SHARE_BUTTON_VISIBILITY === 'true') && (windowWidth > mobileBreakpoint) ?
                  <Grid item xs={0}>
                    {" "}
                    <ShareScreenButton footer/>
                  </Grid>
                      : null}

                  {(windowWidth > mobileBreakpoint) && (process.env.REACT_APP_FOOTER_REACTIONS_BUTTON_VISIBILITY === 'true') ? (
                    <Grid item xs={0} style={{display: '-webkit-inline-box'}}>
                      <ReactionsButton footer/>
                    </Grid>)
                    : null}

                  {(windowWidth > mobileBreakpoint) && (conference.isPlayOnly === false) && (process.env.REACT_APP_FOOTER_MESSAGE_BUTTON_VISIBILITY === 'true') ? (
                    <Grid item xs={0}>
                      <MessageButton footer/>
                    </Grid>)
                    : null}

                  {(windowWidth > mobileBreakpoint) && (process.env.REACT_APP_FOOTER_PARTICIPANT_LIST_BUTTON_VISIBILITY === 'true') ? (
                    <Grid item xs={0}>
                        <ParticipantListButton footer />
                    </Grid>)
                    : null}

                  {process.env.REACT_APP_FOOTER_END_CALL_BUTTON_VISIBILITY === 'true' ?
                    <Grid item xs={0}>
                      <EndCallButton footer/>
                    </Grid>
                   : null}

                  {(process.env.NODE_ENV === "development") && (windowWidth > mobileBreakpoint) ?

                  <Grid item xs={0}>
                    <FakeParticipantButton
                      footer
                      increment={true}
                    />
                  </Grid>
                  : null}

                  {(process.env.NODE_ENV === "development") && (windowWidth > mobileBreakpoint) ?
                  <Grid item xs={0}>
                    <FakeParticipantButton
                      footer
                      increment={false}
                    />
                  </Grid>
                  : null}

                  {(process.env.NODE_ENV === "development") && (windowWidth > mobileBreakpoint) ?
                  <Grid item xs={0}>
                    <FakeReconnectButton
                      footer
                    />
                  </Grid>
                  : null}

                  {windowWidth <= mobileBreakpoint ? (
                    <Grid item xs={0}>
                      <MoreOptionsButton footer/>
                    </Grid>
                  ) : null}

                </Grid>
              </Grid>
        : null}

            <Grid item sx={{display: {xs: "none", sm: "block"}}}>
              {process.env.REACT_APP_FOOTER_CLOCK_VISIBILITY === 'true' ?
                <TimeZone/>
                : null}
            </Grid>
        </CustomizedGrid>
    );
}

export default Footer;
