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

  const switchVideoMode = React.useCallback((event) => {
    conference.cameraSelected(event.target.value);
  }, [conference]);

  const switchAudioMode = React.useCallback((event) => {
    conference.microphoneSelected(event.target.value);
  }, [conference]);

  const setBackground = React.useCallback((event) => {
    conference.setSelectedBackgroundMode(event.target.value);
    conference.handleBackgroundReplacement(event.target.value);
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
        <Box component="form" sx={{ display: 'flex', flexWrap: 'wrap' }}>
          <Grid container>
            <Grid container>
              <InputLabel>{t('Camera')}</InputLabel>
            </Grid>
            <Grid container alignItems={'center'} spacing={2}>
              <Grid item xs={10}>
                <Select
                  autoFocus={selectFocus === 'camera'}
                  fullWidth
                  id="demo-dialog-native"
                  variant="outlined"
                  value={conference.selectedCamera}
                  onChange={switchVideoMode}
                  sx={{ color: 'white' }}
                >
                  {conference.devices && conference.devices?.length > 0 && conference.devices
                    .filter(device => device.kind === 'videoinput')
                    .map(device => (
                      <MenuItem key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </MenuItem>
                    ))}
                </Select>
              </Grid>
              <Hidden xsDown>
                <Grid item>
                  <SvgIcon size={30} name={'camera'} color={'white'} />
                </Grid>
              </Hidden>
            </Grid>
          </Grid>
          <Grid container sx={{ mt: 4 }}>
            <Grid container>
              <InputLabel>{t('Video Send resolution (maximum)')}</InputLabel>
            </Grid>
            <Grid container alignItems={'center'} spacing={2}>
              <Grid item xs={10}>
                <Select variant="outlined" fullWidth value={conference.videoSendResolution} onChange={e => conference.setVideoSendResolution(e.target.value)} sx={{ color: 'white' }}>
                  <MenuItem key="auto" value="auto">
                    {t('Auto')}
                  </MenuItem>
                  <MenuItem key="high-definition" value="highDefinition">
                    {t('High definition (720p)')}
                  </MenuItem>
                  <MenuItem key="standart-definition" value="standardDefinition">
                    {t('Standard definition (360p)')}
                  </MenuItem>
                  <MenuItem key="low-definition" value="lowDefinition">
                    {t('Low definition (180p)')}
                  </MenuItem>
                </Select>
              </Grid>
              <Hidden xsDown>
                <Grid item>
                  <SvgIcon size={36} name={'resolution'} color={'white'} />
                </Grid>
              </Hidden>
            </Grid>
          </Grid>
          <Grid container sx={{ mt: 4 }}>
            <Grid container>
              <InputLabel>{t('Microphone')}</InputLabel>
            </Grid>
            <Grid container alignItems={'center'} spacing={2}>
              <Grid item xs={10}>
                <Select autoFocus={selectFocus === 'audio'} variant="outlined" fullWidth value={conference.selectedMicrophone} onChange={switchAudioMode} sx={{ color: 'white' }}>
                  {conference.devices && conference.devices?.length > 0 && conference.devices
                    .filter(device => device.kind === 'audioinput')
                    .map(device => (
                      <MenuItem key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </MenuItem>
                    ))}
                </Select>
              </Grid>
              <Hidden xsDown>
                <Grid item>
                  <SvgIcon size={36} name={'microphone'} color={'white'} />
                </Grid>
              </Hidden>
            </Grid>
          </Grid>
          <Grid container sx={{ mt: 4 }}>
            <Grid container>
              <InputLabel>{t('Background')}</InputLabel>
            </Grid>
            <Grid container alignItems={'center'} spacing={2}>
              <Grid item xs={10}>
                <Select variant="outlined" fullWidth value={conference.selectedBackgroundMode} onChange={setBackground} sx={{ color: 'white' }}>
                  <MenuItem key="none" value="none">
                    {t('No Effect')}
                  </MenuItem>
                  <MenuItem key="blur" value="blur">
                    {t('Blur Background')}
                  </MenuItem>
                  <MenuItem key="background" value="background">
                    {t('Virtual Background')}
                  </MenuItem>
                </Select>
              </Grid>
              <Hidden xsDown>
                <Grid item>
                  <SvgIcon size={36} name={'background-replacement'} color={'white'} />
                </Grid>
              </Hidden>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  );
});

SettingsDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

export default SettingsDialog;
