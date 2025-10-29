import React from "react";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {styled, useTheme} from "@mui/material/styles";
import { SvgIcon } from "./SvgIcon";

const PublisherRequestName = styled(Typography)(({ theme }) => ({
    color: theme.palette?.participantListIcon?.primary,
    fontWeight: 500,
    fontSize: 14,
}));
//hover color of allow or deny
const PinBtn = styled(Button)(({ theme }) => ({
    "&:hover": {
        backgroundColor: theme.palette.themeColor?.[50],
        color: "#fff",
    },
}));

function PublisherRequestTab(props) {
    const theme = useTheme();

    const getPublisherRequestItem = (streamId) => {
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
                    <PublisherRequestName variant="body1">{streamId}</PublisherRequestName>
                </Grid>
                <Grid item>
                    <PinBtn
                        id={"approve-become-speaker-"+streamId}
                        data-testid={"approve-become-speaker-"+streamId}
                        sx={{ minWidth: "unset", pt: 1, pb: 1 }}
                        onClick={() => {props?.approveBecomeSpeakerRequest(streamId);}}
                    >
                        Allow
                    </PinBtn>

                    <PinBtn
                        id={"reject-become-speaker-"+streamId}
                        data-testid={"reject-become-speaker-"+streamId}
                        sx={{ minWidth: "unset", pt: 1, pb: 1 }}
                        onClick={() => {props?.rejectBecomeSpeakerRequest(streamId);}}
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
                    <SvgIcon size={28} name="participants" color={theme.palette?.participantListIcon?.primary}/>
                    <PublisherRequestName
                        variant="body2"
                        style={{marginLeft: 8, fontWeight: 500, color: theme.palette?.participantListIcon?.primary}}
                    >
                        {props?.requestSpeakerList.length}
                    </PublisherRequestName>
                </Grid>
                {props?.requestSpeakerList.map((streamId) => {
                    if (props?.publishStreamId !== streamId) {
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