import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import { styled } from '@mui/material/styles';
import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ParticipantTab from './ParticipantTab';
import CloseDrawerButton from './DrawerButton';
import { ConferenceContext } from 'pages/AntMedia';
import { getAntDrawerStyle } from "../styles/themeUtil";

const AntDrawer = styled(Drawer)(({ theme }) => (getAntDrawerStyle(theme)));

const ParticipantListGrid = styled(Grid)(({ theme }) => ({
  position: 'relative',
  padding: 16,
  background: theme.palette.themeColor[70],
  borderRadius: 10,
}));

const TabGrid = styled(Grid)(({ theme }) => ({
  position: 'relative',
  height: '100%',
  paddingBottom: 16,
  paddingTop: 16,
  flexWrap: 'nowrap',
}));

const ParticipantListDrawer = React.memo(props => {
  const conference = React.useContext(ConferenceContext);

  const { t } = useTranslation();


  return (
    <AntDrawer transitionDuration={200} anchor={'right'} id="message-drawer" open={conference.participantListDrawerOpen} variant="persistent">
      <ParticipantListGrid container direction="column" style={{ flexWrap: 'nowrap', height: '100%', overflow: 'hidden' }}>
        <Grid item container justifyContent="space-between" alignItems="center">
          {t('PARTICIPANTS')}
          <CloseDrawerButton />
        </Grid>
        <Grid item container justifyContent="space-between" alignItems="center" style={{ flex: '1 1 auto', overflowY: 'hidden' }}>
        <TabGrid container sx={{ pb: 0 }} direction={'column'}>
          <ParticipantTab />
          </TabGrid>
        </Grid>
      </ParticipantListGrid>
    </AntDrawer>
  );
});

export default ParticipantListDrawer;