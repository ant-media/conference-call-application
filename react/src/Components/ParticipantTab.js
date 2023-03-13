import React, {useContext} from "react";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import { SvgIcon } from "./SvgIcon";
import { SettingsContext, MediaSettingsContext } from "pages/AntMedia";
import { AntmediaContext } from "App";

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
  const antmedia = useContext(AntmediaContext);
  const mediaSettings = React.useContext(MediaSettingsContext);
  const settings = React.useContext(SettingsContext);

  const { pinnedVideoId, pinVideo, allParticipants } = settings;
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
          {pinnedVideoId === videoId ? (
            <PinBtn
              sx={{ minWidth: "unset", pt: 1, pb: 1 }}
              onClick={() => pinVideo(videoId)}
            >
              <SvgIcon size={28} name="unpin" color="#fff" />
            </PinBtn>
          ) : (
            <PinBtn
              sx={{ minWidth: "unset", pt: 1, pb: 1 }}
              onClick={() => pinVideo(videoId)}
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
                {antmedia.onlyDataChannel === false ? allParticipants.length + 1 : allParticipants.length}
              </ParticipantName>
            </Grid>
            {antmedia.onlyDataChannel === false ? getParticipantItem("localVideo", "You") : ""}
            {allParticipants.map(({streamId, streamName}, index) => {
              if (mediaSettings?.myLocalData?.streamId !== streamId) {
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
