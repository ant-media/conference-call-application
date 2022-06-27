import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import { SettingsContext } from 'pages/AntMedia';
import { styled } from '@mui/material/styles';
import { Button, Grid, Typography, useTheme, Tabs, Tab } from '@mui/material';
import { SvgIcon } from './SvgIcon';
import MessageCard from './Cards/MessageCard';
import MessageInput from './MessageInput';
import { useTranslation } from 'react-i18next';
import ParticipantTab from './ParticipantTab';

const AntDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiBackdrop-root': {
    backgroundColor: 'transparent',
  },
  '& .MuiPaper-root': {
    padding: 12,
    backgroundColor: 'transparent',
    boxShadow: 'unset',
    width: 360,
    border: 'unset',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      padding: 0,
      backgroundColor: theme.palette.green70,
    },
  },
}));
const TextContainer = styled(Grid)(({ theme }) => ({
  padding: '10px 18px 8px 18px',
  background: theme.palette.green[60],
  borderRadius: 6,
  color: theme.palette.green[0],
}));

const MessageGrid = styled(Grid)(({ theme }) => ({
  position: 'relative',
  padding: 16,
  background: theme.palette.green[70],
  borderRadius: 10,
}));
const TabGrid = styled(Grid)(({ theme }) => ({
  position: 'relative',
  height: '100%',
  paddingBottom: 16,
  paddingTop: 16,
  flexWrap: 'nowrap',
}));

const MessageDrawer = React.memo(props => {
  const settings = React.useContext(SettingsContext);

  const { drawerOpen } = settings;
  const [value, setValue] = React.useState(0);
  const { allParticipants } = props;

  const theme = useTheme();
  const { t } = useTranslation();

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const TabPanel = props => {
    const { children, value, index, ...other } = props;

    return (
      <div role="tabpanel" hidden={value !== index} id={`drawer-tabpanel-${index}`} aria-labelledby={`drawer-tab-${index}`} {...other} style={{ height: '100%', width: '100%' }}>
        {value === index && children}
      </div>
    );
  };

  function a11yProps(index) {
    return {
      id: `drawer-tab-${index}`,
      'aria-controls': `drawer-tabpanel-${index}`,
    };
  }

  return (
    <AntDrawer transitionDuration={200} anchor={'right'} id="message-drawer" open={drawerOpen} variant="persistent">
      <MessageGrid container direction="column" style={{ flexWrap: 'nowrap', height: '100%', overflow: 'hidden' }}>
        <Grid item container justifyContent="space-between" alignItems="center">
          <Tabs
            TabIndicatorProps={{
              sx: {
                display: 'none',
              },
            }}
            value={value}
            onChange={handleChange}
            aria-label="messages and participant tabs"
          >
            <Tab disableRipple sx={{ color: '#ffffff80', p: 1, pl: 0 }} label={t('Messages')} {...a11yProps(0)} />
            <Tab disableRipple sx={{ color: '#ffffff80', p: 1, pl: 0 }} label={t('Participants')} {...a11yProps(1)} />
          </Tabs>
          <Button sx={{ minWidth: 30 }} onClick={() => settings?.handleDrawerOpen(false)}>
            <SvgIcon size={24} name={'close'} color={'white'} />
          </Button>
        </Grid>
        <Grid item container justifyContent="space-between" alignItems="center" style={{ flex: '1 1 auto', overflowY: 'hidden' }}>
          <TabPanel value={value} index={0}>
            <TabGrid container sx={{ pb: 0 }} direction={'column'}>
              <TextContainer item container>
                <Typography color={theme.palette.green[0]} style={{ fontSize: 12 }} variant="body2" align="center">
                  {t('Messages can only be seen by people in the call and are deleted when the call ends')}
                </Typography>
              </TextContainer>
              <Grid item container sx={{ mt: 1 }} id="paper-props" style={{ flexWrap: 'nowrap', flex: 'auto', overflowY: 'auto' }}>
                {' '}
                <Grid item xs={12}>
                  {settings?.messages.map((m, index) => (
                    <Grid item key={index} xs={12}>
                      <MessageCard date={m.date} isMe={m?.eventType ? false : true} name={m.name} message={m.message} />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </TabGrid>
          </TabPanel>
          <TabPanel value={value} index={1}>
            <TabGrid container>
              <ParticipantTab allParticipants={allParticipants} />
            </TabGrid>
          </TabPanel>
        </Grid>
        {value === 0 && <MessageInput />}
      </MessageGrid>
    </AntDrawer>
  );
});
export default MessageDrawer;
