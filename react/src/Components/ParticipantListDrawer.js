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

const ParticipantListDrawer = React.memo(({
                                            globals,
                                            isAdmin,
                                            pinVideo,
                                            makeListenerAgain,
                                            videoTrackAssignments,
                                            presenterButtonStreamIdInProcess,
                                            presenterButtonDisabled,
                                            makeParticipantPresenter,
                                            makeParticipantUndoPresenter,
                                            participantCount,
                                            isMyMicMuted,
                                            publishStreamId,
                                            muteLocalMic,
                                            turnOffYourMicNotification,
                                            setParticipantIdMuted,
                                            pagedParticipants,
                                            updateAllParticipantsPagination,
                                            participantListDrawerOpen,
                                          }) => {
  const { t } = useTranslation();


  return (
    <AntDrawer transitionDuration={200} anchor={'right'} id="message-drawer" open={participantListDrawerOpen} variant="persistent">
      <ParticipantListGrid container direction="column" style={{ flexWrap: 'nowrap', height: '100%', overflow: 'hidden' }}>
        <Grid item container justifyContent="space-between" alignItems="center">
          {t('PARTICIPANTS')}
          <CloseDrawerButton />
        </Grid>
        <Grid item container justifyContent="space-between" alignItems="center" style={{ flex: '1 1 auto', overflowY: 'hidden' }}>
        <TabGrid container sx={{ pb: 0 }} direction={'column'}>
          <ParticipantTab
              globals={globals}
              isAdmin={isAdmin}
              pinVideo={(streamId) => pinVideo(streamId)}
              makeListenerAgain={(streamId) => makeListenerAgain(streamId)}
              videoTrackAssignments={videoTrackAssignments}
              presenterButtonStreamIdInProcess={presenterButtonStreamIdInProcess}
              presenterButtonDisabled={presenterButtonDisabled}
              makeParticipantPresenter={(streamId) => makeParticipantPresenter(streamId)}
              makeParticipantUndoPresenter={(streamId) => makeParticipantUndoPresenter(streamId)}
              participantCount={participantCount}
              isMyMicMuted={isMyMicMuted}
              publishStreamId={publishStreamId}
              muteLocalMic={()=>muteLocalMic()}
              turnOffYourMicNotification={(streamId) => turnOffYourMicNotification(streamId)}
              setParticipantIdMuted={(participant) => setParticipantIdMuted(participant)}
              pagedParticipants={pagedParticipants}
              updateAllParticipantsPagination={(value) => updateAllParticipantsPagination(value)}
          />
          </TabGrid>
        </Grid>
      </ParticipantListGrid>
    </AntDrawer>
  );
});

export default ParticipantListDrawer;