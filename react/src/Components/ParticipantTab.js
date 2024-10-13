import React from "react";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import { SvgIcon } from "./SvgIcon";
import { ConferenceContext } from "pages/AntMedia";
import {CircularProgress} from "@mui/material";
import {WebinarRoles} from "../WebinarRoles";

const ParticipantName = styled(Typography)(({ theme }) => ({
  color: theme.palette.textColor,
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
      let publishStreamId = (streamId === "localVideo") ? conference.publishStreamId : streamId;
      let role = conference.allParticipants[publishStreamId]?.role;

    return (
      <div id={'admin-button-group-'+streamId}>
      {( role === WebinarRoles.ActiveHost || role === WebinarRoles.ActiveSpeaker || role === WebinarRoles.ActiveTempListener ) && conference?.isAdmin === true ? (
      <PinBtn
        id={"remove-presenter-"+streamId}
        disabled={conference?.presenterButtonDisabled.includes(publishStreamId)}
        sx={{ width: 28, pt: 1, pb: 1 }}
        onClick={() => { conference?.makeParticipantUndoPresenter(publishStreamId) }
        }
      >
        { conference?.presenterButtonStreamIdInProcess.includes(publishStreamId) ? <CircularProgress size={15} /> :
          <SvgIcon size={28} name="unpresenter" color="#000" />}
      </PinBtn>
    ) : null}
  { ( role === WebinarRoles.Host || role === WebinarRoles.Speaker || role === WebinarRoles.TempListener ) && conference?.isAdmin === true ?(
    <PinBtn
      id={"add-presenter-"+streamId}
      disabled={conference?.presenterButtonDisabled.includes(streamId)}
      sx={{ width: 28, pt: 1, pb: 1 }}
      onClick={() => { conference?.makeParticipantPresenter(publishStreamId) }
      }
    >
      {/* this icon for publish speaker */}
      { conference?.presenterButtonStreamIdInProcess.includes(publishStreamId) ? <CircularProgress size={15} /> :
        <SvgIcon size={28} name="presenter" color="#000" />}
    </PinBtn>
  ) : null}
  { ( role === WebinarRoles.TempListener || role === WebinarRoles.ActiveTempListener ) && conference?.isAdmin === true  && assignedVideoCardId !== 'localVideo' ? (
    <PinBtn
      sx={{ minWidth: "unset", pt: 1, pb: 1 }}
      onClick={() => conference?.makeListenerAgain(publishStreamId)}
    >
      <SvgIcon size={28} name="close" color="#000" />
    </PinBtn>
  ) : null}
      </div>
    );
  }
  const getParticipantItem = (streamId, name, assignedVideoCardId) => {
    if (streamId === conference?.publishStreamId) {
      assignedVideoCardId = "localVideo";
    }

    return (
      <Grid
        id={"participant-item-" + streamId}
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
          <div style={{display: 'flex'}}>
            {(typeof conference.allParticipants[streamId]?.isPinned !== "undefined") && (conference.allParticipants[streamId]?.isPinned === true) ? (
              <PinBtn
                id={"unpin-" + streamId}
                sx={{minWidth: "unset", pt: 1, pb: 1}}
                onClick={() => {
                  conference.pinVideo(streamId);
                }}
              >
                <SvgIcon size={28} name="unpin" color="theme.palette.textColor"/>
              </PinBtn>
            ) : (
              <PinBtn
                id={"pin-" + streamId}
                sx={{minWidth: "unset", pt: 1, pb: 1}}
                onClick={() => {
                  conference.pinVideo(streamId);
                }}
              >
                <SvgIcon size={28} name="pin" color="theme.palette.textColor"/>
              </PinBtn>
            )}
            <div>
              {process.env.REACT_APP_PARTICIPANT_TAB_ADMIN_MODE_ENABLED === "true" && conference?.isAdmin === true ? (
                getAdminButtons(streamId, assignedVideoCardId)
              ) : null}
            </div>
          </div>
        </Grid>
      </Grid>
  );
  };

  return (
    <div style={{width: "100%", overflow: "hidden"}}>
      <Stack sx={{width: "100%",}} spacing={2}>
        <Grid container>
          <SvgIcon size={28} name="participants" color="theme.palette.textColor"/>
          <ParticipantName
            variant="body2"
            style={{marginLeft: 4, fontWeight: 500}}
          >
            {Object.keys(conference.allParticipants).length}
          </ParticipantName>
        </Grid>
        {conference.isPlayOnly === false ? getParticipantItem(conference.publishStreamId, "You") : ""}
        {Object.entries(conference.allParticipants).map(([streamId, broadcastObject]) => {
          if (conference.publishStreamId !== streamId) {
            var assignedVideoCardId = conference?.videoTrackAssignments?.find(vta => vta.streamId === streamId)?.videoLabel;
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