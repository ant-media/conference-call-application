import React from "react";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import { SvgIcon } from "./SvgIcon";
import { ConferenceContext } from "pages/AntMedia";

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

const getParticipantItem = (conference, streamId, name, assignedVideoCardId) => {
  const isPinned = conference.pinnedVideoId === assignedVideoCardId;

  const pinVideoHandler = () => {
    if (isPinned) {
      conference.pinVideo(assignedVideoCardId);
    } else {
      if (assignedVideoCardId === undefined) {
        const participantToAssign = conference.participants[1];
        conference.assignVideoToStream(participantToAssign.id, streamId);
      } else {
        conference.pinVideo(assignedVideoCardId);
      }
    }
  };

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
        <PinBtn
          sx={{ minWidth: "unset", pt: 1, pb: 1 }}
          onClick={pinVideoHandler}
        >
          <SvgIcon
            size={28}
            name={isPinned ? "unpin" : "pin"}
            color="#fff"
          />
        </PinBtn>
      </Grid>
    </Grid>
  );
};

const ParticipantTab = React.memo(() => {
  const conference = React.useContext(ConferenceContext);

  return (
    <div style={{ width: "100%", overflowY: "auto" }}>
      <Stack sx={{ width: "100%" }} spacing={2}>
        <Grid container>
          <SvgIcon size={28} name="participants" color="#fff" />
          <ParticipantName
            variant="body2"
            style={{ marginLeft: 4, fontWeight: 500 }}
          >
            {Object.keys(conference.allParticipants).length}
          </ParticipantName>
        </Grid>
        {!conference.isPlayOnly && getParticipantItem(conference, "localVideo", "You")}
        {Object.entries(conference.allParticipants).map(
          ([streamId, broadcastObject]) => {
            if (conference.publishStreamId !== streamId) {
              const assignedVideoCardId = conference.participants.find(
                (p) => p.streamId === streamId
              )?.id;
              return getParticipantItem(
                conference,
                streamId,
                broadcastObject.name,
                assignedVideoCardId
              );
            } else {
              return null;
            }
          }
        )}
      </Stack>
    </div>
  );
});

export default ParticipantTab;
