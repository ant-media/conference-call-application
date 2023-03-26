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
    backgroundColor: theme.palette.green[50],
  },
}));

function ParticipantTab(props) {
  const conference = React.useContext(ConferenceContext);

  const getParticipantItem = (videoId, name) => {
    return (
      <Grid
        key={videoId}
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
          {conference.pinnedVideoId === videoId ? (
            <PinBtn
              sx={{ minWidth: "unset", pt: 1, pb: 1 }}
              onClick={() => conference.pinVideo(videoId)}
            >
              <SvgIcon size={28} name="unpin" color="#fff" />
            </PinBtn>
          ) : (
            <PinBtn
              sx={{ minWidth: "unset", pt: 1, pb: 1 }}
              onClick={() => conference.pinVideo(videoId)}
            >
              <SvgIcon size={28} name="pin" color="#fff" />
            </PinBtn>
          )}
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
                {conference.isPlayOnly === false ? conference.allParticipants.length + 1 : conference.allParticipants.length}
              </ParticipantName>
            </Grid>
            {conference.isPlayOnly === false ? getParticipantItem("localVideo", "You") : ""}
            {conference.allParticipants.map(({streamId, streamName}, index) => {
              if (conference.publishStreamId !== streamId) {
                return getParticipantItem(streamId, streamName);
              } else {
                return "";
              }
            })}
          </Stack>
        </div>
    );

}

export default ParticipantTab;
