import React from "react";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {styled, useTheme} from "@mui/material/styles";
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
  const theme = useTheme();

  const getAdminButtons = (streamId, assignedVideoCardId) => {
      let publishStreamId = (streamId === "localVideo") ? conference.publishStreamId : streamId;
      let role = conference.allParticipants[publishStreamId]?.role;

    return (
      <div id={'admin-button-group-'+streamId}>
      {( role === WebinarRoles.ActiveHost || role === WebinarRoles.ActiveSpeaker || role === WebinarRoles.ActiveTempListener ) && conference?.isAdmin === true ? (
      <PinBtn
        id={"remove-presenter-"+streamId}
        data-testid="remove-presenter-test-stream-id"
        disabled={conference?.presenterButtonDisabled.includes(publishStreamId)}
        sx={{ width: 28, pt: 1, pb: 1 }}
        onClick={() => { conference?.makeParticipantUndoPresenter(publishStreamId) }
        }
      >
        { conference?.presenterButtonStreamIdInProcess.includes(publishStreamId) ? <CircularProgress size={15} /> :
          <SvgIcon size={28} name="unpresenter" color={theme.palette?.participantListIcon?.primary} />}
      </PinBtn>
    ) : null}
  { ( role === WebinarRoles.Host || role === WebinarRoles.Speaker || role === WebinarRoles.TempListener ) && conference?.isAdmin === true ?(
    <PinBtn
      id={"add-presenter-"+streamId}
      data-testid="add-presenter-test-stream-id"
      disabled={conference?.presenterButtonDisabled.includes(streamId)}
      sx={{ width: 28, pt: 1, pb: 1 }}
      onClick={() => { conference?.makeParticipantPresenter(publishStreamId) }
      }
    >
      {/* this icon for publish speaker */}
      { conference?.presenterButtonStreamIdInProcess.includes(publishStreamId) ? <CircularProgress size={15} /> :
        <SvgIcon size={28} name="presenter" color={theme.palette?.participantListIcon?.primary} />}
    </PinBtn>
  ) : null}
  { ( role === WebinarRoles.TempListener || role === WebinarRoles.ActiveTempListener ) && conference?.isAdmin === true  && assignedVideoCardId !== 'localVideo' ? (
    <PinBtn
      sx={{ minWidth: "unset", pt: 1, pb: 1 }}
      onClick={() => conference?.makeListenerAgain(publishStreamId)}
    >
      <SvgIcon size={28} name="close" color={theme.palette?.participantListIcon?.primary} />
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
        <Grid item sx={{ pr: 1,  maxWidth: "60%" }}>
          <ParticipantName
              variant="body1"
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "block"
              }}
          >{name}</ParticipantName>
        </Grid>
        <Grid item>
          <div style={{display: 'flex'}}>
            {conference.allParticipants[streamId]?.status !== "created" ? <>
            {(typeof conference.allParticipants[streamId]?.isPinned !== "undefined") && (conference.allParticipants[streamId]?.isPinned === true) ? (
              <PinBtn
                id={"unpin-" + streamId}
                sx={{minWidth: "unset", pt: 1, pb: 1}}
                onClick={() => {
                  conference.pinVideo(streamId);
                }}
              >
                <SvgIcon size={28} name="unpin" color={theme.palette?.participantListIcon?.primary}/>
              </PinBtn>
            ) : (
              <PinBtn
                id={"pin-" + streamId}
                sx={{minWidth: "unset", pt: 1, pb: 1}}
                onClick={() => {
                  conference.pinVideo(streamId);
                }}
              >
                <SvgIcon size={28} name="pin" color={theme.palette?.participantListIcon?.primary}/>
              </PinBtn>
            )}
            <div>
              {process.env.REACT_APP_PARTICIPANT_TAB_ADMIN_MODE_ENABLED === "true" && conference?.isAdmin === true ? (
                getAdminButtons(streamId, assignedVideoCardId)
              ) : null}
            </div>
            </> : <PinBtn
                id={"playonly-" + streamId}
                sx={{minWidth: "unset", pt: 1, pb: 1}}
                onClick={() => {}}
            >
              <SvgIcon size={28} name="eye" color={theme.palette?.participantListIcon?.primary}/>
            </PinBtn> }
          </div>
        </Grid>
      </Grid>
  );
  };

  return (
    <>
    <Grid container sx={{mt: 1}} id="paper-props" style={{flexWrap: 'nowrap', flex: 'auto', overflowY: 'auto'}}>
      <Stack sx={{width: "100%",}} spacing={2}>
        <Grid container>
          <SvgIcon size={28} name="participants" color={theme.palette?.participantListIcon?.primary}/>
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
    </Grid>
    </>
  );

}

export default ParticipantTab;
