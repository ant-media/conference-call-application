import React, { useState, useCallback } from 'react';
import Drawer from '@mui/material/Drawer';
import { styled } from '@mui/material/styles';
import { Grid, Tabs, Tab } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ParticipantTab from './ParticipantTab';
import CloseDrawerButton from './DrawerButton';
import { ConferenceContext } from 'pages/AntMedia';
import { getRoomNameAttribute } from 'utils';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`drawer-tabpanel-${index}`} aria-labelledby={`drawer-tab-${index}`} {...other} style={{ height: '100%', width: '100%' }}>
      {value === index && children}
    </div>
  );
};

const getAntDrawerStyle = (theme) => {
  const roomNameAttribute = getRoomNameAttribute();

  return {
    '& .MuiDrawer-root': {
      position: 'absolute',
    },
    '& .MuiBackdrop-root': {
      backgroundColor: 'transparent',
    },
    '& .MuiPaper-root': {
      padding: 12,
      backgroundColor: 'transparent',
      position: 'absolute',
      boxShadow: 'unset',
      width: 360,
      border: 'unset',
      [theme.breakpoints.down('sm')]: {
        width: '100%',
        padding: 0,
        backgroundColor: roomNameAttribute ? theme.palette.themeColor[70] : theme.palette.themeColor[70],
      },
    },
  };
};

const AntDrawer = styled(Drawer)(({ theme }) => getAntDrawerStyle(theme));

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

const ParticipantListDrawer = React.memo(() => {
  const [value, setValue] = useState(0);
  const conference = React.useContext(ConferenceContext);
  const { t } = useTranslation();

  const handleChange = useCallback((event, newValue) => {
    setValue(newValue);
  }, []);

  const a11yProps = useCallback((index) => {
    return {
      id: `drawer-tab-${index}`,
      'aria-controls': `drawer-tabpanel-${index}`,
    };
  }, []);

  return (
    <AntDrawer transitionDuration={200} anchor={'right'} id="message-drawer" open={conference.participantListDrawerOpen} variant="persistent">
      <ParticipantListGrid container direction="column" style={{ flexWrap: 'nowrap', height: '100%', overflow: 'hidden' }}>
        <Grid item container justifyContent="space-between" alignItems="center">
          <Tabs
            TabIndicatorProps={{
              sx: {
                display: 'none',
              },
            }}
            value={value}
            onChange={handleChange}
            aria-label="participant tab"
          >
            <Tab disableRipple sx={{ color: '#ffffff80', p: 1, pl: 0 }} label={t('Participants')} {...a11yProps(0)} />
          </Tabs>
          <CloseDrawerButton />
        </Grid>
        <Grid item container justifyContent="space-between" alignItems="center" style={{ flex: '1 1 auto', overflowY: 'hidden' }}>
          <TabPanel value={value} index={0}>
            <TabGrid container>
              <ParticipantTab />
            </TabGrid>
          </TabPanel>
        </Grid>
      </ParticipantListGrid>
    </AntDrawer>
  );
});

export default ParticipantListDrawer;
