
import * as React from 'react';
import {useContext} from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import useMediaQuery from '@mui/material/useMediaQuery';
import {useTheme} from '@mui/material/styles';
import {ConferenceContext} from "../pages/AntMedia";

export default function BecomePublisherConfirmationDialog() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const conference = useContext(ConferenceContext);

  const handleClose = () => {
    conference?.setBecomePublisherConfirmationDialogOpen(false);
  };

  const approveBecomePublisher = () => {
    conference?.setBecomePublisherConfirmationDialogOpen(false);
    conference?.handleStartBecomePublisher();
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      open={conference?.isBecomePublisherConfirmationDialogOpen}
      onClose={handleClose}
      aria-labelledby="responsive-dialog-title"
    >
      <DialogContent>
        <DialogContentText>
          Your request to become a publisher has been approved. Do you want to join the call?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleClose}>
          No
        </Button>
        <Button onClick={approveBecomePublisher} autoFocus>
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
