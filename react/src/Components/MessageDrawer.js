import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import { SettingsContext } from 'pages/AntMedia';
import { styled } from '@mui/material/styles';
import { Button, Grid, Typography, useTheme } from '@mui/material';
import { SvgIcon } from './SvgIcon';
import MessageCard from './Cards/MessageCard';
import MessageInput from './MessageInput';
import { useTranslation } from 'react-i18next';


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
  padding: '27px 16px 16px 24px',
  background: theme.palette.green[70],
  borderRadius: 10,
}));
export default function MessageDrawer() {
  const settings = React.useContext(SettingsContext);

  const theme = useTheme();
  const {t} = useTranslation();

  return (
    <AntDrawer transitionDuration={200} anchor={'right'} id="message-drawer" open={settings?.drawerOpen} variant="persistent">
      <MessageGrid container direction={'column'} style={{ height: 'calc( 100% - 80px )' }}>
        <Grid container justifyContent={'space-between'} alignItems="center">
          <Typography variant="h6" fontWeight={400} style={{fontSize:18}}>
            {t('Messages')}
          </Typography>
          <Button onClick={() => settings?.handleDrawerOpen(false)}>
            <SvgIcon size={24} name={'close'} color={'white'} />
          </Button>
        </Grid>
        <TextContainer container sx={{ mt: 4 }}>
          <Typography color={theme.palette.green[0]} style={{fontSize:12}} variant="body2" align="center">
          {t('MessagesInfo')}
          </Typography>
        </TextContainer>
        <Grid container sx={{ mt: 4 }} style={{ height: 'calc( 100% - 208px )' }} id="paper-props">
          <Grid item xs={12}>
            {settings?.messages.map((m, index) => (
              <Grid item key={index} xs={12}>
                {console.log('m',m)}
                <MessageCard date={m.date} isMe={m?.eventType ? false : true} name={m.name} message={m.message} />
              </Grid>
            ))}
          </Grid>
        </Grid>
        <MessageInput />
      </MessageGrid>
    </AntDrawer>
  );
}
