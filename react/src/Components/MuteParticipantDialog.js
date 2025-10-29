import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import useMediaQuery from '@mui/material/useMediaQuery';
import {useTheme} from '@mui/material/styles';

export default function MuteParticipantDialog({isMuteParticipantDialogOpen, setMuteParticipantDialogOpen, participantIdMuted, setParticipantIdMuted, turnOffYourMicNotification}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const handleClose = () => {
    setMuteParticipantDialogOpen(false);
    setParticipantIdMuted({streamName: "", streamId: ""});
  };

  const handleMute = () => {
    setMuteParticipantDialogOpen(false);
    turnOffYourMicNotification(participantIdMuted?.streamId);
    setParticipantIdMuted({streamName: "", streamId: ""});
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      open={isMuteParticipantDialogOpen}
      onClose={handleClose}
      aria-labelledby="responsive-dialog-title"
    >
      <DialogContent>
        <DialogContentText>
          Mute {participantIdMuted?.streamName} for everyone in the call?
          Only {participantIdMuted?.streamName} can unmute themselves.
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
