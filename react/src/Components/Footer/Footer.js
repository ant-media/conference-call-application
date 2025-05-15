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
import {getRootAttribute, isComponentMode} from 'utils';
import { isMobile, isTablet } from 'react-device-detect';
import ReactionsButton from "./Components/ReactionsButton";
import MoreOptionsButton from "./Components/MoreOptionsButton";
import RequestPublishButton from "./Components/RequestPublishButton";
import PublisherRequestListButton from "./Components/PublisherRequestListButton";
import {useTheme} from "@mui/material/styles";
import FakeReconnectButton from "./Components/FakeReconnectButton";

const getCustomizedGridStyle = (theme) => {
  let customizedGridStyle = {
    backgroundColor: theme.palette.themeColor?.[80],
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
  // eslint-disable-next-line
  const id = (isComponentMode()) ? getRootAttribute("data-room-name") : useParams().id;

  const theme = useTheme();

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
    if (props?.isRecordPluginActive === true && props?.isEnterDirectly === false && props?.isPlayOnly === false) {
      setIsRecordingTextVisible(true);
    } else {
      setIsRecordingTextVisible(false);
    }
  }, [props?.isRecordPluginActive, props?.isEnterDirectly, props?.isPlayOnly]);

  /* istanbul ignore next */
  return (
      <CustomizedGrid
          container
          alignItems={"center"}
          justifyContent={{xs: "center", sm: "space-between"}}
      >
        <Grid item sx={{display: {xs: "none", sm: "block"}}}>
          <Grid container alignItems={"center"}>
            {process.env.REACT_APP_FOOTER_APP_LOGO_VISIBILITY === "true" ?
                <a href={process.env.REACT_APP_FOOTER_LOGO_ON_CLICK_URL} target="_blank" rel="noreferrer">
                  <img src="./favicon-32x32.png" alt="Antmedia Circle" style={{width: '22px', marginRight: 4}}/>
                </a>
                : null}
            <Typography color={theme.palette.text.primary} variant="body1">
              {id}
            </Typography>
            <InfoButton
                isPlayOnly={props?.isPlayOnly}
            />
          </Grid>
        </Grid>
        {props?.isPlayOnly === false || props?.isEnterDirectly === false ?
            <Grid item>
              <Grid
                  container
                  justifyContent="center"
                  columnSpacing={{xs: 1, sm: 2}}
              >
                {process.env.REACT_APP_FOOTER_OPTION_BUTTON_VISIBILITY === 'true' ?
                    <Grid item xs={0}>
                      <OptionButton
                          footer={true}
                          globals={props?.globals}
                          allParticipants={props?.allParticipants}
                          pinVideo={(streamId) => props?.pinVideo(streamId)}
                          pinFirstVideo={props?.pinFirstVideo}
                          handleSetDesiredTileCount={props?.handleSetDesiredTileCount}
                          isAdmin={props?.isAdmin}
                          isRecordPluginActive={props?.isRecordPluginActive}
                          isRecordPluginInstalled={props?.isRecordPluginInstalled}
                          startRecord={props?.startRecord}
                          stopRecord={props?.stopRecord}
                          isPlayOnly={props?.isPlayOnly}
                          effectsDrawerOpen={props?.effectsDrawerOpen}
                          handleEffectsOpen={props?.handleEffectsOpen}
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
                    </Grid>
                    : null}

                  {props?.isPlayOnly === false
                    && process.env.REACT_APP_FOOTER_CAMERA_BUTTON_VISIBILITY === 'true' ?
                  <Grid item xs={0}>
                    <CameraButton
                        rounded={false}
                        footer={true}
                        isCamTurnedOff={props?.isMyCamTurnedOff}
                        cameraButtonDisabled={props?.cameraButtonDisabled}
                        onTurnOffCamera={props?.checkAndTurnOffLocalCamera}
                        onTurnOnCamera={props?.checkAndTurnOnLocalCamera}
                    />
                  </Grid>
                    : null}

                  {props?.isPlayOnly === false
                    && process.env.REACT_APP_FOOTER_MIC_BUTTON_VISIBILITY === 'true' ?
                  <Grid item xs={0}>
                    <MicButton
                        rounded={false}
                        footer={true}
                        isMicMuted={props?.isMyMicMuted}
                        toggleMic={props?.toggleMic}
                        microphoneButtonDisabled={props?.microphoneButtonDisabled}
                    />
                  </Grid>
                      : null}
                  {(props?.isPlayOnly === false) && (!isMobile) && (!isTablet) && (process.env.REACT_APP_FOOTER_SCREEN_SHARE_BUTTON_VISIBILITY === 'true') && (windowWidth > mobileBreakpoint) ?
                  <Grid item xs={0}>
                    {" "}
                    <ShareScreenButton
                        footer={true}
                        isScreenShared={props?.isScreenShared}
                        handleStartScreenShare={()=>props?.handleStartScreenShare()}
                        handleStopScreenShare={()=>props?.handleStopScreenShare()}
                    />
                  </Grid>
                      : null}

                  {(windowWidth > mobileBreakpoint) && (process.env.REACT_APP_FOOTER_REACTIONS_BUTTON_VISIBILITY === 'true') ? (
                    <Grid item xs={0} style={{display: '-webkit-inline-box'}}>
                      <ReactionsButton
                          footer={true}
                          rounded={false}
                          showEmojis={props?.showEmojis}
                          setShowEmojis={(showEmojis) => props?.setShowEmojis(showEmojis)}
                      />
                    </Grid>)
                    : null}

                  {(windowWidth > mobileBreakpoint) && (process.env.REACT_APP_FOOTER_MESSAGE_BUTTON_VISIBILITY === 'true') ? (
                    <Grid item xs={0}>
                      <MessageButton
                          footer={true}
                          numberOfUnReadMessages={props?.numberOfUnReadMessages}
                          toggleSetNumberOfUnreadMessages={()=>props?.toggleSetNumberOfUnreadMessages()}
                          messageDrawerOpen={props?.messageDrawerOpen}
                          handleMessageDrawerOpen={(open)=>props?.handleMessageDrawerOpen(open)}
                      />
                    </Grid>)
                    : null}

                  {(windowWidth > mobileBreakpoint) && (process.env.REACT_APP_FOOTER_PARTICIPANT_LIST_BUTTON_VISIBILITY === 'true') ? (
                    <Grid item xs={0}>
                        <ParticipantListButton
                            footer={true}
                            participantCount={props?.participantCount}
                            participantListDrawerOpen={props?.participantListDrawerOpen}
                            handleParticipantListOpen={(open)=>props?.handleParticipantListOpen(open)}
                        />
                    </Grid>)
                    : null}

                  {(windowWidth > mobileBreakpoint) && (process.env.REACT_APP_FOOTER_PUBLISHER_REQUEST_BUTTON_VISIBILITY === 'true') && (props?.isAdmin === true) ?
                    <Grid item xs={0}>
                      <PublisherRequestListButton
                          footer={true}
                          requestSpeakerList={props?.requestSpeakerList}
                          publisherRequestListDrawerOpen={props?.publisherRequestListDrawerOpen}
                          handlePublisherRequestListOpen={(open)=>props?.handlePublisherRequestListOpen(open)}
                      />
                    </Grid>
                    : null}

                  {(windowWidth > mobileBreakpoint) && (process.env.REACT_APP_FOOTER_PUBLISHER_REQUEST_BUTTON_VISIBILITY === 'true') && (props?.isPlayOnly === true) ?
                    <Grid item xs={0}>
                      <RequestPublishButton
                          footer={true}
                          rounded={false}
                          handlePublisherRequest={()=> {
                            props?.handlePublisherRequest()
                          }}
                      />
                    </Grid>
                    : null}

                  {process.env.REACT_APP_FOOTER_END_CALL_BUTTON_VISIBILITY === 'true' ?
                    <Grid item xs={0}>
                      <EndCallButton
                          footer={true}
                          onLeaveRoom={()=>props?.setLeftTheRoom(true)}
                      />
                    </Grid>
                   : null}

                  {(process.env.NODE_ENV === "development") && (windowWidth > mobileBreakpoint) ?

                  <Grid item xs={0}>
                    <FakeParticipantButton
                      footer={true}
                      increment={true}
                      onAction={()=>props?.addFakeParticipant()}
                    />
                  </Grid>
                  : null}

                  {(process.env.NODE_ENV === "development") && (windowWidth > mobileBreakpoint) ?
                  <Grid item xs={0}>
                    <FakeParticipantButton
                      footer={true}
                      increment={false}
                      onAction={()=>props?.removeFakeParticipant()}
                    />
                  </Grid>
                  : null}

                  {(process.env.NODE_ENV === "development") && (windowWidth > mobileBreakpoint) ?
                  <Grid item xs={0}>
                    <FakeReconnectButton
                      footer={true}
                      onFakeReconnect={()=>props?.fakeReconnect()}
                    />
                  </Grid>
                  : null}

                  {windowWidth <= mobileBreakpoint ? (
                    <Grid item xs={0}>
                      <MoreOptionsButton
                          footer={true}
                          isAdmin={props?.isAdmin}
                          isPlayOnly={props?.isPlayOnly}
                          isScreenShared={props?.isScreenShared}
                          handleStartScreenShare={props?.handleStartScreenShare}
                          handleStopScreenShare={props?.handleStopScreenShare}
                          showEmojis={props?.showEmojis}
                          setShowEmojis={(showEmojis) => props?.setShowEmojis(showEmojis)}
                          messageDrawerOpen={props?.messageDrawerOpen}
                          toggleSetNumberOfUnreadMessages={(numberOfUnreadMessages)=>props?.toggleSetNumberOfUnreadMessages(numberOfUnreadMessages)}
                          handleMessageDrawerOpen={(open)=>props?.handleMessageDrawerOpen(open)}
                          participantListDrawerOpen={props?.participantListDrawerOpen}
                          handlePublisherRequestListOpen={(open)=>props?.handlePublisherRequestListOpen(open)}
                          publisherRequestListDrawerOpen={props?.publisherRequestListDrawerOpen}
                          handlePublisherRequest={()=>props?.handlePublisherRequest()}
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
                          globals={props?.globals}
                          handleParticipantListOpen={(open)=>props?.handleParticipantListOpen(open)}
                      />
                    </Grid>
                  ) : null}

                </Grid>
              </Grid>
        : null}

            <Grid item sx={{display: {xs: "none", sm: "block"}}}>
              {process.env.REACT_APP_FOOTER_CLOCK_VISIBILITY === 'true' ?
                <TimeZone
                    isBroadcasting={props?.isBroadcasting}
                />
                : null}
            </Grid>
        </CustomizedGrid>
    );
}

export default Footer;
