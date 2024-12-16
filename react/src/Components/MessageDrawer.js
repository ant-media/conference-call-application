import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import { styled } from '@mui/material/styles';
import {Grid, Tabs, Tab, Typography} from '@mui/material';
import MessageInput from './MessageInput';
import { useTranslation } from 'react-i18next';
import MessagesTab from './MessagesTab';
import CloseDrawerButton from './DrawerButton';
import {getAntDrawerStyle} from "../styles/themeUtil";

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
  const [value, setValue] = React.useState(0);

  const { t } = useTranslation();

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const TabPanel = React.useMemo(() => {
    return (props) => {
      const { children, value, index, } = props;
      return (
        <div role="tabpanel" hidden={value !== index} id={`drawer-tabpanel-${index}`} aria-labelledby={`drawer-tab-${index}`} style={{ height: '100%', width: '100%', overflowY: 'auto' }}>
          {value === index && children}
        </div>
      );
    };
  }, []);


  function a11yProps(index) {
    return {
      id: `drawer-tab-${index}`,
      'aria-controls': `drawer-tabpanel-${index}`,
    };
  }

return (
        <AntDrawer transitionDuration={200} anchor={'right'} id="message-drawer" open={props.messageDrawerOpen} variant="persistent">
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
              </Tabs>
              <CloseDrawerButton
                  handleMessageDrawerOpen={props?.handleMessageDrawerOpen}
                  handleParticipantListOpen={props?.handleParticipantListOpen}
                  handleEffectsOpen={props?.handleEffectsOpen}
                  setPublisherRequestListDrawerOpen={props?.setPublisherRequestListDrawerOpen}
              />
            </Grid>
            <Grid item container justifyContent="space-between" alignItems="center" style={{ flex: '1 1 auto', overflowY: 'hidden' }}>
              <TabPanel value={value} index={0}>
                <TabGrid container sx={{ pb: 0 }} direction={'column'}>
                  <MessagesTab messages={props.messages}/>
                </TabGrid>
              </TabPanel>
            </Grid>

            {/*props.isPlayOnly === false &&*/ value === 0 ?
            <MessageInput
                handleSendMessage={(message) => props.sendMessage(message)}
                handleSetMessages={(messages) => props.handleSetMessages(messages)}
            />
                : <Typography variant="body2" sx={{px: 1.5, py: 0.5, fontSize: 12, fontWeight: 700}} color="#fff">
                  {t('You cannot send message in play only mode')}
                </Typography>}
          </MessageGrid>
        </AntDrawer>
    );
});
export default MessageDrawer;
