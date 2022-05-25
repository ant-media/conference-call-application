import { Grid, Typography } from "@mui/material";
import { Box } from "@mui/system";
import React from "react";
import Link from "@mui/material/Link";

function Home(props) {
  return (
    <>
      <Grid container justifyContent={"center"}>
        <Box py={8}>
          <Typography variant="h1" align="center">
            ANT MEDIA LANDING
          </Typography>
          <Box py={4}>
            <Typography variant="h4" align="center">
              we are going to create meetings from here
            </Typography>
          </Box>
        </Box>
        <Grid container justifyContent={"center"}>
          <Link
            href={`/room99`}
            size="large"
            variant="contained"
            color="primary"
          >
            Create Meeting
          </Link>
        </Grid>
      </Grid>
    </>
  );
}

export default Home;
