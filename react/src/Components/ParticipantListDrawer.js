import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import { styled } from '@mui/material/styles';
import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ParticipantTab from './ParticipantTab';
import CloseDrawerButton from './DrawerButton';
import { getAntDrawerStyle } from "../styles/themeUtil";

const AntDrawer = styled(Drawer)(({ theme }) => (getAntDrawerStyle(theme)));

const ParticipantListGrid = styled(Grid)(({ theme }) => ({
  position: 'relative',
  padding: 16,
  background: theme.palette.themeColor?.[70],
  borderRadius: 10,
}));

const TabGrid = styled(Grid)(({ theme }) => ({
  position: 'relative',
  height: '100%',
  paddingBottom: 16,
  paddingTop: 16,
  flexWrap: 'nowrap',
}));

const ParticipantListDrawer = React.memo((props) => {
  const { t } = useTranslation();


  return (
    <AntDrawer transitionDuration={200} anchor={'right'} id="message-drawer" open={props?.participantListDrawerOpen} variant="persistent">
      <ParticipantListGrid container direction="column" style={{ flexWrap: 'nowrap', height: '100%', overflow: 'hidden' }}>
        <Grid item container justifyContent="space-between" alignItems="center">
          {t('PARTICIPANTS')}
          <CloseDrawerButton
              handleMessageDrawerOpen={(open)=>props?.handleMessageDrawerOpen(open)}
              handleParticipantListOpen={(open)=>props?.handleParticipantListOpen(open)}
              handleEffectsOpen={(open)=>props?.handleEffectsOpen(open)}
              setPublisherRequestListDrawerOpen={(open)=>props?.setPublisherRequestListDrawerOpen(open)}
          />
        </Grid>
        <Grid item container justifyContent="space-between" alignItems="center" style={{ flex: '1 1 auto', overflowY: 'hidden' }}>
        <TabGrid container sx={{ pb: 0 }} direction={'column'}>
          <ParticipantTab
              globals={props?.globals}
              isAdmin={props?.isAdmin}
              pinVideo={(streamId) => props?.pinVideo(streamId)}
              unpinVideo={props?.unpinVideo}
              makeListenerAgain={(streamId) => props?.makeListenerAgain(streamId)}
              videoTrackAssignments={props?.videoTrackAssignments}
              presenterButtonStreamIdInProcess={props?.presenterButtonStreamIdInProcess}
              presenterButtonDisabled={props?.presenterButtonDisabled}
              makeParticipantPresenter={(streamId) => props?.makeParticipantPresenter(streamId)}
              makeParticipantUndoPresenter={(streamId) => props?.makeParticipantUndoPresenter(streamId)}
              participantCount={props?.participantCount}
              isMyMicMuted={props?.isMyMicMuted}
              publishStreamId={props?.publishStreamId}
              muteLocalMic={()=>props?.muteLocalMic()}
              turnOffYourMicNotification={(streamId) => props?.turnOffYourMicNotification(streamId)}
              setParticipantIdMuted={(participant) => props?.setParticipantIdMuted(participant)}
              pagedParticipants={props?.pagedParticipants}
              loadMoreParticipants={props?.loadMoreParticipants}
              currentPinInfo={props?.currentPinInfo}
          />
          </TabGrid>
        </Grid>
      </ParticipantListGrid>
    </AntDrawer>
  );
});

export default ParticipantListDrawer;