import React from 'react';
import PropTypes from 'prop-types';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import { ConferenceContext } from 'pages/AntMedia';
import { Grid, Hidden, MenuItem, useMediaQuery } from '@mui/material';
import { SvgIcon } from 'Components/SvgIcon';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

const AntDialogTitle = props => {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle {...other}>
      {children}
      {onClose ? (
        <Button
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 26,
            top: 27,
          }}
        >
          <SvgIcon size={30} name={'close'} color={'white'} />
        </Button>
      ) : null}
    </DialogTitle>
  );
};

// Memoized SettingsDialog component
const SettingsDialog = React.memo((props) => {
  const { t } = useTranslation();
  const { onClose, selectedValue, open, selectFocus } = props;
  const conference = React.useContext(ConferenceContext);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  const handleClose = React.useCallback(() => {
    onClose(selectedValue);
  }, [onClose, selectedValue]);

  const switchVideoMode = React.useCallback((value) => {
    conference.cameraSelected(value);
  }, [conference]);

  const switchAudioMode = React.useCallback((value) => {
    conference.microphoneSelected(value);
  }, [conference]);

  const setBackground = React.useCallback((value) => {
    conference.setSelectedBackgroundMode(value);
    conference.handleBackgroundReplacement(value);
  }, [conference]);

  React.useEffect(() => {
    if (conference.devices) {
      const camera = conference.devices.find(d => d.kind === 'videoinput');
      const audio = conference.devices.find(d => d.kind === 'audioinput');
      if (camera && (conference.selectedCamera === '' || conference.selectedCamera === null)) conference.cameraSelected(camera.deviceId);
      if (audio && (conference.selectedMicrophone === '' || conference.selectedMicrophone === null)) conference.microphoneSelected(audio.deviceId);
      if (conference.selectedBackgroundMode === '') conference.setSelectedBackgroundMode('none');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conference.devices]);

  return (
    <Dialog onClose={handleClose} open={open} fullScreen={fullScreen} maxWidth={'sm'}>
      <AntDialogTitle onClose={handleClose}>{t('Set Camera and Microphone')}</AntDialogTitle>
      <DialogContent>
        {/* ... (rest of your component code) */}
      </DialogContent>
    </Dialog>
  );
});

SettingsDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

export default SettingsDialog;
