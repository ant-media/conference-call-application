import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import { styled } from '@mui/material/styles';
import { Grid, Typography } from '@mui/material';
import MessageInput from './MessageInput';
import { useTranslation } from 'react-i18next';
import MessagesTab from './MessagesTab';
import CloseDrawerButton from './DrawerButton';
import { ConferenceContext } from 'pages/AntMedia';
import { getAntDrawerStyle } from "../styles/themeUtil";

const AntDrawer = styled(Drawer)(({ theme }) => (getAntDrawerStyle(theme)));

const MessageGrid = styled(Grid)(({ theme }) => ({
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

const MessageDrawer = React.memo(props => {
  const conference = React.useContext(ConferenceContext);
  const { t } = useTranslation();

  return (
    <AntDrawer transitionDuration={200} anchor={'right'} id="message-drawer" open={conference.messageDrawerOpen} variant="persistent">
      <MessageGrid container direction="column" style={{ flexWrap: 'nowrap', height: '100%', overflow: 'hidden' }}>
        <Grid item container justifyContent="space-between" alignItems="center">
          {t('MESSAGES')}
          <CloseDrawerButton />
        </Grid>
        <Grid item container justifyContent="space-between" alignItems="center" style={{ flex: '1 1 auto', overflowY: 'hidden' }}>
          <TabGrid container sx={{ pb: 0 }} direction={'column'}>
            <MessagesTab messages={conference.messages} />
          </TabGrid>
        </Grid>

        {conference.isPlayOnly === false ?
          <MessageInput />
          : <Typography variant="body2" sx={{ px: 1.5, py: 0.5, fontSize: 12, fontWeight: 700 }} color="#fff">
            {t('You cannot send message in play only mode')}
          </Typography>}
      </MessageGrid>
    </AntDrawer>
  );
});

export default MessageDrawer;