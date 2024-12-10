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
import {parseMetaData} from "../utils";

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
  const [loading, setLoading] = React.useState(false); // Track loading state
  const scrollContainerRef = React.useRef(null);
  const [isBottom, setIsBottom] = React.useState(false);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const isAtBottom =
          container.scrollHeight - container.scrollTop <= container.clientHeight;
      setIsBottom(isAtBottom);
    }
  };

  React.useEffect(() => {
    if (isBottom) {
      loadMoreParticipants().then(r => {
        console.log("More participants loaded");
      })
    }
  }, [isBottom]);

  // Infinite scroll logic
  const loadMoreParticipants = async () => {
    if (loading) return;
    setLoading(true);

    // Fetch next participants
    await new Promise(resolve => setTimeout(resolve, 1000));
    await conference?.updateAllParticipantsPagination(conference?.globals.participantListPagination.currentPage + 1);
    setLoading(false);
  };

  const handleToggleMic = (isMicMuted, streamId, streamName) => {
    if (streamId === conference?.publishStreamId && !conference?.isMyMicMuted) {
      conference?.muteLocalMic();
      return;
    }

    const participant = {
      streamId: streamId,
      streamName: streamName,
    };
    conference?.setParticipantIdMuted(participant);
    if (!isMicMuted) {
      conference?.turnOffYourMicNotification(participant.streamId);
    }
  };

  const getMuteParticipantButton = (streamId) => {
    let micMuted = false;
    if (streamId === conference?.publishStreamId) {
      micMuted = conference?.isMyMicMuted;
    } else {
      micMuted =parseMetaData(conference.pagedParticipants[streamId]?.metaData, "isMicMuted");
    }
    let name = conference.pagedParticipants[streamId]?.name;

    return (
        <PinBtn
            id={"mic-toggle-participant-"+streamId}
            data-testid={"mic-toggle-participant-" + streamId}
            sx={{ width: 28, pt: 1, pb: 1 }}
            onClick={() => { handleToggleMic(micMuted, streamId, name) }
            }
        >
          <SvgIcon size={28} name={micMuted ? "muted-microphone" :  "microphone"} color={micMuted ? "primary" : "error"} />
        </PinBtn>
    )
  }

  const getAdminButtons = (streamId, assignedVideoCardId) => {
      let publishStreamId = (streamId === "localVideo") ? conference.publishStreamId : streamId;
      let role = conference.pagedParticipants[publishStreamId]?.role;

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
      data-testid={"add-presenter-"+streamId}
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
            {(typeof conference.pagedParticipants[streamId]?.isPinned !== "undefined") && (conference.pagedParticipants[streamId]?.isPinned === true) ? (
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
              {process.env.REACT_APP_PARTICIPANT_TAB_MUTE_PARTICIPANT_BUTTON_ENABLED === "true" ? (
                  getMuteParticipantButton(streamId)
              ) : null}
            </div>
          </div>
        </Grid>
      </Grid>
  );
  };

  return (
    <>
    <Grid container sx={{mt: 1}} id="paper-props" style={{flexWrap: 'nowrap', flex: 'auto', overflowY: 'auto'}} ref={scrollContainerRef} onScroll={handleScroll}>
      <Stack
          sx={{width: "100%",}}
          spacing={2}
      >
        <Grid container>
          <SvgIcon size={28} name="participants" color={theme.palette?.participantListIcon?.primary}/>
          <ParticipantName
            variant="body2"
            style={{marginLeft: 4, fontWeight: 500}}
          >
            {conference?.participantCount}
          </ParticipantName>
        </Grid>
        {Object.entries(conference.pagedParticipants).map(([streamId, broadcastObject]) => {
          if (conference.publishStreamId !== streamId) {
            let assignedVideoCardId = conference?.videoTrackAssignments?.find(vta => vta.streamId === streamId)?.videoLabel;
            return getParticipantItem(streamId, broadcastObject.name, assignedVideoCardId);
          } else {
            return getParticipantItem(conference.publishStreamId, "You");
          }
        })}
      </Stack>
    </Grid>
    {/* Infinite Scroll Trigger */}
    <div style={{ height: "50px" }}>
      {loading && <CircularProgress />}
    </div>
    </>
  );

}

export default ParticipantTab;
