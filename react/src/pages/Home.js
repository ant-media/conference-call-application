import { Grid, Typography } from '@mui/material';
import { Box } from '@mui/system';
import React from 'react';
import Link from '@mui/material/Link';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { nanoid } from 'nanoid';

function Home(props) {
  const { t } = useTranslation();
  return (
    <>
      <Grid container justifyContent={"center"} sx={{ mt: 8 }}>
        <Box py={8}>
          <Typography variant="h1" align="center">
            Join our meeting room
          </Typography>
          <Box sx={{ pt: 4, pb: 0 }}>
            <Typography variant="h4" align="center">
              Real-time meetings by Ant Media
            </Typography>
          </Box>
        </Box>
        <Grid container justifyContent={'center'}>
          <Link component={RouterLink} to={`/${nanoid(8)}`} size="large" variant="contained" color="primary">
            {t('Create Meeting')}
          </Link>
        </Grid>
      </Grid>
    </>
  );
}

export default Home;
