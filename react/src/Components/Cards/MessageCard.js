import React from "react";
import { Grid, Typography } from "@mui/material";
import { urlify } from "utils";
import { styled } from "@mui/material/styles";

const HyperTypography = styled(Typography)(({ theme }) => ({
    '& a': {
        color: 'white'
    }
}));
function MessageCard(props) {
    const { date, name, message } = props;
    return (
        <Grid container sx={{ mb: 3 }}>
            <Grid container alignItems={"center"}>
                <Typography variant="body1" color="white">{name} </Typography><Typography variant="body2" color="white" sx={{ ml: 1 }}>{date}</Typography>
            </Grid>
            <Grid container sx={{ mt: 1 }}>
                <HyperTypography variant="body1" color="white" align="left" fontWeight={400} lineHeight={1.4}>{urlify(message)}</HyperTypography>
            </Grid>
        </Grid>
    );
}

export default MessageCard;
