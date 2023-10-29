import { Grid, Typography } from '@mui/material';
import { Box } from '@mui/system';
import React from 'react';
import Link from '@mui/material/Link';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { getRoomNameAttribute ,getRootAttribute } from "../utils";

function Home(props) {
  const { t } = useTranslation();
  //change the path to ba the room name same as the attribute 
  const roomName = getRootAttribute("data-room-name");

  console.log("roomName ->>",roomName);
  return (
    <>
      <Grid container justifyContent={"center"} >
        <Box py={5}>
          <Typography variant="h3" align="center">
          {/* <Link component={RouterLink} to={`/${nanoid(8)}`} size="large" variant="contained" color="primary"> */}
          <Link component={RouterLink} to={`/${roomName}`} size="large" variant="contained" color="primary">
            {t('Start')}
          </Link>
          </Typography>

        </Box>
     
      </Grid>
    </>
  );
}

export default Home;