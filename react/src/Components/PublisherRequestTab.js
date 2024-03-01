import React, {useContext} from "react";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {styled} from "@mui/material/styles";
import { SvgIcon } from "./SvgIcon";
import {ConferenceContext} from "../pages/AntMedia";

const PublisherRequestName = styled(Typography)(({ theme }) => ({
    color: "black",
    fontWeight: 500,
    fontSize: 14,
}));
//hover color of allow or deny
const PinBtn = styled(Button)(({ theme }) => ({
    "&:hover": {
        backgroundColor: theme.palette.themeColor[50],
    },
}));

function PublisherRequestTab(props) {
    const conference = useContext(ConferenceContext);

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
                        id={"approve-publisher-request-"+videoId}
                        sx={{ minWidth: "unset", pt: 1, pb: 1 }}
                        onClick={() => {conference.approveBecomeSpeakerRequest(videoId); conference.setRequestSpeakerList(conference.requestSpeakerList.filter((item) => item.streamId !== videoId))}}
                    >
                        Allow
                    </PinBtn>

                    <PinBtn
                        id={"deny-publisher-request-"+videoId}
                        sx={{ minWidth: "unset", pt: 1, pb: 1 }}
                        onClick={() => {conference.rejectSpeakerRequest(videoId); conference.setRequestSpeakerList(conference.requestSpeakerList.filter((item) => item.streamId !== videoId))}}
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
                    <SvgIcon size={28} name="participants" color="black"/>
                    <PublisherRequestName
                        variant="body2"
                        style={{marginLeft: 8, fontWeight: 500}}
                    >
                        {conference.requestSpeakerList.length}
                    </PublisherRequestName>
                </Grid>
                {conference.requestSpeakerList.map((streamElement, index) => {
                    if (conference.publishStreamId !== streamElement) {
                        return getPublisherRequestItem(streamElement);
                    } else {
                        return "";
                    }
                })}
            </Stack>
        </div>
    );

}

export default PublisherRequestTab;
