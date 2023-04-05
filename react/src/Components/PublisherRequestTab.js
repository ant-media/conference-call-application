import React, {useContext} from "react";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import { SvgIcon } from "./SvgIcon";
import { SettingsContext, MediaSettingsContext } from "pages/AntMedia";
import { AntmediaContext } from "App";

const PublisherRequestName = styled(Typography)(({ theme }) => ({
  color: "#ffffff",
  fontWeight: 500,
  fontSize: 14,
}));

const PinBtn = styled(Button)(({ theme }) => ({
  "&:hover": {
    backgroundColor: theme.palette.green[50],
  },
}));

function PublisherRequestTab(props) {
  const antmedia = useContext(AntmediaContext);
  const mediaSettings = React.useContext(MediaSettingsContext);
  const settings = React.useContext(SettingsContext);

  const { requestSpeakerList, setRequestSpeakerList } = settings;
  const getPublisherRequestItem = (videoId) => {
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
          <PublisherRequestName variant="body1">{videoId}</PublisherRequestName>
        </Grid>
        <Grid item>
            <PinBtn
              sx={{ minWidth: "unset", pt: 1, pb: 1 }}
              onClick={() => {antmedia.approveBecomeSpeakerRequest(); setRequestSpeakerList(requestSpeakerList.filter((item) => item.streamId !== videoId))}}
            >
              Allow
            </PinBtn>

          <PinBtn
              sx={{ minWidth: "unset", pt: 1, pb: 1 }}
              onClick={() => {setRequestSpeakerList(requestSpeakerList.filter((item) => item.streamId !== videoId))}}
          >
            Deny
          </PinBtn>

        </Grid>
      </Grid>
    );
  };
  return (
        <div style={{width: "100%", overflowY: "auto"}}>
          <Stack sx={{width: "100%",}} spacing={2}>
            <Grid container>
              <SvgIcon size={28} name="participants" color="#fff"/>
              <PublisherRequestName
                  variant="body2"
                  style={{marginLeft: 4, fontWeight: 500}}
              >
                {requestSpeakerList.length}
              </PublisherRequestName>
            </Grid>
            {requestSpeakerList.map(({streamId}, index) => {
              if (mediaSettings?.myLocalData?.streamId !== streamId) {
                return getPublisherRequestItem(streamId);
              } else {
                return "";
              }
            })}
          </Stack>
        </div>
    );

}

export default PublisherRequestTab;
