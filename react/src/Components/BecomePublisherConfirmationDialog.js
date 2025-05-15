import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import useMediaQuery from '@mui/material/useMediaQuery';
import {useTheme} from '@mui/material/styles';

export default function BecomePublisherConfirmationDialog(props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const handleClose = () => {
    props?.setBecomePublisherConfirmationDialogOpen(false);
  };

  const approveBecomePublisher = () => {
    props?.setBecomePublisherConfirmationDialogOpen(false);
    props?.handleStartBecomePublisher();
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      open={props?.isBecomePublisherConfirmationDialogOpen}
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
