import React from "react";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import { SvgIcon } from "./SvgIcon";
import { ConferenceContext } from "pages/AntMedia";
import {CircularProgress} from "@mui/material";

const ParticipantName = styled(Typography)(({ theme }) => ({
  color: "#ffffff",
  fontWeight: 500,
  fontSize: 14,
}));

const PinBtn = styled(Button)(({ theme }) => ({
  "&:hover": {
    backgroundColor: theme.palette.themeColor[50],
  },
}));

function ParticipantTab(props) {
  const conference = React.useContext(ConferenceContext);

  const getAdminButtons = (streamId, assignedVideoCardId) => {
    return (
      <div>
      {(streamId === "localVideo" ? conference?.presenters.includes(conference.publishStreamId) : conference?.presenters.includes(streamId) )&& conference?.isAdmin == "true" ? (
      <PinBtn
        disabled={conference?.presenterButtonDisabled}
        sx={{ minWidth: "unset", pt: 1, pb: 1 }}
        onClick={() => {
          let tempStreamId = streamId;
          if (assignedVideoCardId === "localVideo") {
            tempStreamId = conference?.publishStreamId;
          }
          conference?.makeParticipantUndoPresenter(tempStreamId)
        }
        }
      >
        { conference?.presenterButtonStreamIdInProcess === streamId ? <CircularProgress size={28} /> :
          <SvgIcon size={28} name="unpresenter" color="black" />}
      </PinBtn>
    ) : null}
  {(streamId === "localVideo" ? !conference?.presenters.includes(conference.publishStreamId) : !conference?.presenters.includes(streamId) ) && ( !conference?.approvedSpeakerRequestList.includes(streamId) ) && conference?.isAdmin == "true" ?(
    <PinBtn
      disabled={conference?.presenterButtonDisabled}
      sx={{ minWidth: "unset", pt: 1, pb: 1 }}
      onClick={() => {
        let tempStreamId = streamId;
        if (assignedVideoCardId === "localVideo") {
          tempStreamId = conference?.publishStreamId;
        }
        conference?.makeParticipantPresenter(tempStreamId)
      }
      }
    >
      {/* this icon for publish speaker */}
      { conference?.presenterButtonStreamIdInProcess === streamId ? <CircularProgress size={28} /> :
        <SvgIcon size={28} name="presenter" color="black" />}
    </PinBtn>
  ) : null}
  {conference?.approvedSpeakerRequestList.includes(streamId) && conference?.isAdmin == "true"  && assignedVideoCardId !== 'localVideo' ?(
    <PinBtn
      sx={{ minWidth: "unset", pt: 1, pb: 1 }}
      onClick={() => conference.makeListenerAgain(streamId)}
    >
      <SvgIcon size={28} name="close" color="black" />
    </PinBtn>
  ) : null}
      </div>
    );
  }
  const getParticipantItem = (streamId, name, assignedVideoCardId) => {
    return (
      <Grid
        key={streamId}
        container
        alignItems="center"
        justifyContent="space-between"
        style={{ borderBottomWidth: 1 }}
        sx={{ borderColor: "primary.main" }}
      >
        <Grid item sx={{ pr: 1 }}>
          <ParticipantName variant="body1">{name}</ParticipantName>
        </Grid>
        <Grid item>
          {conference.pinnedVideoId === assignedVideoCardId || conference.pinnedVideoId === streamId ? (
            <PinBtn
              sx={{ minWidth: "unset", pt: 1, pb: 1 }}
              onClick={() => conference.pinVideo(assignedVideoCardId)}
            >
              <SvgIcon size={28} name="unpin" color="#fff" />
            </PinBtn>
          ) : (
            <PinBtn
              sx={{ minWidth: "unset", pt: 1, pb: 1 }}
              onClick={() => {
                if(assignedVideoCardId === undefined) {
                  //if videoTrackId is undefined, then it means that we try to pin someone who has no video player on the screen
                  //then we will assign the 1st player in the screen to that user

                  conference.assignVideoToStream(conference.participants[1].id, streamId);
                  //conference.pinVideo(conference.participants[1].id);
                }
                else {
                  conference.pinVideo(assignedVideoCardId);
                }
              }}
            >
              <SvgIcon size={28} name="pin" color="#fff" />
            </PinBtn>
          )}
          <div>
          {process.env.REACT_APP_PARTICIPANT_TAB_ADMIN_MODE_ENABLED === "true" && conference?.isAdmin == "true" ? (
            getAdminButtons(streamId, assignedVideoCardId)
        ) : null}
        </div>
        </Grid>
      </Grid>
    );
  };
  return (
        <div style={{width: "100%", overflowY: "auto"}}>
          <Stack sx={{width: "100%",}} spacing={2}>
            <Grid container>
              <SvgIcon size={28} name="participants" color="#fff"/>
              <ParticipantName
                  variant="body2"
                  style={{marginLeft: 4, fontWeight: 500}}
              >
                {Object.keys(conference.allParticipants).length}
              </ParticipantName>
            </Grid>
            {conference.isPlayOnly === false ? getParticipantItem("localVideo", "You") : ""}
            {Object.entries(conference.allParticipants).map(([streamId, broadcastObject]) => {
              if (conference.publishStreamId !== streamId) {
                var assignedVideoCardId = conference.participants.find(p => p.streamId === streamId)?.id;
                return getParticipantItem(streamId, broadcastObject.name, assignedVideoCardId);
              } else {
                return "";
              }
            })}
          </Stack>
        </div>
    );

}

export default ParticipantTab;
