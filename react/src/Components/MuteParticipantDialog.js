import React, { useContext, useCallback } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { ConferenceContext } from '../pages/AntMedia';

export default function MuteParticipantDialog() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const conference = useContext(ConferenceContext);

  const handleClose = useCallback(() => {
    conference?.setMuteParticipantDialogOpen(false);
    conference?.setParticipantIdMuted({ streamName: '', streamId: '' });
  }, [conference]);

  const handleMute = useCallback(() => {
    conference?.setMuteParticipantDialogOpen(false);
    conference?.turnOffYourMicNotification(conference?.participantIdMuted?.streamId);
    conference?.setParticipantIdMuted({ streamName: '', streamId: '' });
  }, [conference]);

  return (
    <Dialog
      fullScreen={fullScreen}
      open={!!conference?.isMuteParticipantDialogOpen}
      onClose={handleClose}
      aria-labelledby="responsive-dialog-title"
    >
      <DialogContent>
        <DialogContentText>
          {`Mute ${conference?.participantIdMuted?.streamName} for everyone in the call? Only ${conference?.participantIdMuted?.streamName} can unmute themselves.`}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleMute} autoFocus>
          Mute
        </Button>
      </DialogActions>
    </Dialog>
  );
}
