import React from "react";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {styled, useTheme} from "@mui/material/styles";
import { SvgIcon } from "./SvgIcon";
import {CircularProgress, Pagination} from "@mui/material";
import {WebinarRoles} from "../WebinarRoles";
import {parseMetaData} from "../utils";

const ParticipantName = styled(Typography)(({ theme }) => ({
  color: theme.palette.textColor,
  fontWeight: 500,
  fontSize: 14,
}));

const PinBtn = styled(Button)(({ theme }) => ({
  "&:hover": {
    backgroundColor: theme.palette.themeColor?.[50],
  },
}));

function ParticipantTab({
                          globals,
                          isAdmin,
                          pinVideo,
                          makeListenerAgain,
                          videoTrackAssignments,
                          presenterButtonStreamIdInProcess,
                          presenterButtonDisabled,
                          makeParticipantPresenter,
                          makeParticipantUndoPresenter,
                          participantCount,
                          isMyMicMuted,
                          publishStreamId,
                          muteLocalMic,
                          turnOffYourMicNotification,
                          setParticipantIdMuted,
                          pagedParticipants,
                          updateAllParticipantsPagination
}) {
  const theme = useTheme();

  const paginationUpdate = (event, value) => {
    updateAllParticipantsPagination(value);
  }

  const handleToggleMic = (isMicMuted, streamId, streamName) => {
    if (streamId === publishStreamId && !isMyMicMuted) {
      muteLocalMic();
      return;
    }

    const participant = {
      streamId: streamId,
      streamName: streamName,
    };
    setParticipantIdMuted(participant);
    if (!isMicMuted) {
      turnOffYourMicNotification(participant.streamId);
    }
  };

  const getMuteParticipantButton = (streamId) => {
    let micMuted = false;
    if (streamId === publishStreamId) {
      micMuted = isMyMicMuted;
    } else {
      micMuted =parseMetaData(pagedParticipants[streamId]?.metaData, "isMicMuted");
    }
    let name = pagedParticipants[streamId]?.name;

    return (
        <PinBtn
            id={"mic-toggle-participant-"+streamId}
            data-testid={"mic-toggle-participant-" + streamId}
            sx={{ width: 28, pt: 1, pb: 1 }}
            onClick={() => { handleToggleMic(micMuted, streamId, name) }
            }
        >
          <SvgIcon size={28} name={micMuted ? "muted-microphone" :  "microphone"} color={theme.palette?.participantListIcon?.primary} />
        </PinBtn>
    )
  }

  const getAdminButtons = (streamId, assignedVideoCardId, publishStreamIdFromParameter) => {
      let publishStreamId = (streamId === "localVideo") ? publishStreamIdFromParameter : streamId;
      let role = pagedParticipants[publishStreamId]?.role;

    return (
      <div id={'admin-button-group-'+streamId}>
      {( role === WebinarRoles.ActiveHost || role === WebinarRoles.ActiveSpeaker || role === WebinarRoles.ActiveTempListener ) && isAdmin === true ? (
      <PinBtn
        id={"remove-presenter-"+streamId}
        data-testid="remove-presenter-test-stream-id"
        disabled={presenterButtonDisabled.includes(publishStreamId)}
        sx={{ width: 28, pt: 1, pb: 1 }}
        onClick={() => { makeParticipantUndoPresenter(publishStreamId) }
        }
      >
        { presenterButtonStreamIdInProcess.includes(publishStreamId) ? <CircularProgress size={15} /> :
          <SvgIcon size={28} name="unpresenter" color={theme.palette?.participantListIcon?.primary} />}
      </PinBtn>
    ) : null}
  { ( role === WebinarRoles.Host || role === WebinarRoles.Speaker || role === WebinarRoles.TempListener ) && isAdmin === true ?(
    <PinBtn
      id={"add-presenter-"+streamId}
      data-testid={"add-presenter-"+streamId}
      disabled={presenterButtonDisabled.includes(streamId)}
      sx={{ width: 28, pt: 1, pb: 1 }}
      onClick={() => { makeParticipantPresenter(publishStreamId) }
      }
    >
      {/* this icon for publish speaker */}
      { presenterButtonStreamIdInProcess.includes(publishStreamId) ? <CircularProgress size={15} /> :
        <SvgIcon size={28} name="presenter" color={theme.palette?.participantListIcon?.primary} />}
    </PinBtn>
  ) : null}
  { ( role === WebinarRoles.TempListener || role === WebinarRoles.ActiveTempListener ) && isAdmin === true  && assignedVideoCardId !== 'localVideo' ? (
    <PinBtn
      sx={{ minWidth: "unset", pt: 1, pb: 1 }}
      onClick={() => makeListenerAgain(publishStreamId)}
    >
      <SvgIcon size={28} name="close" color={theme.palette?.participantListIcon?.primary} />
    </PinBtn>
  ) : null}
      </div>
    );
  }
  const getParticipantItem = (streamId, name, assignedVideoCardId) => {
    if (streamId === publishStreamId) {
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
            {pagedParticipants[streamId]?.status !== "created" ? <>
            {(typeof pagedParticipants[streamId]?.isPinned !== "undefined") && (pagedParticipants[streamId]?.isPinned === true) ? (
              <PinBtn
                id={"unpin-" + streamId}
                sx={{minWidth: "unset", pt: 1, pb: 1}}
                onClick={(e) => {
                  pinVideo(streamId);
                }}
              >
                <SvgIcon size={28} name="unpin" color={theme.palette?.participantListIcon?.primary}/>
              </PinBtn>
            ) : (
              <PinBtn
                id={"pin-" + streamId}
                sx={{minWidth: "unset", pt: 1, pb: 1}}
                onClick={(e) => {
                  pinVideo(streamId);
                }}
              >
                <SvgIcon size={28} name="pin" color={theme.palette?.participantListIcon?.primary}/>
              </PinBtn>
            )}
            <div>
              {process.env.REACT_APP_PARTICIPANT_TAB_ADMIN_MODE_ENABLED === "true" && isAdmin === true ? (
                getAdminButtons(streamId, assignedVideoCardId, publishStreamId)
              ) : null}
              {process.env.REACT_APP_PARTICIPANT_TAB_MUTE_PARTICIPANT_BUTTON_ENABLED === "true" ? (
                  getMuteParticipantButton(streamId)
              ) : null}
            </div>
            </> : <PinBtn
                id={"playonly-" + streamId}
                data-testid={"playonly-" + streamId}
                sx={{minWidth: "unset", pt: 1, pb: 1}}
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
            {participantCount}
          </ParticipantName>
        </Grid>
        {Object.entries(pagedParticipants).map(([streamId, broadcastObject]) => {
          if (publishStreamId !== streamId) {
            let assignedVideoCardId = videoTrackAssignments?.find(vta => vta.streamId === streamId)?.videoLabel;
            return getParticipantItem(streamId, broadcastObject.name, assignedVideoCardId);
          } else {
            return getParticipantItem(publishStreamId, "You");
          }
        })}
      </Stack>
    </Grid>
      {/* Pagination Controls */}
      <Grid
          container
          justifyContent="center"
          sx={{ mt: 2, mb: 2 }}
      >
        <Pagination
            data-testid="participant-list-pagination"
            count={globals.participantListPagination.totalPage}
            page={globals.participantListPagination.currentPage}
            onChange={paginationUpdate}
        />
      </Grid>
    </>
  );

}

export default ParticipantTab;
